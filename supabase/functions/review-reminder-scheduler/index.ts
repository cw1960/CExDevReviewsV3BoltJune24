import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper to round to nearest hour
function hoursDiff(date1, date2) {
  return Math.round((date1.getTime() - date2.getTime()) / (1000 * 60 * 60));
}

serve(async (req) => {
  console.log("🚀 review-reminder-scheduler function started");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), { headers: corsHeaders, status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Fetch all active review assignments
    const { data: assignments, error } = await supabase
      .from("review_assignments")
      .select("id, reviewer_id, due_at, status, notified_24hr, notified_6hr, notified_overdue, reviewer:users(email, name)")
      .eq("status", "assigned");
    if (error) {
      console.error("❌ Error fetching assignments:", error);
      return new Response(JSON.stringify({ error: error.message }), { headers: corsHeaders, status: 500 });
    }
    const now = new Date();
    for (const assignment of assignments) {
      const due = new Date(assignment.due_at);
      const hoursLeft = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60));
      let eventType = null;
      let notifyField = null;
      if (hoursLeft === 24 && !assignment.notified_24hr) {
        eventType = "reviewer_24hr_reminder";
        notifyField = "notified_24hr";
      } else if (hoursLeft === 6 && !assignment.notified_6hr) {
        eventType = "reviewer_6hr_reminder";
        notifyField = "notified_6hr";
      } else if (hoursLeft < 0 && !assignment.notified_overdue) {
        eventType = "review_overdue_reminder";
        notifyField = "notified_overdue";
      }
      if (eventType && notifyField) {
        // Call mailerlite-integration
        try {
          const { error: mailerLiteError } = await supabase.functions.invoke(
            "mailerlite-integration",
            {
              body: {
                user_email: assignment.reviewer.email,
                event_type: eventType,
                custom_data: {
                  assignment_id: assignment.id,
                  reviewer_name: assignment.reviewer.name,
                  due_date: assignment.due_at,
                },
              },
            }
          );
          if (mailerLiteError) {
            console.error(`❌ MailerLite error for ${eventType}:`, mailerLiteError);
          } else {
            // Mark as notified
            const updateObj = {};
            updateObj[notifyField] = true;
            await supabase.from("review_assignments").update(updateObj).eq("id", assignment.id);
            console.log(`✅ Sent ${eventType} to ${assignment.reviewer.email}`);
          }
        } catch (err) {
          console.error(`❌ Failed to trigger MailerLite for ${eventType}:`, err);
        }
      }
    }
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  } catch (err) {
    console.error("💥 Error in review-reminder-scheduler:", err);
    return new Response(JSON.stringify({ error: err.message }), { headers: corsHeaders, status: 500 });
  }
}); 