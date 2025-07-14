import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReviewSubmissionRequest {
  assignment_id: string;
  submitted_date: string;
  review_text: string;
  rating: number;
  chrome_store_proof: string;
  confirmed_submission: boolean;
}

serve(async (req) => {
  // EARLY LOGGING: Log that the function has been invoked
  console.log("🚀 process-submitted-review Edge Function invoked!");
  console.log("📝 Request method:", req.method);
  console.log("🌐 Request URL:", req.url);
  console.log("📋 Request headers:", Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ENVIRONMENT VARIABLE CHECKS
    console.log("🔍 Checking environment variables...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("🔗 SUPABASE_URL:", supabaseUrl ? "present" : "MISSING");
    console.log(
      "🔑 SUPABASE_SERVICE_ROLE_KEY:",
      supabaseServiceKey ? "present" : "MISSING",
    );

    if (!supabaseUrl) {
      console.error("❌ SUPABASE_URL environment variable is missing!");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: SUPABASE_URL not set",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    if (!supabaseServiceKey) {
      console.error(
        "❌ SUPABASE_SERVICE_ROLE_KEY environment variable is missing!",
      );
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log("✅ Environment variables check passed");

    // CREATE SUPABASE CLIENT
    console.log("🔧 Creating Supabase client...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("✅ Supabase client created successfully");

    // PARSE REQUEST BODY
    console.log("📦 Parsing request body...");
    let requestBody;
    try {
      requestBody = await req.json();
      console.log(
        "📋 Request body parsed:",
        JSON.stringify(requestBody, null, 2),
      );
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid JSON in request body",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const {
      assignment_id,
      submitted_date,
      review_text,
      rating,
      chrome_store_proof,
      confirmed_submission,
    }: ReviewSubmissionRequest = requestBody;

    // VALIDATE INPUT
    console.log("🔍 Validating input parameters...");
    console.log("📝 assignment_id:", assignment_id);
    console.log("📅 submitted_date:", submitted_date);
    console.log("📝 review_text length:", review_text?.length || 0);
    console.log("⭐ rating:", rating);
    console.log(
      "🔗 chrome_store_proof:",
      chrome_store_proof ? "present" : "missing",
    );
    console.log("✅ confirmed_submission:", confirmed_submission);

    if (
      !assignment_id ||
      !submitted_date ||
      !review_text ||
      !rating ||
      !chrome_store_proof ||
      !confirmed_submission
    ) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    if (review_text.length < 25) {
      console.error("❌ Review text too short:", review_text.length);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Review text must be at least 25 characters",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    if (rating < 1 || rating > 5) {
      console.error("❌ Invalid rating:", rating);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rating must be between 1 and 5",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log("✅ Input validation passed");

    // GET ASSIGNMENT DETAILS
    console.log("🔍 Fetching assignment details for ID:", assignment_id);
    const { data: assignment, error: assignmentError } = await supabase
      .from("review_assignments")
      .select(
        `
        *,
        extension:extensions(id, owner_id, name),
        reviewer:users(id, name, email)
      `,
      )
      .eq("id", assignment_id)
      .eq("status", "assigned")
      .single();

    if (assignmentError) {
      console.error("❌ Assignment fetch error:", assignmentError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Assignment not found or already processed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        },
      );
    }

    if (!assignment) {
      console.error("❌ Assignment not found");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Assignment not found or already processed",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        },
      );
    }

    console.log("✅ Assignment found:", {
      id: assignment.id,
      extension_name: assignment.extension?.name,
      reviewer_name: assignment.reviewer?.name,
      extension_owner_id: assignment.extension?.owner_id,
    });

    // START PROCESSING
    console.log("🔄 Starting review processing for assignment:", assignment_id);

    // 1. UPDATE REVIEW ASSIGNMENT
    console.log("📝 Step 1: Updating review assignment status to approved...");
    const { error: updateError } = await supabase
      .from("review_assignments")
      .update({
        review_text,
        rating,
        chrome_store_proof,
        status: "approved",
        submitted_at: submitted_date,
      })
      .eq("id", assignment_id);

    if (updateError) {
      console.error("❌ Error updating assignment:", updateError);
      throw updateError;
    }
    console.log("✅ Step 1 completed: Assignment updated successfully");

    // 2. UPDATE EXTENSION STATUS
    console.log("📝 Step 2: Updating extension status to reviewed...");
    const { error: extensionUpdateError } = await supabase
      .from("extensions")
      .update({ status: "reviewed" })
      .eq("id", assignment.extension_id);

    if (extensionUpdateError) {
      console.error(
        "❌ Error updating extension status:",
        extensionUpdateError,
      );
      throw extensionUpdateError;
    }
    console.log("✅ Step 2 completed: Extension status updated successfully");

    // 3. AWARD CREDIT
    console.log("📝 Step 3: Awarding credit to reviewer...");
    const { error: creditError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: assignment.reviewer_id,
        amount: 1,
        type: "earned",
        description: `Review completed for ${assignment.extension.name}`,
      });

    if (creditError) {
      console.error("❌ Error awarding credit:", creditError);
      throw creditError;
    }
    console.log("✅ Step 3 completed: Credit awarded successfully");

    // 4. CREATE REVIEW RELATIONSHIP (CRITICAL FOR YOUR ISSUE)
    console.log("📝 Step 4: Creating review relationship...");
    console.log("🔗 Relationship details:", {
      reviewer_id: assignment.reviewer_id,
      reviewed_owner_id: assignment.extension.owner_id,
      extension_id: assignment.extension_id,
    });

    const { data: relationshipData, error: relationshipError } = await supabase
      .from("review_relationships")
      .insert({
        reviewer_id: assignment.reviewer_id,
        reviewed_owner_id: assignment.extension.owner_id,
        extension_id: assignment.extension_id,
      })
      .select();

    if (relationshipError) {
      console.error(
        "❌ Error creating review relationship:",
        relationshipError,
      );
      console.error("❌ Relationship error details:", {
        code: relationshipError.code,
        message: relationshipError.message,
        details: relationshipError.details,
        hint: relationshipError.hint,
      });
      // Don't throw here as this might be a duplicate, but log it
    } else {
      console.log(
        "✅ Step 4 completed: Review relationship created successfully",
      );
      console.log("📋 Relationship data:", relationshipData);
    }

    // 5. CHECK BATCH COMPLETION
    console.log("📝 Step 5: Checking if batch is completed...");
    const { data: batchAssignments, error: batchError } = await supabase
      .from("review_assignments")
      .select("status")
      .eq("batch_id", assignment.batch_id);

    if (batchError) {
      console.error("❌ Error checking batch assignments:", batchError);
    } else if (batchAssignments) {
      console.log("📋 Batch assignments:", batchAssignments);
      const allApproved = batchAssignments.every(
        (a) => a.status === "approved",
      );

      if (allApproved) {
        console.log(
          "🎉 All assignments in batch are approved, marking batch as completed...",
        );
        const { error: batchUpdateError } = await supabase
          .from("assignment_batches")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            credits_earned: batchAssignments.length,
          })
          .eq("id", assignment.batch_id);

        if (batchUpdateError) {
          console.error("❌ Error updating batch status:", batchUpdateError);
        } else {
          console.log("✅ Step 5 completed: Batch marked as completed");
        }
      } else {
        console.log(
          "⏳ Batch not yet completed, some assignments still pending",
        );
      }
    }

    console.log("🎉 Review processing completed successfully!");

    // 6. TRIGGER EMAIL TO EXTENSION OWNER
    try {
      console.log("📧 Triggering MailerLite event for extension owner...");
      const { data: extensionOwnerData, error: ownerError } = await supabase
        .from("users")
        .select("email, name")
        .eq("id", assignment.extension.owner_id)
        .single();

      if (!ownerError && extensionOwnerData?.email) {
        const { error: mailerLiteOwnerError } = await supabase.functions.invoke(
          "mailerlite-integration",
          {
            body: {
              user_email: extensionOwnerData.email,
              event_type: "extension_reviewed_owner",
              custom_data: {
                extension_name: assignment.extension.name,
                owner_name: extensionOwnerData.name,
                reviewer_name: assignment.reviewer.name,
                rating: rating,
                review_text_snippet:
                  review_text.substring(0, 100) +
                  (review_text.length > 100 ? "..." : ""),
                review_completion_date: new Date().toISOString(),
                chrome_store_proof: chrome_store_proof,
              },
            },
          },
        );

        if (mailerLiteOwnerError) {
          console.error(
            "❌ MailerLite error for extension owner:",
            mailerLiteOwnerError,
          );
        } else {
          console.log(
            "✅ MailerLite extension reviewed event triggered for owner",
          );
        }
      } else {
        console.log(
          "⚠️ No extension owner email available for MailerLite event",
        );
      }
    } catch (mailerLiteOwnerError) {
      console.error(
        "❌ Failed to trigger MailerLite extension reviewed event for owner:",
        mailerLiteOwnerError,
      );
      // Don't fail the review process if MailerLite fails
    }

    // Trigger MailerLite event for review completion
    try {
      console.log("📧 Triggering MailerLite review completion event...");
      if (assignment.reviewer?.email) {
        const { error: mailerLiteError } = await supabase.functions.invoke(
          "mailerlite-integration",
          {
            body: {
              user_email: assignment.reviewer.email,
              event_type: "review_completed",
              custom_data: {
                extension_name: assignment.extension.name,
                reviewer_name: assignment.reviewer.name,
                rating: rating,
                credits_earned: 1,
                completion_date: new Date().toISOString(),
              },
            },
          },
        );

        if (mailerLiteError) {
          console.error("❌ MailerLite error:", mailerLiteError);
        } else {
          console.log("✅ MailerLite review completion event triggered");
        }
      } else {
        console.log("⚠️ No reviewer email available for MailerLite event");
      }
    } catch (mailerLiteError) {
      console.error(
        "❌ Failed to trigger MailerLite review completion event:",
        mailerLiteError,
      );
      // Don't fail the review process if MailerLite fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Review submitted and approved successfully",
        credits_earned: 1,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("💥 CRITICAL ERROR in process-submitted-review function:", {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });

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
