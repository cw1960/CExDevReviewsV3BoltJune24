import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FetchPremiumPersonalStatsRequest {
  userId: string
}

interface PremiumPersonalStats {
  cycleStart: string
  cycleEnd: string
  daysLeftInCycle: number
  reviewsSubmittedThisCycle: number
  reviewsReceivedThisCycle: number
  totalReviewsSubmitted: number
  totalReviewsReceived: number
  queuePosition?: number
  avgWaitTimeDays?: number
  avgReviewTurnaroundTime?: number
  reviewTrends?: Array<{ month: string; submitted: number; received: number }>
  reviewerFeedbackHighlights?: string[]
  extensionPerformance?: Array<{ extensionId: string; downloads: number; rating: number }>
  priorityQueueStatus?: string
  nextReviewETA?: string
  platformAverages?: {
    avgSubmitted: number
    avgReceived: number
    avgTurnaround: number
  }
  badgeRank?: string
  badgeIcon?: string
}

const CYCLE_LENGTH_DAYS = 28

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userId }: FetchPremiumPersonalStatsRequest = await req.json()
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

    // Reviews received as extension owner (lifetime and this cycle)
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

    // Premium-only stats (placeholders for now)
    const queuePosition = undefined // TODO: Implement
    const avgWaitTimeDays = undefined // TODO: Implement
    const avgReviewTurnaroundTime = undefined // TODO: Implement
    const reviewTrends = [] // TODO: Implement
    const reviewerFeedbackHighlights = [] // TODO: Implement
    const extensionPerformance = [] // TODO: Implement
    const priorityQueueStatus = 'Fast Track' // Always premium
    const nextReviewETA = undefined // TODO: Implement
    const platformAverages = undefined // TODO: Implement
    const badgeRank = undefined // TODO: Implement
    const badgeIcon = undefined // TODO: Implement

    const stats: PremiumPersonalStats = {
      cycleStart: cycleStart.toISOString(),
      cycleEnd: cycleEnd.toISOString(),
      daysLeftInCycle,
      reviewsSubmittedThisCycle,
      reviewsReceivedThisCycle,
      totalReviewsSubmitted,
      totalReviewsReceived,
      queuePosition,
      avgWaitTimeDays,
      avgReviewTurnaroundTime,
      reviewTrends,
      reviewerFeedbackHighlights,
      extensionPerformance,
      priorityQueueStatus,
      nextReviewETA,
      platformAverages,
      badgeRank,
      badgeIcon
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