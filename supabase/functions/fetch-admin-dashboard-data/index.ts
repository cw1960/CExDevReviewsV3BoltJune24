import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Fetching admin dashboard data...");

    // Fetch all users
    console.log("Fetching users...");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Users fetch error:", usersError);
      throw usersError;
    }

    // Fetch all extensions with owner information
    console.log("Fetching extensions...");
    const { data: extensions, error: extensionsError } = await supabase
      .from("extensions")
      .select(
        `
        *,
        owner:users(*)
      `,
      )
      .order("created_at", { ascending: false });

    if (extensionsError) {
      console.error("Extensions fetch error:", extensionsError);
      throw extensionsError;
    }

    // Fetch all review assignments with extension (including owner) and reviewer information
    console.log("Fetching review assignments...");
    const { data: assignments, error: assignmentsError } = await supabase
      .from("review_assignments")
      .select(
        `
        *,
        extension:extensions(
          *,
          owner:users(*)
        ),
        reviewer:users(*)
      `,
      )
      .order("assigned_at", { ascending: false });

    if (assignmentsError) {
      console.error("Assignments fetch error:", assignmentsError);
      // Don't throw here, assignments might not exist yet
      console.log("No assignments found, continuing...");
    }

    // Fetch all credit transactions
    console.log("Fetching credit transactions...");
    const { data: transactions, error: transactionsError } = await supabase
      .from("credit_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (transactionsError) {
      console.error("Transactions fetch error:", transactionsError);
      // Don't throw here, transactions might not exist yet
      console.log("No transactions found, continuing...");
    }

    // Calculate statistics
    const totalUsers = users?.length || 0;
    const totalExtensions = extensions?.length || 0;
    const pendingVerifications =
      extensions?.filter((e) => e.status === "queued").length || 0;
    const activeReviews =
      assignments?.filter((a) => a.status === "assigned").length || 0;
    const totalCreditsIssued =
      transactions
        ?.filter((t) => t.type === "earned")
        .reduce((sum, t) => sum + t.amount, 0) || 0;

    const stats = {
      totalUsers,
      totalExtensions,
      pendingVerifications,
      activeReviews,
      totalCreditsIssued,
      avgQueueTime: "2.3 days", // This could be calculated from actual data
    };

    console.log("Admin dashboard data fetch completed successfully");
    console.log("Stats:", stats);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          users: users || [],
          extensions: extensions || [],
          assignments: assignments || [],
          transactions: transactions || [],
          stats,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in fetch-admin-dashboard-data function:", error);

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
