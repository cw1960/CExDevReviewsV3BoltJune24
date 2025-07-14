import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReportAssignmentProblemRequest {
  assignment_id: string;
  extension_id: string;
  reporter_id: string;
  issue_type: string;
  description: string;
  cancel_assignment: boolean;
  extension_name: string;
  reporter_email: string;
}

// Helper function to add timeout to promises
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}

serve(async (req) => {
  console.log("🚀 report-assignment-problem function started");
  console.log("📝 Request method:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔍 Checking environment variables...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error("❌ Missing environment variables:", {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
        supabaseAnonKey: !!supabaseAnonKey,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing environment variables",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log("✅ Environment variables check passed");

    // Extract and validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing or invalid Authorization header",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    console.log("🔐 JWT token extracted, length:", jwt.length);

    console.log("📦 Parsing request body...");
    const requestData: ReportAssignmentProblemRequest = await req.json();

    const {
      assignment_id,
      extension_id,
      reporter_id,
      issue_type,
      description,
      cancel_assignment,
      extension_name,
      reporter_email,
    } = requestData;

    if (!assignment_id || !reporter_id || !issue_type || !description) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Missing required fields: assignment_id, reporter_id, issue_type, description",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Create clients
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT
    console.log("🔐 Verifying JWT token...");
    let authUser;
    try {
      const {
        data: { user: verifiedUser },
        error: authError,
      } = await withTimeout(
        supabaseAuth.auth.getUser(jwt),
        5000, // 5 seconds
        "JWT verification",
      );

      if (authError) {
        console.log("❌ JWT verification failed:", authError.message);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid or expired JWT token",
            details: authError.message,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          },
        );
      }

      if (!verifiedUser) {
        console.log("❌ No user returned from JWT verification");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid or expired JWT token",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
          },
        );
      }

      authUser = verifiedUser;
      console.log("✅ JWT verified successfully for user:", authUser.id);
    } catch (jwtError) {
      console.error("❌ JWT verification threw error:", jwtError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "JWT verification failed",
          details: jwtError?.message || "Unknown JWT error",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    // Security check: Ensure the authenticated user matches the reporter_id
    if (authUser.id !== reporter_id) {
      console.log(
        "🚫 Security violation: User attempted to report problem for different user",
      );
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Unauthorized: You can only report problems for your own assignments",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    // Verify the user owns this assignment
    console.log("🔍 Verifying assignment ownership...");
    const { data: assignment, error: assignmentError } = await supabaseService
      .from("review_assignments")
      .select("id, reviewer_id, extension_id, status")
      .eq("id", assignment_id)
      .eq("reviewer_id", reporter_id)
      .eq("status", "assigned")
      .single();

    if (assignmentError || !assignment) {
      console.error(
        "❌ Assignment verification failed:",
        assignmentError?.message,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Assignment not found or you do not have permission to report problems for this assignment",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        },
      );
    }

    console.log(`🔄 Processing problem report for assignment ${assignment_id}`);

    // 1. If cancelling assignment, update status to cancelled
    if (cancel_assignment) {
      console.log("❌ Cancelling assignment due to reported problem...");

      const { error: updateError } = await supabaseService
        .from("review_assignments")
        .update({
          status: "cancelled",
          admin_notes: `Assignment cancelled by reviewer due to: ${issue_type} - ${description}`,
        })
        .eq("id", assignment_id);

      if (updateError) {
        console.error("❌ Error updating assignment status:", updateError);
        throw updateError;
      }

      console.log("✅ Assignment status updated to cancelled");

      // Update extension status back to queued if this was the only assignment
      const { data: otherAssignments, error: checkError } =
        await supabaseService
          .from("review_assignments")
          .select("id")
          .eq("extension_id", extension_id)
          .neq("status", "cancelled");

      if (checkError) {
        console.error("❌ Error checking other assignments:", checkError);
        // Don't throw here, continue with logging
      } else if (!otherAssignments || otherAssignments.length === 0) {
        // No other active assignments, put extension back in queue
        const { error: extensionUpdateError } = await supabaseService
          .from("extensions")
          .update({ status: "queued" })
          .eq("id", extension_id);

        if (extensionUpdateError) {
          console.error(
            "❌ Error updating extension status:",
            extensionUpdateError,
          );
          // Don't throw here, continue with logging
        } else {
          console.log("✅ Extension status updated back to queued");
        }
      }
    }

    // 2. Log the problem report for admin review
    console.log("📝 Logging problem report...");

    const problemReportLog = {
      to_email: "cristo@cristolopez", // Could be from env variable
      type: "assignment_problem_report",
      status: "pending",
      subject: `Assignment Problem Report: ${extension_name}`,
      body: JSON.stringify({
        assignment_id,
        extension_id,
        extension_name,
        reporter_id,
        reporter_email,
        issue_type,
        description,
        cancel_assignment,
        timestamp: new Date().toISOString(),
        severity: cancel_assignment ? "high" : "medium",
      }),
      error_message: null,
    };

    const { error: logError } = await supabaseService
      .from("email_logs")
      .insert(problemReportLog);

    if (logError) {
      console.error("❌ Error logging problem report:", logError);
      throw logError;
    }

    console.log("✅ Problem report logged successfully");

    // 3. Send immediate email notification to admins
    console.log("📧 Sending email notification to admin...");
    try {
      const adminEmailHtml = `
        <h2>🚨 Assignment Problem Report</h2>
        <p><strong>Extension:</strong> ${extension_name}</p>
        <p><strong>Assignment ID:</strong> ${assignment_id}</p>
        <p><strong>Reporter:</strong> ${reporter_email}</p>
        <p><strong>Issue Type:</strong> ${issue_type}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Assignment Cancelled:</strong> ${cancel_assignment ? "Yes" : "No"}</p>
        <p><strong>Severity:</strong> ${cancel_assignment ? "High" : "Medium"}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        ${cancel_assignment ? "<p><strong>⚠️ URGENT:</strong> Assignment has been cancelled and extension has been returned to queue.</p>" : ""}
        
        <p>Please review this issue and take appropriate action.</p>
      `;

      const { error: emailError } = await supabaseService.functions.invoke(
        "send-email",
        {
          body: {
            to: "cristo@cristolopez",
            subject: `🚨 ${cancel_assignment ? "URGENT" : ""} Assignment Problem: ${extension_name}`,
            html: adminEmailHtml,
            type: "assignment_problem_report",
          },
        },
      );

      if (emailError) {
        console.error("❌ Failed to send admin email:", emailError);
        // Don't fail the whole operation if email fails
      } else {
        console.log("✅ Admin email notification sent successfully");
      }
    } catch (emailError) {
      console.error("❌ Error sending admin email:", emailError);
      // Don't fail the whole operation if email fails
    }

    const responseMessage = cancel_assignment
      ? "Assignment cancelled successfully and problem reported to admin team."
      : "Problem reported to admin team for review.";

    console.log("✅ Problem report processing completed");

    return new Response(
      JSON.stringify({
        success: true,
        message: responseMessage,
        cancelled: cancel_assignment,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("❌ Error in report-assignment-problem function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
