import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CancelAssignmentRequest {
  assignment_id: string;
  admin_key: string;
  reason?: string;
}

serve(async (req) => {
  console.log("🚀 admin-cancel-assignment function started");

  if (req.method === "OPTIONS") {
    console.log("✅ OPTIONS request - returning CORS headers");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("📥 Parsing request body...");
    const { assignment_id, admin_key, reason }: CancelAssignmentRequest =
      await req.json();

    // Admin key check
    console.log("🔑 Checking admin key...");
    if (admin_key !== "chrome_ex_dev_admin_2025") {
      console.log("❌ Invalid admin key provided");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid admin key" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    if (!assignment_id) {
      console.log("❌ Missing assignment_id");
      return new Response(
        JSON.stringify({ success: false, error: "Assignment ID is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log(
      "✅ Admin authenticated, processing assignment:",
      assignment_id,
    );

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("❌ Missing environment variables");
      return new Response(
        JSON.stringify({ success: false, error: "Missing config" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Create client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get assignment details first
    console.log("🔍 Fetching assignment details...");
    const { data: assignment, error: assignmentError } = await supabase
      .from("review_assignments")
      .select(
        `
        id,
        extension_id,
        reviewer_id,
        assignment_number,
        status,
        due_at,
        extension:extensions!review_assignments_extension_id_fkey(
          id,
          name,
          owner_id,
          status
        ),
        reviewer:users!review_assignments_reviewer_id_fkey(
          id,
          name,
          email
        )
      `,
      )
      .eq("id", assignment_id)
      .single();

    if (assignmentError || !assignment) {
      console.log("❌ Assignment not found:", assignmentError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Assignment not found",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        },
      );
    }

    // Check if assignment can be cancelled
    if (assignment.status !== "assigned") {
      console.log(
        "❌ Assignment cannot be cancelled, current status:",
        assignment.status,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: `Assignment cannot be cancelled (current status: ${assignment.status})`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log("✅ Assignment found and can be cancelled:", {
      extension_name: assignment.extension?.name,
      reviewer_name: assignment.reviewer?.name,
      assignment_number: assignment.assignment_number,
    });

    // 2. Cancel the assignment
    console.log("❌ Cancelling assignment...");
    const adminNotes = reason
      ? `Assignment cancelled by admin. Reason: ${reason}`
      : "Assignment cancelled by admin due to reviewer delay";

    const { error: updateError } = await supabase
      .from("review_assignments")
      .update({
        status: "cancelled",
        admin_notes: adminNotes,
      })
      .eq("id", assignment_id);

    if (updateError) {
      console.log("❌ Failed to cancel assignment:", updateError.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to cancel assignment",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log("✅ Assignment cancelled successfully");

    // 3. Put extension back in queue (in first position by updating submitted_to_queue_at to current time)
    console.log("🔄 Putting extension back in queue...");
    const { error: extensionUpdateError } = await supabase
      .from("extensions")
      .update({
        status: "queued",
        submitted_to_queue_at: new Date().toISOString(), // Current time puts it at front of queue
      })
      .eq("id", assignment.extension_id);

    if (extensionUpdateError) {
      console.log(
        "❌ Failed to update extension status:",
        extensionUpdateError.message,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to put extension back in queue",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log("✅ Extension put back in queue");

    // 4. Log the admin action for audit trail
    console.log("📝 Logging admin action...");
    const logMessage = {
      action: "assignment_cancelled",
      assignment_id: assignment_id,
      assignment_number: assignment.assignment_number,
      extension_id: assignment.extension_id,
      extension_name: assignment.extension?.name,
      reviewer_id: assignment.reviewer_id,
      reviewer_name: assignment.reviewer?.name,
      reviewer_email: assignment.reviewer?.email,
      reason: reason || "Reviewer delay",
      admin_notes: adminNotes,
      timestamp: new Date().toISOString(),
    };

    const { error: logError } = await supabase.from("email_logs").insert({
      to_email: "cristo@cristolopez",
      type: "admin_assignment_cancel",
      status: "completed",
      subject: `Admin Cancelled Assignment #${assignment.assignment_number}`,
      body: JSON.stringify(logMessage),
      error_message: null,
    });

    if (logError) {
      console.log("❌ Failed to log admin action:", logError.message);
      // Don't fail the whole operation for this
    } else {
      console.log("✅ Admin action logged successfully");
    }

    console.log("🎉 Assignment cancellation completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: `Assignment #${assignment.assignment_number} cancelled successfully. Extension "${assignment.extension?.name}" has been returned to the front of the queue.`,
        data: {
          assignment_number: assignment.assignment_number,
          extension_name: assignment.extension?.name,
          reviewer_name: assignment.reviewer?.name,
          reviewer_email: assignment.reviewer?.email,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.log("💥 Error in admin-cancel-assignment function:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
