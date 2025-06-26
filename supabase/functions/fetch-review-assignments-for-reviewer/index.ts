const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FetchReviewAssignmentsRequest {
  user_id: string
}

interface ReviewAssignmentWithDetails {
  id: string
  batch_id: string
  extension_id: string
  reviewer_id: string
  assignment_number: number
  assigned_at: string
  due_at: string
  status: 'assigned' | 'submitted' | 'approved'
  installed_at: string | null
  earliest_review_time: string | null
  review_text: string | null
  rating: number | null
  chrome_store_proof: string | null
  submitted_at: string | null
  admin_notes: string | null
  extension: {
    id: string
    name: string
    description: string | null
    logo_url: string | null
    chrome_store_url: string
    category: string[] | null
  } | null
}

Deno.serve(async (req) => {
  console.log('🚀 fetch-review-assignments-for-reviewer function started')
  console.log('📝 Request method:', req.method)
  console.log('🌐 Request URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Checking environment variables...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: Missing environment variables'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ Environment variables check passed')
    // Use service role key to bypass RLS and prevent infinite recursion
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📦 Parsing request body...')
    let requestBody
    try {
      requestBody = await req.json()
      console.log('📋 Request body parsed successfully')
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const { user_id }: FetchReviewAssignmentsRequest = requestBody

    if (!user_id) {
      console.error('❌ Missing user_id in request')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User ID is required' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('🔍 Fetching review assignments for user:', user_id)

    // Fetch review assignments with extension details using service role (bypasses RLS)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('review_assignments')
      .select(`
        id,
        batch_id,
        extension_id,
        reviewer_id,
        assignment_number,
        assigned_at,
        due_at,
        status,
        installed_at,
        earliest_review_time,
        review_text,
        rating,
        chrome_store_proof,
        submitted_at,
        admin_notes
      `)
      .eq('reviewer_id', user_id)
      .order('assigned_at', { ascending: false })

    if (assignmentsError) {
      console.error('❌ Assignments fetch error:', {
        message: assignmentsError.message,
        code: assignmentsError.code,
        details: assignmentsError.details
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch review assignments',
          details: assignmentsError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ Review assignments fetched successfully:', assignments?.length || 0, 'assignments')

    // If no assignments, return empty array
    if (!assignments || assignments.length === 0) {
      console.log('ℹ️ No assignments found for user')
      return new Response(
        JSON.stringify({ 
          success: true,
          data: []
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Fetch extension details for each assignment
    console.log('🔍 Fetching extension details for assignments...')
    const extensionIds = assignments.map(a => a.extension_id)
    
    const { data: extensions, error: extensionsError } = await supabase
      .from('extensions')
      .select(`
        id,
        name,
        description,
        logo_url,
        chrome_store_url,
        category
      `)
      .in('id', extensionIds)

    if (extensionsError) {
      console.error('❌ Extensions fetch error:', {
        message: extensionsError.message,
        code: extensionsError.code,
        details: extensionsError.details
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch extension details',
          details: extensionsError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ Extension details fetched successfully:', extensions?.length || 0, 'extensions')

    // Create a map of extensions by ID for easy lookup
    const extensionsMap = new Map()
    if (extensions) {
      extensions.forEach(ext => {
        extensionsMap.set(ext.id, ext)
      })
    }

    // Combine assignments with their extension details
    const assignmentsWithDetails: ReviewAssignmentWithDetails[] = assignments.map(assignment => ({
      ...assignment,
      extension: extensionsMap.get(assignment.extension_id) || null
    }))

    console.log('🎉 Successfully combined assignments with extension details')

    return new Response(
      JSON.stringify({ 
        success: true,
        data: assignmentsWithDetails
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Error in fetch-review-assignments-for-reviewer function:', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace available'
    })
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error occurred while fetching review assignments',
        details: error?.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})