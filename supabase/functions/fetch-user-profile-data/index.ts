import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FetchUserProfileDataRequest {
  userId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userId }: FetchUserProfileDataRequest = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Fetching user profile data for user:', userId)

    // Fetch user profile
    console.log('Fetching user profile...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('User fetch error:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Fetch user's extensions
    console.log('Fetching user extensions...')
    const { data: extensions, error: extensionsError } = await supabase
      .from('extensions')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (extensionsError) {
      console.error('Extensions fetch error:', extensionsError)
      // Don't throw here, just log the error and continue
    }

    // Fetch user's review assignments (as reviewer)
    console.log('Fetching user review assignments...')
    const { data: reviewAssignments, error: assignmentsError } = await supabase
      .from('review_assignments')
      .select(`
        *,
        extension:extensions(id, name, owner_id, chrome_store_url, logo_url)
      `)
      .eq('reviewer_id', userId)
      .order('assigned_at', { ascending: false })

    if (assignmentsError) {
      console.error('Review assignments fetch error:', assignmentsError)
      // Don't throw here, just log the error and continue
    }

    // Fetch user's credit transactions
    console.log('Fetching user credit transactions...')
    const { data: creditTransactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50) // Limit to last 50 transactions

    if (transactionsError) {
      console.error('Credit transactions fetch error:', transactionsError)
      // Don't throw here, just log the error and continue
    }

    // Fetch extensions where this user has been assigned as reviewer (for relationship tracking)
    console.log('Fetching review relationships...')
    const { data: reviewRelationships, error: relationshipsError } = await supabase
      .from('review_relationships')
      .select(`
        *,
        extension:extensions(id, name, owner_id, chrome_store_url, logo_url),
        reviewed_owner:users!review_relationships_reviewed_owner_id_fkey(id, name, email)
      `)
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false })

    if (relationshipsError) {
      console.error('Review relationships fetch error:', relationshipsError)
      // Don't throw here, just log the error and continue
    }

    // Calculate statistics
    const totalExtensions = extensions?.length || 0
    const totalReviews = reviewAssignments?.filter(a => a.status === 'approved').length || 0
    const activeReviews = reviewAssignments?.filter(a => a.status === 'assigned').length || 0
    const totalCreditsEarned = creditTransactions?.filter(t => t.type === 'earned')
      .reduce((sum, t) => sum + t.amount, 0) || 0
    const totalCreditsSpent = creditTransactions?.filter(t => t.type === 'spent')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

    const stats = {
      totalExtensions,
      totalReviews,
      activeReviews,
      totalCreditsEarned,
      totalCreditsSpent,
      currentBalance: user.credit_balance
    }

    console.log('User profile data fetch completed successfully')
    console.log('Stats:', stats)

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          user: user || null,
          extensions: extensions || [],
          reviewAssignments: reviewAssignments || [],
          creditTransactions: creditTransactions || [],
          reviewRelationships: reviewRelationships || [],
          stats
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in fetch-user-profile-data function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})