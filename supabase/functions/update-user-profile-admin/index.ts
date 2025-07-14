import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface UpdateUserProfileAdminRequest {
  userId: string;
  updates: {
    credit_balance: number;
    role: "admin" | "moderator" | "user";
    has_completed_qualification: boolean;
  };
  current_credit_balance: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      userId,
      updates,
      current_credit_balance,
    }: UpdateUserProfileAdminRequest = await req.json();

    if (!userId || !updates) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "User ID and updates are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log(`Updating user profile for ID: ${userId}`);

    // Update user profile
    const { error: userError } = await supabase
      .from("users")
      .update({
        credit_balance: updates.credit_balance,
        role: updates.role,
        has_completed_qualification: updates.has_completed_qualification,
      })
      .eq("id", userId);

    if (userError) {
      console.error("Error updating user profile:", userError);
      throw userError;
    }

    // If credit balance changed, create a transaction record
    const creditDiff = updates.credit_balance - current_credit_balance;
    if (creditDiff !== 0) {
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: userId,
          amount: creditDiff,
          type: creditDiff > 0 ? "earned" : "spent",
          description: `Admin adjustment: ${creditDiff > 0 ? "added" : "removed"} ${Math.abs(creditDiff)} credits`,
        });

      if (transactionError) {
        console.error("Error creating credit transaction:", transactionError);
        throw transactionError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User profile updated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in update-user-profile-admin function:", error);
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
