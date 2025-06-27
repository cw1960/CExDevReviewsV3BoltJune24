import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FetchPersonalStatsRequest {
  userId: string
}

interface PersonalStats {
  cycleStart: string
  cycleEnd: string
  daysLeftInCycle: number
  reviewsSubmittedThisCycle: number
  reviewsReceivedThisCycle: number
  reviewsLeftToSubmit: number
  reviewsLeftToReceive: number
  totalReviewsSubmitted: number
  totalReviewsReceived: number
  // Motivator stats (placeholders)
  avgWaitTimeDays?: number
  queuePosition?: number
}

const CYCLE_LENGTH_DAYS = 28
const CYCLE_REVIEW_LIMIT = 4

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userId }: FetchPersonalStatsRequest = await req.json()
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Fetch user profile (to get created_at for cycle anchor)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, created_at')
      .eq('id', userId)
      .single()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Calculate current cycle start/end based on created_at
    const createdAt = new Date(user.created_at)
    const now = new Date()
    const msInDay = 24 * 60 * 60 * 1000
    const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / msInDay)
    const cyclesSinceSignup = Math.floor(daysSinceSignup / CYCLE_LENGTH_DAYS)
    const cycleStart = new Date(createdAt.getTime() + cyclesSinceSignup * CYCLE_LENGTH_DAYS * msInDay)
    const cycleEnd = new Date(cycleStart.getTime() + CYCLE_LENGTH_DAYS * msInDay)
    const daysLeftInCycle = Math.max(0, Math.ceil((cycleEnd.getTime() - now.getTime()) / msInDay))

    // Reviews submitted as reviewer (lifetime and this cycle)
    const { data: submittedAssignments, error: submittedError } = await supabase
      .from('review_assignments')
      .select('id, submitted_at')
      .eq('reviewer_id', userId)
      .in('status', ['submitted', 'approved'])
    if (submittedError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch submitted reviews' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    const totalReviewsSubmitted = submittedAssignments.length
    const reviewsSubmittedThisCycle = submittedAssignments.filter(a => {
      if (!a.submitted_at) return false
      const submitted = new Date(a.submitted_at)
      return submitted >= cycleStart && submitted < cycleEnd
    }).length
    const reviewsLeftToSubmit = Math.max(0, CYCLE_REVIEW_LIMIT - reviewsSubmittedThisCycle)

    // Reviews received as extension owner (lifetime and this cycle)
    // Find all extensions owned by user
    const { data: extensions, error: extError } = await supabase
      .from('extensions')
      .select('id')
      .eq('owner_id', userId)
    if (extError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch user extensions' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    const extensionIds = extensions.map(e => e.id)
    let totalReviewsReceived = 0
    let reviewsReceivedThisCycle = 0
    if (extensionIds.length > 0) {
      const { data: receivedAssignments, error: receivedError } = await supabase
        .from('review_assignments')
        .select('id, submitted_at, extension_id')
        .in('extension_id', extensionIds)
        .in('status', ['submitted', 'approved'])
      if (receivedError) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch received reviews' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      totalReviewsReceived = receivedAssignments.length
      reviewsReceivedThisCycle = receivedAssignments.filter(a => {
        if (!a.submitted_at) return false
        const submitted = new Date(a.submitted_at)
        return submitted >= cycleStart && submitted < cycleEnd
      }).length
    }
    const reviewsLeftToReceive = Math.max(0, CYCLE_REVIEW_LIMIT - reviewsReceivedThisCycle)

    // Placeholder motivator stats
    const avgWaitTimeDays = undefined // TODO: Implement if desired
    const queuePosition = undefined // TODO: Implement if desired

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
      queuePosition
    }

    return new Response(
      JSON.stringify({ success: true, data: stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})