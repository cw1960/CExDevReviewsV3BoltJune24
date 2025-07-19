import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateExtensionRequest {
  owner_id: string;
  name: string;
  chrome_store_url: string;
  description?: string;
  category?: string[];
  access_type?: "free" | "freemium" | "free_trial" | "promo_code";
  promo_code?: string;
  promo_code_expires_at?: string | null;
  logo_url?: string;
  status?:
    | "library"
    | "verified"
    | "queued"
    | "assigned"
    | "reviewed"
    | "completed"
    | "rejected";
}

serve(async (req) => {
  console.log("🚀 create-extension function started");
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
    let extensionData: CreateExtensionRequest;
    try {
      extensionData = await req.json();
      console.log("📋 Received extension data:", extensionData);
      console.log("📊 Extension data keys:", Object.keys(extensionData));
      console.log("👤 Owner ID:", extensionData.owner_id);
      console.log("📝 Extension name:", extensionData.name);
      console.log("🔗 Chrome Store URL:", extensionData.chrome_store_url);
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid JSON in request body: ${parseError.message}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Enhanced validation with detailed logging
    console.log("🔍 Validating required fields...");
    const missingFields = [];
    if (!extensionData.owner_id) missingFields.push("owner_id");
    if (!extensionData.name) missingFields.push("name");
    if (!extensionData.chrome_store_url) missingFields.push("chrome_store_url");

    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log("✅ All required fields present");

    // Validate Chrome Store URL format
    const chromeStoreUrlPattern =
      /^https?:\/\/(chrome\.google\.com\/webstore|chromewebstore\.google\.com)/;
    if (!chromeStoreUrlPattern.test(extensionData.chrome_store_url)) {
      console.error(
        "❌ Invalid Chrome Store URL format:",
        extensionData.chrome_store_url,
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid Chrome Web Store URL format",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log("✅ Chrome Store URL format is valid");

    // Check if user exists before creating extension
    console.log("🔍 Verifying user exists...");
    const { data: userExists, error: userCheckError } = await supabase
      .from("users")
      .select("id")
      .eq("id", extensionData.owner_id)
      .single();

    if (userCheckError || !userExists) {
      console.error("❌ User verification failed:", {
        error: userCheckError,
        userExists: !!userExists,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found or invalid owner_id",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log("✅ User verification passed");

    // Check if user has completed their first review before allowing extension submission
    console.log("🔍 Checking if user has completed their first review...");
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, has_completed_first_review")
      .eq("id", extensionData.owner_id)
      .single();

    if (userError || !user) {
      console.error("❌ User fetch error:", userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to verify user review status",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    if (!user.has_completed_first_review) {
      console.log("❌ User has not completed their first review");
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "You must complete your first review before submitting an extension to the queue. Please request a review assignment and complete it first.",
          code: "FIRST_REVIEW_REQUIRED",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        },
      );
    }

    console.log("✅ User has completed their first review");

    console.log(`🔄 Creating extension: ${extensionData.name}`);
    console.log("📊 Final extension data to insert:", {
      owner_id: extensionData.owner_id,
      name: extensionData.name,
      chrome_store_url: extensionData.chrome_store_url,
      description: extensionData.description || null,
      category: extensionData.category || null,
      access_type: extensionData.access_type || "free",
      promo_code: extensionData.promo_code || null,
      promo_code_expires_at: extensionData.promo_code_expires_at || null,
      logo_url: extensionData.logo_url || null,
      status: extensionData.status || "library",
    });

    // Create extension using service role (bypasses RLS)
    const { data: newExtension, error: createError } = await supabase
      .from("extensions")
      .insert({
        owner_id: extensionData.owner_id,
        name: extensionData.name,
        chrome_store_url: extensionData.chrome_store_url,
        description: extensionData.description || null,
        category: extensionData.category || null,
        access_type: extensionData.access_type || "free",
        promo_code: extensionData.promo_code || null,
        promo_code_expires_at: extensionData.promo_code_expires_at || null,
        logo_url: extensionData.logo_url || null,
        status: extensionData.status || "library",
      })
      .select()
      .single();

    if (createError) {
      console.error("❌ Extension creation error:", {
        message: createError.message,
        code: createError.code,
        details: createError.details,
        hint: createError.hint,
      });

      // Provide more specific error messages based on error codes
      let userFriendlyError = "Failed to create extension";
      if (createError.code === "23505") {
        userFriendlyError =
          "An extension with this Chrome Store URL already exists";
      } else if (createError.code === "23503") {
        userFriendlyError =
          "Invalid user ID or foreign key constraint violation";
      } else if (createError.code === "42501") {
        userFriendlyError = "Permission denied - insufficient privileges";
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: userFriendlyError,
          details: createError.message,
          code: createError.code,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log("✅ Extension created successfully:", newExtension.id);
    console.log("📋 Created extension data:", {
      id: newExtension.id,
      name: newExtension.name,
      owner_id: newExtension.owner_id,
      status: newExtension.status,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: newExtension,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("💥 Error in create-extension function:", {
      message: error?.message || "Unknown error",
      name: error?.name || "Unknown",
      stack: error?.stack || "No stack trace available",
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error occurred while creating extension",
        details: error?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
