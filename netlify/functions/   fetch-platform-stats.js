const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: 'ok',
    };
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, subscription_status, last_active_at, has_completed_qualification, created_at');
    if (usersError) throw usersError;

    // Extensions
    const { data: extensions, error: extensionsError } = await supabase
      .from('extensions')
      .select('id, status, owner_id, created_at, submitted_to_queue_at');
    if (extensionsError) throw extensionsError;

    // Review assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('review_assignments')
      .select('id, reviewer_id, extension_id, status, assigned_at, submitted_at, due_at, created_at');
    if (assignmentsError) throw assignmentsError;

    // Credit transactions
    const { data: credits, error: creditsError } = await supabase
      .from('credit_transactions')
      .select('id, user_id, amount, type, created_at');
    if (creditsError) throw creditsError;

    // Stats calculations
    const now = new Date();
    const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    const totalUsers = users.length;
    const totalFreeUsers = users.filter(u => u.subscription_status === 'free').length;
    const totalPremiumUsers = users.filter(u => u.subscription_status === 'premium').length;
    const totalExtensions = extensions.length;
    const totalExtensionsInQueue = extensions.filter(e => e.status === 'queued').length;
    const totalReviewsAssigned = assignments.length;
    const totalReviewsCompleted = assignments.filter(a => a.status === 'approved' || a.status === 'submitted').length;
    const reviewsInProgress = assignments.filter(a => a.status === 'assigned').length;
    const creditsEarned = credits.filter(c => c.type === 'earned').reduce((sum, c) => sum + (c.amount || 0), 0);
    const activeReviewers = users.filter(u => {
      const recent = assignments.find(a => a.reviewer_id === u.id && a.status === 'approved' && a.submitted_at && new Date(a.submitted_at) > daysAgo(30));
      return !!recent;
    }).length;
    const reviewsCompletedLast7Days = assignments.filter(a => a.status === 'approved' && a.submitted_at && new Date(a.submitted_at) > daysAgo(7)).length;

    // Average review completion time (from assigned_at to submitted_at)
    const completionTimes = assignments
      .filter(a => a.status === 'approved' && a.assigned_at && a.submitted_at)
      .map(a => new Date(a.submitted_at).getTime() - new Date(a.assigned_at).getTime());
    let avgReviewCompletionTime = 'N/A';
    if (completionTimes.length > 0) {
      const avgMs = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;
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
      avgReviewCompletionTime
    };

    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, stats }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
    };
  }
};