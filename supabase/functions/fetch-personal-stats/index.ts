const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FetchPersonalStatsRequest {
  userId: string;
}

interface PersonalStats {
  cycleStart: string;
  cycleEnd: string;
  daysLeftInCycle: number;
  reviewsSubmittedThisCycle: number;
  reviewsReceivedThisCycle: number;
  reviewsLeftToSubmit: number;
  reviewsLeftToReceive: number;
  totalReviewsSubmitted: number;
  totalReviewsReceived: number;
  // Motivator stats (placeholders)
  avgWaitTimeDays?: number;
  queuePosition?: number;
}

const CYCLE_LENGTH_DAYS = 28;
const CYCLE_REVIEW_LIMIT = 4;

Deno.serve(async (req) => {
  console.log("🚀 fetch-personal-stats function started");
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
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
    const { createClient } = await import("npm:@supabase/supabase-js@2");

    // Extract and validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing or invalid Authorization header",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    console.log("🔐 JWT token extracted, length:", jwt.length);

    // Create clients
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT
    console.log("🔐 Verifying JWT token...");
    const { data: { user: verifiedUser }, error: authError } = await supabaseAuth.auth.getUser(jwt);
    
    if (authError || !verifiedUser) {
      console.log("❌ JWT verification failed:", authError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or expired JWT token",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        },
      );
    }

    console.log("✅ JWT verified successfully for user:", verifiedUser.id);

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

    const { userId }: FetchPersonalStatsRequest = requestBody;

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

    console.log("🔍 Fetching personal stats for user:", userId);

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
      .select("id, submitted_at")
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
    const reviewsLeftToSubmit = Math.max(
      0,
      CYCLE_REVIEW_LIMIT - reviewsSubmittedThisCycle,
    );

    // Reviews received as extension owner (lifetime and this cycle)
    // Find all extensions owned by user
    const { data: extensions, error: extError } = await supabase
      .from("extensions")
      .select("id")
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
    if (extensionIds.length > 0) {
      const { data: receivedAssignments, error: receivedError } = await supabase
        .from("review_assignments")
        .select("id, submitted_at, extension_id")
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
      totalReviewsReceived = receivedAssignments.length;
      reviewsReceivedThisCycle = receivedAssignments.filter((a) => {
        if (!a.submitted_at) return false;
        const submitted = new Date(a.submitted_at);
        return submitted >= cycleStart && submitted < cycleEnd;
      }).length;
    }
    const reviewsLeftToReceive = Math.max(
      0,
      CYCLE_REVIEW_LIMIT - reviewsReceivedThisCycle,
    );

    // Placeholder motivator stats
    const avgWaitTimeDays = undefined; // TODO: Implement if desired
    const queuePosition = undefined; // TODO: Implement if desired

    const stats: PersonalStats = {
      cycleStart: cycleStart.toISOString(),
      cycleEnd: cycleEnd.toISOString(),
      daysLeftInCycle,
      reviewsSubmittedThisCycle,
      reviewsReceivedThisCycle,
      reviewsLeftToSubmit,
      reviewsLeftToReceive,
      totalReviewsSubmitted,
      totalReviewsReceived,
      avgWaitTimeDays,
      queuePosition,
    };

    console.log("✅ Personal stats calculated successfully");
    return new Response(JSON.stringify({ success: true, data: stats }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("💥 Error in fetch-personal-stats function:", {
      message: error?.message || "Unknown error",
      name: error?.name || "Unknown",
      stack: error?.stack || "No stack trace available",
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error occurred while fetching personal stats",
        details: error?.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
