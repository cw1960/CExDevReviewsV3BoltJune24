const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SendMessageRequest {
  recipient_id: string
  subject: string
  message: string
  priority?: 'normal' | 'high' | 'urgent'
  popup_on_login?: boolean
}

Deno.serve(async (req) => {
  console.log('🚀 send-user-message function started [v4.0 - Fixed Pattern]')
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

    // Verify user is admin
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      console.error('❌ Authorization failed - user is not admin:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Admin access required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    console.log('✅ Admin authentication successful for user:', user.id)

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

    const { 
      recipient_id, 
      subject, 
      message, 
      priority = 'normal', 
      popup_on_login = false 
    }: SendMessageRequest = requestBody

    // Validate required fields
    if (!recipient_id || !subject?.trim() || !message?.trim()) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Recipient ID, subject, and message are required' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Validate priority
    if (!['normal', 'high', 'urgent'].includes(priority)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Priority must be normal, high, or urgent' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('🔍 Sending message to recipient:', recipient_id)

    // Verify recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', recipient_id)
      .single()

    if (recipientError || !recipient) {
      console.error('❌ Recipient not found:', recipientError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Recipient not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Insert message
    const { data: messageData, error: insertError } = await supabase
      .from('user_messages')
      .insert({
        recipient_id,
        sender_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
        priority,
        popup_on_login
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting message:', insertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send message: ' + insertError.message 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ Message sent successfully:', messageData.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Message sent successfully to ${recipient.name || recipient.email}`,
        data: messageData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Error in send-user-message function:', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace available'
    })
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error occurred while sending message',
        details: error?.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 