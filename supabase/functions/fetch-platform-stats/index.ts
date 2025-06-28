import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(
        "id, subscription_status, has_completed_qualification, created_at",
      );
    if (usersError) throw usersError;

    // Extensions
    const { data: extensions, error: extensionsError } = await supabase
      .from("extensions")
      .select("id, owner_id, status, submitted_to_queue_at, created_at");
    if (extensionsError) throw extensionsError;

    // Review assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("review_assignments")
      .select(
        "id, extension_id, reviewer_id, assigned_at, due_at, status, submitted_at",
      );
    if (assignmentsError) throw assignmentsError;

    // Credit transactions
    const { data: credits, error: creditsError } = await supabase
      .from("credit_transactions")
      .select("id, user_id, amount, type, created_at");
    if (creditsError) throw creditsError;

    // Stats calculations
    const now = new Date();
    const daysAgo = (n: number) =>
      new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    const totalUsers = users?.length || 0;
    const totalFreeUsers =
      users?.filter((u) => u.subscription_status === "free").length || 0;
    const totalPremiumUsers =
      users?.filter((u) => u.subscription_status === "premium").length || 0;
    const totalExtensions = extensions?.length || 0;
    const totalExtensionsInQueue =
      extensions?.filter((e) => e.status === "queued").length || 0;
    const totalReviewsAssigned = assignments?.length || 0;
    const totalReviewsCompleted =
      assignments?.filter(
        (a) => a.status === "approved" || a.status === "submitted",
      ).length || 0;
    const reviewsInProgress =
      assignments?.filter((a) => a.status === "assigned").length || 0;
    const creditsEarned =
      credits
        ?.filter((c) => c.type === "earned")
        .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    const activeReviewers =
      users?.filter((u) => {
        const recent = assignments?.find(
          (a) =>
            a.reviewer_id === u.id &&
            a.status === "approved" &&
            a.submitted_at &&
            new Date(a.submitted_at) > daysAgo(30),
        );
        return !!recent;
      }).length || 0;

    const reviewsCompletedLast7Days =
      assignments?.filter(
        (a) =>
          a.status === "approved" &&
          a.submitted_at &&
          new Date(a.submitted_at) > daysAgo(7),
      ).length || 0;

    // Average review completion time (from assigned_at to submitted_at)
    const completionTimes =
      assignments
        ?.filter(
          (a) => a.status === "approved" && a.assigned_at && a.submitted_at,
        )
        .map(
          (a) =>
            new Date(a.submitted_at!).getTime() -
            new Date(a.assigned_at!).getTime(),
        ) || [];

    let avgReviewCompletionTime = "N/A";
    if (completionTimes.length > 0) {
      const avgMs =
        completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
      const avgDays = avgMs / (1000 * 60 * 60 * 24);
      avgReviewCompletionTime = `${avgDays.toFixed(1)} days`;
    }

    const stats = {
      totalUsers,
      totalFreeUsers,
      totalPremiumUsers,
      totalExtensions,
      totalExtensionsInQueue,
      totalReviewsAssigned,
      totalReviewsCompleted,
      reviewsInProgress,
      creditsEarned,
      activeReviewers,
      reviewsCompletedLast7Days,
      avgReviewCompletionTime,
    };

    return new Response(JSON.stringify({ success: true, stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
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
