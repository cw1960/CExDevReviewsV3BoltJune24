const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FetchUserSubscriptionRequest {
  user_id: string;
}

Deno.serve(async (req) => {
  console.log("🚀 fetch-user-subscription function started");
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
    console.log("🔗 Supabase URL:", supabaseUrl);
    // Use service role key to bypass RLS
    const { createClient } = await import("npm:@supabase/supabase-js@2");
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

    const { user_id }: FetchUserSubscriptionRequest = requestBody;

    if (!user_id) {
      console.error("❌ Missing user_id in request");
      return new Response(
        JSON.stringify({
          success: false,
          error: "User ID is required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log("🔍 Fetching subscription data for user:", user_id);

    // Fetch subscription data using service role (bypasses RLS)
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from("stripe_user_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error("❌ Subscription fetch error:", {
        message: subscriptionError.message,
        code: subscriptionError.code,
        details: subscriptionError.details,
      });

      // Don't throw error if no subscription found, just return null
      if (subscriptionError.code === "PGRST116") {
        console.log(
          "ℹ️ No subscription found for user - this is normal for free tier users",
        );
        return new Response(
          JSON.stringify({
            success: true,
            data: null,
            message: "No subscription found",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch subscription data",
          details: subscriptionError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log(
      "✅ Subscription data fetched successfully:",
      subscriptionData ? "subscription found" : "no subscription",
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: subscriptionData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("💥 Error in fetch-user-subscription function:", {
      message: error?.message || "Unknown error",
      name: error?.name || "Unknown",
      stack: error?.stack || "No stack trace available",
    });

    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Internal server error occurred while fetching subscription data",
        details: error?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
