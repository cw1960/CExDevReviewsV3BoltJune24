import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface UpdateExtensionRequest {
  extension_id: string;
  updates: {
    name?: string;
    chrome_store_url?: string;
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
  };
}

serve(async (req) => {
  console.log("🚀 update-extension function started");

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

    const { extension_id, updates }: UpdateExtensionRequest = await req.json();

    if (!extension_id || !updates) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Extension ID and updates are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log(
      `🔄 Updating extension ${extension_id} with updates:`,
      Object.keys(updates),
    );

    // Update extension using service role (bypasses RLS)
    const { data: updatedExtension, error: updateError } = await supabase
      .from("extensions")
      .update(updates)
      .eq("id", extension_id)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Extension update error:", {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update extension",
          details: updateError.message,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    console.log("✅ Extension updated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedExtension,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("💥 Error in update-extension function:", {
      message: error?.message || "Unknown error",
      name: error?.name || "Unknown",
      stack: error?.stack || "No stack trace available",
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error occurred while updating extension",
        details: error?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
