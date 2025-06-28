const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FixAssignmentRequest {
  assignment_id: string
  new_status: 'assigned' | 'submitted' | 'approved'
  submitted_at?: string
}

Deno.serve(async (req) => {
  console.log('🚀 fix-assignment-status function started')
  console.log('📝 Request method:', req.method)

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
      console.error('❌ Missing environment variables')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server configuration error: Missing environment variables',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    console.log('✅ Environment variables check passed')
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
          error: 'Invalid JSON in request body',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    const { assignment_id, new_status, submitted_at }: FixAssignmentRequest = requestBody

    if (!assignment_id || !new_status) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'assignment_id and new_status are required' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('🔍 Updating assignment status:', { assignment_id, new_status, submitted_at })

    // Update the assignment status
    const updateData: any = { status: new_status }
    if (submitted_at) {
      updateData.submitted_at = submitted_at
    }

    const { data: assignment, error: updateError } = await supabase
      .from('review_assignments')
      .update(updateData)
      .eq('id', assignment_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Failed to update assignment:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update assignment status',
          details: updateError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    console.log('✅ Assignment status updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Assignment status updated to ${new_status}`,
        data: assignment
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Error in fix-assignment-status function:', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace available',
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error occurred while fixing assignment status',
        details: error?.message || 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
}) 