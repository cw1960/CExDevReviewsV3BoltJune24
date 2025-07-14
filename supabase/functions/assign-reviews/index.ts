import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AssignReviewsRequest {
  max_assignments?: number;
}

interface ExtensionWithOwner {
  id: string;
  name: string;
  owner_id: string;
  submitted_to_queue_at: string;
  owner: {
    id: string;
    name: string;
    email: string;
    subscription_status: string | null;
  };
}

serve(async (req) => {
  console.log("🚀 assign-reviews Edge Function invoked!");
  console.log("📝 Request method:", req.method);
  console.log("🌐 Request URL:", req.url);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔍 Checking environment variables...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing environment variables:", {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { max_assignments = 10 }: AssignReviewsRequest = await req
      .json()
      .catch(() => ({}));

    console.log("Starting review assignment process with freemium logic...");

    // 1. Get extensions that need review assignments with owner subscription status (FIFO order)
    const { data: extensionsNeedingReview, error: extensionsError } =
      await supabase
        .from("extensions")
        .select(
          `
        id,
        name,
        owner_id,
        submitted_to_queue_at,
        owner:users!extensions_owner_id_fkey(
          id,
          name,
          email,
          subscription_status
        )
      `,
        )
        .eq("status", "queued")
        .order("submitted_to_queue_at", { ascending: true }) // FIFO: First in, first out
        .limit(max_assignments * 2); // Fetch more to ensure we have enough for both queues

    if (extensionsError) {
      console.error("Error fetching extensions:", extensionsError);
      throw extensionsError;
    }

    if (!extensionsNeedingReview || extensionsNeedingReview.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No extensions currently need review assignments",
          assignments_created: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    console.log(
      `Found ${extensionsNeedingReview.length} extensions needing review`,
    );

    // 2. Separate extensions into premium and free queues (maintaining FIFO order within each queue)
    const premiumExtensions: ExtensionWithOwner[] = [];
    const freeExtensions: ExtensionWithOwner[] = [];

    extensionsNeedingReview.forEach((extension: any) => {
      const extensionWithOwner: ExtensionWithOwner = {
        id: extension.id,
        name: extension.name,
        owner_id: extension.owner_id,
        submitted_to_queue_at: extension.submitted_to_queue_at,
        owner: extension.owner,
      };

      // Check subscription status - treat null/undefined as 'free'
      const subscriptionStatus = extension.owner?.subscription_status || "free";

      if (subscriptionStatus === "premium") {
        premiumExtensions.push(extensionWithOwner);
      } else {
        freeExtensions.push(extensionWithOwner);
      }
    });

    console.log(
      `Separated into queues: ${premiumExtensions.length} premium, ${freeExtensions.length} free`,
    );

    // 3. Implement ABSOLUTE PRIORITY logic for Premium subscribers
    // Premium subscribers get processed FIRST (FIFO within premium)
    // Only after ALL premium subscribers are processed, then free tier users (FIFO within free)
    const assignmentQueue: ExtensionWithOwner[] = [];

    console.log(
      "🏆 Processing Premium Review Fast Track extensions first (absolute priority)...",
    );

    // Add ALL premium extensions first (already sorted by FIFO from database query)
    let premiumAdded = 0;
    for (const extension of premiumExtensions) {
      if (assignmentQueue.length < max_assignments) {
        assignmentQueue.push(extension);
        premiumAdded++;
        console.log(
          `✅ Added premium extension: ${extension.name} (position ${assignmentQueue.length})`,
        );
      } else {
        break;
      }
    }

    console.log(
      `🎯 Premium extensions added: ${premiumAdded} of ${premiumExtensions.length}`,
    );

    // Only add free extensions if there's still room and no premium extensions left to process
    let freeAdded = 0;
    if (
      assignmentQueue.length < max_assignments &&
      premiumAdded === premiumExtensions.length
    ) {
      console.log(
        "📋 All premium extensions processed, now processing free tier extensions...",
      );

      for (const extension of freeExtensions) {
        if (assignmentQueue.length < max_assignments) {
          assignmentQueue.push(extension);
          freeAdded++;
          console.log(
            `✅ Added free extension: ${extension.name} (position ${assignmentQueue.length})`,
          );
        } else {
          break;
        }
      }
    } else if (premiumAdded < premiumExtensions.length) {
      console.log(
        `⏳ Still ${premiumExtensions.length - premiumAdded} premium extensions waiting (free tier must wait)`,
      );
    }

    console.log(
      `📊 Final assignment queue: ${assignmentQueue.length} extensions (${premiumAdded} premium, ${freeAdded} free)`,
    );
    console.log(
      `🚀 Premium subscribers get ABSOLUTE PRIORITY - no free tier processed until all premium done!`,
    );

    // 4. Process each extension in the assignment queue
    let totalAssignmentsCreated = 0;
    for (const extension of assignmentQueue) {
      try {
        console.log(
          `Processing extension: ${extension.name} (ID: ${extension.id}) - Owner subscription: ${extension.owner.subscription_status || "free"}`,
        );

        // 5. Find qualified reviewers for this extension
        const { data: qualifiedReviewers, error: reviewersError } =
          await supabase
            .from("users")
            .select("id, name, email")
            .eq("has_completed_qualification", true)
            .neq("id", extension.owner_id); // Can't review own extension

        if (reviewersError) {
          console.error("Error fetching reviewers:", reviewersError);
          continue;
        }

        if (!qualifiedReviewers || qualifiedReviewers.length === 0) {
          console.log("No qualified reviewers available");
          continue;
        }

        // 6. Filter out reviewers who have already reviewed extensions from this owner
        const { data: existingRelationships, error: relationshipsError } =
          await supabase
            .from("review_relationships")
            .select("reviewer_id")
            .eq("reviewed_owner_id", extension.owner_id);

        if (relationshipsError) {
          console.error(
            "Error fetching review relationships:",
            relationshipsError,
          );
          continue;
        }

        const excludedReviewerIds =
          existingRelationships?.map((r) => r.reviewer_id) || [];
        const availableReviewers = qualifiedReviewers.filter(
          (reviewer) => !excludedReviewerIds.includes(reviewer.id),
        );

        if (availableReviewers.length === 0) {
          console.log(
            `No available reviewers for extension ${extension.name} (all have reviewed this owner before)`,
          );
          continue;
        }

        // 7. Filter out reviewers who already have active assignments
        const { data: activeAssignments, error: activeError } = await supabase
          .from("review_assignments")
          .select("reviewer_id")
          .eq("status", "assigned");

        if (activeError) {
          console.error("Error fetching active assignments:", activeError);
          continue;
        }

        const busyReviewerIds =
          activeAssignments?.map((a) => a.reviewer_id) || [];
        const freeReviewers = availableReviewers.filter(
          (reviewer) => !busyReviewerIds.includes(reviewer.id),
        );

        if (freeReviewers.length === 0) {
          console.log(
            `No free reviewers available for extension ${extension.name}`,
          );
          continue;
        }

        // 8. Randomly select a reviewer from available free reviewers
        const selectedReviewer =
          freeReviewers[Math.floor(Math.random() * freeReviewers.length)];
        console.log(
          `Selected reviewer: ${selectedReviewer.name} for extension: ${extension.name}`,
        );

        // 9. Create assignment batch
        const { data: batch, error: batchError } = await supabase
          .from("assignment_batches")
          .insert({
            reviewer_id: selectedReviewer.id,
            assignment_type: "single",
            status: "active",
          })
          .select()
          .single();

        if (batchError) {
          console.error("Error creating assignment batch:", batchError);
          continue;
        }

        // 10. Generate unique assignment number
        const { data: assignmentCount, error: countError } = await supabase
          .from("review_assignments")
          .select("assignment_number")
          .order("assignment_number", { ascending: false })
          .limit(1);

        if (countError) {
          console.error("Error getting assignment count:", countError);
          continue;
        }

        const nextAssignmentNumber =
          (assignmentCount?.[0]?.assignment_number || 0) + 1;

        // 11. Create review assignment
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // 7 days to complete

        const { data: assignment, error: assignmentError } = await supabase
          .from("review_assignments")
          .insert({
            batch_id: batch.id,
            extension_id: extension.id,
            reviewer_id: selectedReviewer.id,
            assignment_number: nextAssignmentNumber,
            due_at: dueDate.toISOString(),
            status: "assigned",
          })
          .select()
          .single();

        if (assignmentError) {
          console.error("Error creating review assignment:", assignmentError);
          // Clean up the batch if assignment creation failed
          await supabase.from("assignment_batches").delete().eq("id", batch.id);
          continue;
        }

        // 12. Update extension status to 'assigned'
        const { error: extensionUpdateError } = await supabase
          .from("extensions")
          .update({ status: "assigned" })
          .eq("id", extension.id);

        if (extensionUpdateError) {
          console.error(
            "Error updating extension status:",
            extensionUpdateError,
          );
          // Clean up assignment and batch if extension update failed
          await supabase
            .from("review_assignments")
            .delete()
            .eq("id", assignment.id);
          await supabase.from("assignment_batches").delete().eq("id", batch.id);
          continue;
        }

        // 13. TRIGGER EMAIL TO EXTENSION OWNER
        try {
          console.log(
            `📧 Triggering email to extension owner: ${extension.owner.email}`,
          );
          const { error: mailerLiteError } = await supabase.functions.invoke(
            "mailerlite-integration",
            {
              body: {
                user_email: extension.owner.email,
                event_type: "extension_assigned_to_reviewer",
                custom_data: {
                  extension_name: extension.name,
                  owner_name: extension.owner.name,
                  assignment_number: nextAssignmentNumber,
                  assignment_date: new Date().toISOString(),
                  due_date: dueDate.toISOString(),
                },
              },
            },
          );

          if (mailerLiteError) {
            console.error(
              "❌ MailerLite error for extension owner:",
              mailerLiteError,
            );
          } else {
            console.log(
              "✅ MailerLite extension assignment event triggered for owner",
            );
          }
        } catch (mailerLiteError) {
          console.error(
            "❌ Failed to trigger MailerLite extension assignment event:",
            mailerLiteError,
          );
          // Don't fail the assignment process if MailerLite fails
        }

        const subscriptionType = extension.owner.subscription_status || "free";
        console.log(
          `Successfully created assignment #${nextAssignmentNumber} for ${subscriptionType} extension: ${extension.name}`,
        );
        totalAssignmentsCreated++;
      } catch (error) {
        console.error(`Error processing extension ${extension.name}:`, error);
        continue;
      }
    }

    // 14. Log assignment statistics with absolute priority logic
    const actualPremiumAssigned = assignmentQueue
      .slice(0, totalAssignmentsCreated)
      .filter(
        (ext) => (ext.owner.subscription_status || "free") === "premium",
      ).length;
    const actualFreeAssigned = totalAssignmentsCreated - actualPremiumAssigned;

    console.log(
      `Review assignment process completed with ABSOLUTE PRIORITY for Premium subscribers:`,
    );
    console.log(`- Total assignments created: ${totalAssignmentsCreated}`);
    console.log(`- Premium extensions assigned: ${actualPremiumAssigned}`);
    console.log(`- Free extensions assigned: ${actualFreeAssigned}`);
    console.log(
      `- Premium queue remaining: ${premiumExtensions.length - actualPremiumAssigned}`,
    );
    console.log(
      `- Free queue waiting: ${freeExtensions.length} (only processed after ALL premium done)`,
    );
    console.log(`🏆 Premium Review Fast Track: ABSOLUTE PRIORITY maintained!`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully created ${totalAssignmentsCreated} review assignments with Premium Fast Track priority (${actualPremiumAssigned} premium, ${actualFreeAssigned} free)`,
        assignments_created: totalAssignmentsCreated,
        premium_assignments: actualPremiumAssigned,
        free_assignments: actualFreeAssigned,
        premium_queue_remaining:
          premiumExtensions.length - actualPremiumAssigned,
        free_queue_waiting: freeExtensions.length,
        extensions_processed: assignmentQueue.length,
        priority_system: "absolute_premium_priority",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("💥 CRITICAL ERROR in assign-reviews function:", {
      message: error?.message || "Unknown error",
      name: error?.name || "Unknown",
      stack: error?.stack || "No stack trace available",
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error occurred while processing assignments",
        details: error?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
