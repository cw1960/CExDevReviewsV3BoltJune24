import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface MailerLiteRequest {
  user_email: string;
  event_type: string;
  custom_data?: Record<string, any>;
  subject?: string;
  html_content?: string;
}

interface MailerLiteSubscriber {
  email: string;
  fields?: Record<string, string | number>;
}

serve(async (req) => {
  console.log("🚀 mailerlite-integration function started");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("✅ Handling CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔍 Checking environment variables...");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mailerLiteApiKey = Deno.env.get("MAILERLITE_API_KEY");

    if (!mailerLiteApiKey) {
      console.error("MailerLite API key not found in environment variables");
      console.error(
        "Available env vars:",
        Object.keys(Deno.env.toObject()).filter((key) =>
          key.includes("MAILER"),
        ),
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "MailerLite API key not configured",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log("✅ Environment variables check passed");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      user_email,
      event_type,
      custom_data = {},
      subject,
      html_content,
    }: MailerLiteRequest = await req.json();

    if (!user_email || !event_type) {
      console.error("❌ Missing required fields:", {
        user_email: !!user_email,
        event_type: !!event_type,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "User email and event type are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log(
      `📧 Processing MailerLite event: ${event_type} for email ending in ...${user_email.slice(-10)}`,
    );

    // Prepare subscriber data with custom fields (NO GROUPS in initial request)
    const subscriberData: MailerLiteSubscriber = {
      email: user_email,
      fields: {
        event_type: event_type,
        last_event_date: new Date().toISOString(),
        ...custom_data,
      },
    };

    // Map event types to MailerLite group names
    const eventGroupMapping: Record<string, string> = {
      user_signed_up: "new_signups",
      review_completed: "review_completed",
      review_assigned: "review_assigned",
      extension_assigned_to_reviewer: "extension_assigned_to_reviewer",
      extension_reviewed_owner: "extension_reviewed_owner",
      credit_earned: "credit_earned",
      subscription_upgraded: "premium_users",
      qualification_completed: "qualified_reviewers",
      // Added reviewer reminder groups
      reviewer_24hr_reminder: "reviewer_24hr_reminder",
      reviewer_6hr_reminder: "reviewer_6hr_reminder",
      review_overdue_reminder: "review_overdue_reminder",
    };

    const groupName = eventGroupMapping[event_type];
    console.log(
      `🏷️ Event type "${event_type}" mapped to group: "${groupName || "none"}"`,
    );

    // Create or update subscriber in MailerLite (WITHOUT groups)
    console.log(
      "📡 Making request to MailerLite API to create/update subscriber...",
    );
    const mailerLiteResponse = await fetch(
      "https://connect.mailerlite.com/api/subscribers",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mailerLiteApiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(subscriberData),
      },
    );

    console.log("📨 MailerLite API response:", {
      status: mailerLiteResponse.status,
      statusText: mailerLiteResponse.statusText,
      ok: mailerLiteResponse.ok,
    });

    const mailerLiteResult = await mailerLiteResponse.json();
    console.log(
      "📋 MailerLite API result:",
      JSON.stringify(mailerLiteResult, null, 2),
    );

    let subscriberId: string | null = null;
    let success = mailerLiteResponse.ok;

    if (success) {
      // Extract subscriber ID from successful response
      subscriberId = mailerLiteResult.data?.id;
      console.log(
        "✅ Subscriber created/updated successfully, ID:",
        subscriberId,
      );
    } else {
      // If subscriber already exists, try to update instead
      if (
        mailerLiteResult.message &&
        mailerLiteResult.message.includes("already exists")
      ) {
        console.log(
          "📝 Subscriber exists, attempting to get subscriber info...",
        );

        // Get subscriber ID first
        const getSubscriberResponse = await fetch(
          `https://connect.mailerlite.com/api/subscribers/${user_email}`,
          {
            headers: {
              Authorization: `Bearer ${mailerLiteApiKey}`,
              Accept: "application/json",
            },
          },
        );

        if (getSubscriberResponse.ok) {
          console.log("📋 Found existing subscriber, updating...");
          const subscriberInfo = await getSubscriberResponse.json();
          subscriberId = subscriberInfo.data?.id;

          // Update subscriber
          const updateResponse = await fetch(
            `https://connect.mailerlite.com/api/subscribers/${subscriberId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${mailerLiteApiKey}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                fields: subscriberData.fields,
              }),
            },
          );

          if (updateResponse.ok) {
            console.log("✅ Subscriber updated successfully");
            success = true;
          } else {
            console.error("❌ Failed to update existing subscriber");
            const updateError = await updateResponse.json();
            console.error("Update error:", updateError);
          }
        } else {
          console.error("❌ Failed to get existing subscriber info");
        }
      } else {
        console.error("❌ MailerLite API error details:", {
          message: mailerLiteResult.message,
          errors: mailerLiteResult.errors,
        });
      }
    }

    // If we have a subscriber ID and a group to assign, do that now
    if (subscriberId && groupName && success) {
      console.log(
        `🏷️ Adding subscriber ${subscriberId} to group: ${groupName}`,
      );
      await addSubscriberToGroup(mailerLiteApiKey, subscriberId, groupName);
    }

    // Log the email attempt in our database
    await supabase.from("email_logs").insert({
      to_email: user_email,
      type: event_type,
      status: success ? "sent" : "failed",
      subject: subject || `Event: ${event_type}`,
      body: html_content || JSON.stringify(custom_data),
      error_message: success ? null : JSON.stringify(mailerLiteResult),
    });

    if (!success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to process MailerLite request",
          details: mailerLiteResult,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log("✅ MailerLite request processed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "MailerLite event processed successfully",
        mailerlite_response: mailerLiteResult,
        subscriber_id: subscriberId,
        group_assigned: groupName || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("💥 Error in mailerlite-integration function:", {
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

// Helper function to add subscriber to a group
async function addSubscriberToGroup(
  apiKey: string,
  subscriberId: string,
  groupName: string,
) {
  try {
    console.log(`🏷️ Adding subscriber ${subscriberId} to group: ${groupName}`);

    // First, get all groups to find the one we want
    const groupsResponse = await fetch(
      "https://connect.mailerlite.com/api/groups",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      },
    );

    if (!groupsResponse.ok) {
      console.error("❌ Failed to fetch groups from MailerLite");
      return;
    }

    const groupsData = await groupsResponse.json();
    let targetGroup = groupsData.data?.find(
      (group: any) => group.name === groupName,
    );

    // Create group if it doesn't exist
    if (!targetGroup) {
      console.log(`📝 Group "${groupName}" doesn't exist, creating it...`);
      const createGroupResponse = await fetch(
        "https://connect.mailerlite.com/api/groups",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ name: groupName }),
        },
      );

      if (createGroupResponse.ok) {
        const createGroupResult = await createGroupResponse.json();
        targetGroup = createGroupResult.data;
        console.log(
          `✅ Created new group: ${groupName} with ID: ${targetGroup.id}`,
        );
      } else {
        console.error("❌ Failed to create group:", groupName);
        const createError = await createGroupResponse.json();
        console.error("Create group error:", createError);
        return;
      }
    }

    // Add subscriber to group using the numeric group ID
    if (targetGroup && targetGroup.id) {
      console.log(
        `🔗 Adding subscriber ${subscriberId} to group ID: ${targetGroup.id}`,
      );
      const addToGroupResponse = await fetch(
        `https://connect.mailerlite.com/api/subscribers/${subscriberId}/groups/${targetGroup.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        },
      );

      if (addToGroupResponse.ok) {
        console.log(`✅ Successfully added subscriber to group: ${groupName}`);
      } else {
        console.error("❌ Failed to add subscriber to group");
        const addError = await addToGroupResponse.json();
        console.error("Add to group error:", addError);
      }
    } else {
      console.error("❌ No target group found or group has no ID");
    }
  } catch (error) {
    console.error("❌ Error in addSubscriberToGroup:", {
      message: error.message,
      name: error.name,
    });
  }
}
