import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateUserProfileRequest {
  user_id: string;
  email: string;
  name?: string;
}

serve(async (req) => {
  console.log("🚀 create-user-profile Edge Function invoked!");
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
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("📦 Parsing request body...");
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("📋 Request body parsed successfully");
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

    const { user_id, email, name }: CreateUserProfileRequest = requestBody;

    if (!user_id || !email) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({
          success: false,
          error: "User ID and email are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log(`🔄 Creating/checking user profile for: ${email}`);

    // IDEMPOTENT CHECK: First check if user profile already exists
    console.log("🔍 Checking if user profile already exists...");
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id, email, name, created_at")
      .eq("id", user_id)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking existing user:", checkError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to check existing user profile",
          details: checkError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // If user already exists, return success with existing data
    if (existingUser) {
      console.log("✅ User profile already exists, returning existing data");
      return new Response(
        JSON.stringify({
          success: true,
          data: existingUser,
          message: "User profile already exists",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Extract name with fallback logic
    const userName = name || email.split("@")[0] || null;

    // Create user profile using service role (bypasses RLS)
    console.log("📝 Creating new user profile...");
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        id: user_id,
        email: email,
        name: userName,
        credit_balance: 1, // Give new users 1 welcome credit
        onboarding_complete: false,
        subscription_status: "free",
        exchanges_this_month: 0,
        last_exchange_reset_date: new Date().toISOString(),
        cookie_preferences: "not_set",
        cookie_consent_timestamp: new Date().toISOString(),
        has_completed_qualification: false,
        role: "user",
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ User profile creation error:", {
        message: createError.message,
        code: createError.code,
        details: createError.details,
      });

      // If it's a duplicate key error, try to fetch the existing user
      if (createError.code === "23505") {
        console.log(
          "🔄 Duplicate key error, attempting to fetch existing user...",
        );
        const { data: existingUserRetry, error: retryError } = await supabase
          .from("users")
          .select("id, email, name, created_at")
          .eq("id", user_id)
          .single();

        if (!retryError && existingUserRetry) {
          console.log("✅ Found existing user after duplicate key error");
          return new Response(
            JSON.stringify({
              success: true,
              data: existingUserRetry,
              message:
                "User profile already exists (recovered from duplicate key error)",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            },
          );
        }
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create user profile",
          details: createError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log("✅ User profile created successfully:", newUser.id);

    // Send automated welcome message (NON-BLOCKING - don't fail user creation if this fails)
    setTimeout(async () => {
      try {
        console.log("📨 Sending automated welcome message...");
        const welcomeSubject = "Welcome to ChromeExDev.Reviews! 🎉";
        const welcomeMessage = `Chris here - I'm the developer of this application. Just wanted to personally thank you for joining the community. I hope you add an extension soon - and request to review one as well...let's get the reviews flowing! Let me know via the contact us form in the Profile page if you have any questions. I'm here to help! Reminder: Once you add your extension, go to your "Extension Library" and click on the blue "Submit to Queue" button to put it in line for a review!`;

        // Get system admin ID (fixed UUID for the system admin)
        const systemAdminId = "00000000-0000-0000-0000-000000000001";

        const { error: messageError } = await supabase
          .from("user_messages")
          .insert({
            recipient_id: newUser.id,
            sender_id: systemAdminId,
            subject: welcomeSubject,
            message: welcomeMessage,
            priority: "medium",
            popup_on_login: true,
            is_read: false,
          });

        if (messageError) {
          console.error("❌ Welcome message error:", messageError);
        } else {
          console.log("✅ Welcome message sent successfully");
        }
      } catch (messageError) {
        console.error("❌ Failed to send welcome message:", messageError);
        // This is now non-blocking - user creation has already succeeded
      }
    }, 0);

    // Trigger MailerLite event for new user signup (NON-BLOCKING)
    setTimeout(async () => {
      try {
        console.log("📧 Triggering MailerLite signup event...");
        const { error: mailerLiteError } = await supabase.functions.invoke(
          "mailerlite-integration",
          {
            body: {
              user_email: email,
              event_type: "user_signed_up",
              custom_data: {
                user_name: userName,
                signup_date: new Date().toISOString(),
                welcome_credits: 1,
              },
            },
          },
        );

        if (mailerLiteError) {
          console.error("❌ MailerLite error:", mailerLiteError);
        } else {
          console.log("✅ MailerLite signup event triggered");
        }
      } catch (mailerLiteError) {
        console.error(
          "❌ Failed to trigger MailerLite signup event:",
          mailerLiteError,
        );
        // This is now non-blocking - user creation has already succeeded
      }
    }, 0);

    // CRITICAL: Return immediately after user creation, don't wait for messages/integrations
    return new Response(
      JSON.stringify({
        success: true,
        data: newUser,
        message: "User profile created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("💥 Error in create-user-profile function:", {
      message: error?.message || "Unknown error",
      name: error?.name || "Unknown",
      stack: error?.stack || "No stack trace available",
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error occurred while creating user profile",
        details: error?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
