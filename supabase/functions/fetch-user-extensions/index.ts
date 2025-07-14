const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FetchUserExtensionsRequest {
  user_id: string;
}

interface ExtensionData {
  id: string;
  owner_id: string;
  name: string;
  chrome_store_url: string;
  description: string | null;
  category: string[] | null;
  feedback_type: string[] | null;
  access_type: "free" | "freemium" | "free_trial" | "promo_code";
  access_details: string | null;
  promo_code: string | null;
  promo_code_expires_at: string | null;
  status:
    | "library"
    | "verified"
    | "queued"
    | "assigned"
    | "reviewed"
    | "completed"
    | "rejected";
  rejection_reason: string | null;
  queue_position: number | null;
  submitted_to_queue_at: string | null;
  logo_url: string | null;
  created_at: string;
}

Deno.serve(async (req) => {
  console.log("🚀 fetch-user-extensions function started");
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
    // Use service role key to bypass RLS and prevent infinite recursion
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

    const { user_id }: FetchUserExtensionsRequest = requestBody;

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

    console.log("🔍 Fetching extensions for user:", user_id);

    // Fetch user extensions using service role (bypasses RLS)
    const { data: extensions, error: extensionsError } = await supabase
      .from("extensions")
      .select(
        `
        id,
        owner_id,
        name,
        chrome_store_url,
        description,
        category,
        feedback_type,
        access_type,
        access_details,
        promo_code,
        promo_code_expires_at,
        status,
        rejection_reason,
        queue_position,
        submitted_to_queue_at,
        logo_url,
        created_at
      `,
      )
      .eq("owner_id", user_id)
      .order("created_at", { ascending: false });

    if (extensionsError) {
      console.error("❌ Extensions fetch error:", {
        message: extensionsError.message,
        code: extensionsError.code,
        details: extensionsError.details,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch user extensions",
          details: extensionsError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log(
      "✅ Extensions fetched successfully:",
      extensions?.length || 0,
      "extensions",
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: extensions || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("💥 Error in fetch-user-extensions function:", {
      message: error?.message || "Unknown error",
      name: error?.name || "Unknown",
      stack: error?.stack || "No stack trace available",
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error occurred while fetching user extensions",
        details: error?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
