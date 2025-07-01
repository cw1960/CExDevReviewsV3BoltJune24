const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface MarkMessageReadRequest {
  message_id: string
}

Deno.serve(async (req) => {
  console.log('🚀 mark-message-read function started [v2.0 - Fixed Pattern]')
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

    // Get the Authorization header to extract user info
    const authHeader = req.headers.get('Authorization')
    console.log('🔑 Authorization header:', authHeader ? 'Present' : 'Missing')

    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization header required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Create supabase client with user JWT to validate auth
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    console.log('👤 User result:', user ? `Found user: ${user.id}` : 'No user found')

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication required',
          details: authError?.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Create service role client for database operations
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

    const { message_id }: MarkMessageReadRequest = requestBody

    console.log('📬 Mark message as read request:', { message_id, user_id: user.id })

    // Validate required fields
    if (!message_id) {
      console.error('❌ Missing message_id')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Message ID is required' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Verify message exists and belongs to the user
    const { data: message, error: messageError } = await supabase
      .from('user_messages')
      .select('id, recipient_id, is_read')
      .eq('id', message_id)
      .single()

    if (messageError || !message) {
      console.error('❌ Message not found:', messageError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Message not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Verify user owns this message
    if (message.recipient_id !== user.id) {
      console.error('❌ Access denied - user does not own this message')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Access denied'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    // Skip if already read
    if (message.is_read) {
      console.log('ℹ️ Message already marked as read')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Message was already marked as read'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Mark message as read using service role client
    const { data: updatedMessage, error: updateError } = await supabase
      .from('user_messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', message_id)
      .eq('recipient_id', user.id) // Extra security check
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating message:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to mark message as read: ' + updateError.message 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ Message marked as read successfully:', message_id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message marked as read',
        data: updatedMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Error in mark-message-read function:', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace available'
    })
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error occurred while marking message as read',
        details: error?.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 