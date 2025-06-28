const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FetchPremiumPersonalStatsRequest {
  userId: string;
}

interface PremiumPersonalStats {
  cycleStart: string;
  cycleEnd: string;
  daysLeftInCycle: number;
  reviewsSubmittedThisCycle: number;
  reviewsReceivedThisCycle: number;
  totalReviewsSubmitted: number;
  totalReviewsReceived: number;
  queuePosition?: number;
  avgWaitTimeDays?: number;
  avgReviewTurnaroundTime?: string;
  reviewTrends?: Array<{ month: string; submitted: number; received: number }>;
  reviewerFeedbackHighlights?: string[];
  extensionPerformance?: Array<{
    extensionId: string;
    downloads: number;
    rating: number;
  }>;
  priorityQueueStatus?: string;
  nextReviewETA?: string;
  platformAverages?: {
    avgSubmitted: number;
    avgReceived: number;
    avgTurnaround: number;
  };
  badgeRank?: string;
  badgeIcon?: string;
}

const CYCLE_LENGTH_DAYS = 28;

Deno.serve(async (req) => {
  console.log("🚀 fetch-premium-personal-stats function started");
  console.log("📝 Request method:", req.method);

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
      console.error("❌ Missing environment variables");
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

    const { userId }: FetchPremiumPersonalStatsRequest = requestBody;

    if (!userId) {
      console.error("❌ Missing userId in request");
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    console.log("🔍 Fetching premium personal stats for user:", userId);

    // Fetch user profile (to get created_at for cycle anchor)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, created_at")
      .eq("id", userId)
      .single();
    if (userError || !user) {
      console.error("❌ User not found:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        },
      );
    }

    // Calculate current cycle start/end based on created_at
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const msInDay = 24 * 60 * 60 * 1000;
    const daysSinceSignup = Math.floor(
      (now.getTime() - createdAt.getTime()) / msInDay,
    );
    const cyclesSinceSignup = Math.floor(daysSinceSignup / CYCLE_LENGTH_DAYS);
    const cycleStart = new Date(
      createdAt.getTime() + cyclesSinceSignup * CYCLE_LENGTH_DAYS * msInDay,
    );
    const cycleEnd = new Date(
      cycleStart.getTime() + CYCLE_LENGTH_DAYS * msInDay,
    );
    const daysLeftInCycle = Math.max(
      0,
      Math.ceil((cycleEnd.getTime() - now.getTime()) / msInDay),
    );

    // Reviews submitted as reviewer (lifetime and this cycle)
    const { data: submittedAssignments, error: submittedError } = await supabase
      .from("review_assignments")
      .select("id, submitted_at, assigned_at, rating")
      .eq("reviewer_id", userId)
      .in("status", ["submitted", "approved"]);
    if (submittedError) {
      console.error("❌ Failed to fetch submitted reviews:", submittedError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch submitted reviews",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
    const totalReviewsSubmitted = submittedAssignments.length;
    const reviewsSubmittedThisCycle = submittedAssignments.filter((a) => {
      if (!a.submitted_at) return false;
      const submitted = new Date(a.submitted_at);
      return submitted >= cycleStart && submitted < cycleEnd;
    }).length;

    // Reviews received as extension owner (lifetime and this cycle)
    const { data: extensions, error: extError } = await supabase
      .from("extensions")
      .select("id, name, chrome_store_url")
      .eq("owner_id", userId);
    if (extError) {
      console.error("❌ Failed to fetch user extensions:", extError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch user extensions",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }
    const extensionIds = extensions.map((e) => e.id);
    let totalReviewsReceived = 0;
    let reviewsReceivedThisCycle = 0;
    let receivedAssignments = [];
    if (extensionIds.length > 0) {
      const { data: receivedData, error: receivedError } = await supabase
        .from("review_assignments")
        .select("id, submitted_at, extension_id, rating, review_content")
        .in("extension_id", extensionIds)
        .in("status", ["submitted", "approved"]);
      if (receivedError) {
        console.error("❌ Failed to fetch received reviews:", receivedError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to fetch received reviews",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          },
        );
      }
      receivedAssignments = receivedData || [];
      totalReviewsReceived = receivedAssignments.length;
      reviewsReceivedThisCycle = receivedAssignments.filter((a) => {
        if (!a.submitted_at) return false;
        const submitted = new Date(a.submitted_at);
        return submitted >= cycleStart && submitted < cycleEnd;
      }).length;
    }

    // Calculate average review turnaround time
    const completedReviews = submittedAssignments.filter(
      (a) => a.assigned_at && a.submitted_at,
    );
    let avgReviewTurnaroundTime = undefined;
    if (completedReviews.length > 0) {
      const totalTurnaroundMs = completedReviews.reduce((sum, review) => {
        const assignedTime = new Date(review.assigned_at!).getTime();
        const submittedTime = new Date(review.submitted_at!).getTime();
        return sum + (submittedTime - assignedTime);
      }, 0);
      const avgTurnaroundMs = totalTurnaroundMs / completedReviews.length;
      const avgTurnaroundHours = avgTurnaroundMs / (1000 * 60 * 60);
      avgReviewTurnaroundTime =
        avgTurnaroundHours < 24
          ? `${avgTurnaroundHours.toFixed(1)} hours`
          : `${(avgTurnaroundHours / 24).toFixed(1)} days`;
    }

    // Calculate review trends (last 6 months)
    const reviewTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });

      const submittedInMonth = submittedAssignments.filter((a) => {
        if (!a.submitted_at) return false;
        const submitted = new Date(a.submitted_at);
        return submitted >= monthStart && submitted <= monthEnd;
      }).length;

      const receivedInMonth = receivedAssignments.filter((a) => {
        if (!a.submitted_at) return false;
        const submitted = new Date(a.submitted_at);
        return submitted >= monthStart && submitted <= monthEnd;
      }).length;

      reviewTrends.push({
        month: monthName,
        submitted: submittedInMonth,
        received: receivedInMonth,
      });
    }

    // Extract reviewer feedback highlights (positive keywords from recent reviews)
    const reviewerFeedbackHighlights = [];
    const recentReviews = receivedAssignments
      .filter((a) => a.review_content && a.rating && a.rating >= 4)
      .slice(0, 5);

    for (const review of recentReviews) {
      if (review.review_content) {
        const content = review.review_content.toLowerCase();
        const positiveKeywords = [
          "excellent",
          "great",
          "amazing",
          "fantastic",
          "well-designed",
          "useful",
          "innovative",
          "intuitive",
          "professional",
        ];
        const foundKeywords = positiveKeywords.filter((keyword) =>
          content.includes(keyword),
        );
        if (foundKeywords.length > 0) {
          reviewerFeedbackHighlights.push(
            `"${foundKeywords[0]}" - Recent ${review.rating}⭐ review`,
          );
        }
      }
    }

    // Extension performance (basic stats)
    const extensionPerformance = extensions
      .map((ext) => ({
        extensionId: ext.id,
        name: ext.name,
        downloads: 0, // Would need Chrome Web Store API integration
        rating: receivedAssignments
          .filter((a) => a.extension_id === ext.id && a.rating)
          .reduce((sum, a, _, arr) => sum + (a.rating || 0) / arr.length, 0),
      }))
      .filter((ext) => ext.rating > 0);

    // Platform averages (fetch from all users for comparison)
    const { data: allAssignments, error: allAssignmentsError } = await supabase
      .from("review_assignments")
      .select("assigned_at, submitted_at, reviewer_id")
      .in("status", ["submitted", "approved"])
      .not("assigned_at", "is", null)
      .not("submitted_at", "is", null)
      .gte(
        "submitted_at",
        new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      ); // Last 90 days

    let platformAverages = undefined;
    if (!allAssignmentsError && allAssignments) {
      const userReviewCounts = new Map();
      const turnaroundTimes = [];

      allAssignments.forEach((assignment) => {
        // Count reviews per user
        const count = userReviewCounts.get(assignment.reviewer_id) || 0;
        userReviewCounts.set(assignment.reviewer_id, count + 1);

        // Calculate turnaround time
        const assignedTime = new Date(assignment.assigned_at!).getTime();
        const submittedTime = new Date(assignment.submitted_at!).getTime();
        turnaroundTimes.push(submittedTime - assignedTime);
      });

      const avgSubmitted =
        Array.from(userReviewCounts.values()).reduce((a, b) => a + b, 0) /
        userReviewCounts.size;
      const avgTurnaroundMs =
        turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length;
      const avgTurnaroundHours = avgTurnaroundMs / (1000 * 60 * 60);

      platformAverages = {
        avgSubmitted: Math.round(avgSubmitted * 10) / 10,
        avgReceived: Math.round(avgSubmitted * 10) / 10, // Assuming symmetry
        avgTurnaround:
          avgTurnaroundHours < 24
            ? parseFloat(avgTurnaroundHours.toFixed(1))
            : parseFloat((avgTurnaroundHours / 24).toFixed(1)),
      };
    }

    // Badge rank based on total reviews submitted
    let badgeRank = "Novice Reviewer";
    let badgeIcon = "🌱";
    if (totalReviewsSubmitted >= 50) {
      badgeRank = "Expert Reviewer";
      badgeIcon = "🏆";
    } else if (totalReviewsSubmitted >= 25) {
      badgeRank = "Advanced Reviewer";
      badgeIcon = "⭐";
    } else if (totalReviewsSubmitted >= 10) {
      badgeRank = "Experienced Reviewer";
      badgeIcon = "🎯";
    } else if (totalReviewsSubmitted >= 5) {
      badgeRank = "Active Reviewer";
      badgeIcon = "🚀";
    }

    const stats: PremiumPersonalStats = {
      cycleStart: cycleStart.toISOString(),
      cycleEnd: cycleEnd.toISOString(),
      daysLeftInCycle,
      reviewsSubmittedThisCycle,
      reviewsReceivedThisCycle,
      totalReviewsSubmitted,
      totalReviewsReceived,
      queuePosition: 1, // Premium users get priority
      avgWaitTimeDays: 0.5, // Premium users get faster service
      avgReviewTurnaroundTime,
      reviewTrends,
      reviewerFeedbackHighlights: reviewerFeedbackHighlights.slice(0, 3),
      extensionPerformance,
      priorityQueueStatus: "Fast Track Active",
      nextReviewETA: "Within 24 hours",
      platformAverages,
      badgeRank,
      badgeIcon,
    };

    console.log("✅ Premium personal stats calculated successfully");
    return new Response(JSON.stringify({ success: true, data: stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("💥 Error in fetch-premium-personal-stats function:", {
      message: error?.message || "Unknown error",
      name: error?.name || "Unknown",
      stack: error?.stack || "No stack trace available",
    });

    return new Response(
      JSON.stringify({
        success: false,
        error:
          "Internal server error occurred while fetching premium personal stats",
        details: error?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
