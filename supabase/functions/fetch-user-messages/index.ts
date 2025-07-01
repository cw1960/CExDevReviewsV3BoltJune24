const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FetchMessagesRequest {
  user_id?: string
}

Deno.serve(async (req) => {
  console.log('🚀 fetch-user-messages function started [v2.0 - Fixed Pattern]')
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
      console.log('ℹ️ No request body provided, using default')
      requestBody = {}
    }

    const { user_id }: FetchMessagesRequest = requestBody

    // Verify user permissions and determine target user ID
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User profile not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // Determine target user ID
    let targetUserId = user.id
    if (user_id && profile.role === 'admin') {
      // Admins can fetch messages for any user
      targetUserId = user_id
      console.log('🔑 Admin fetching messages for user:', targetUserId)
    } else if (user_id && user_id !== user.id) {
      // Non-admins can only fetch their own messages
      console.error('❌ Access denied - user trying to fetch messages for another user')
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

    console.log('🔍 Fetching messages for user:', targetUserId)

    // Fetch user messages using service role client
    const { data: messages, error: fetchError } = await supabase
      .from('user_messages')
      .select(`
        id,
        subject,
        message,
        priority,
        popup_on_login,
        is_read,
        created_at,
        read_at,
        sender_id,
        sender:sender_id(name, email)
      `)
      .eq('recipient_id', targetUserId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching messages:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch messages: ' + fetchError.message 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    // Format messages for response
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      subject: msg.subject,
      message: msg.message,
      priority: msg.priority,
      popup_on_login: msg.popup_on_login,
      is_read: msg.is_read,
      created_at: msg.created_at,
      read_at: msg.read_at,
      sender_name: msg.sender?.name || 'Admin'
    }))

    console.log(`✅ Fetched ${formattedMessages.length} messages for user ${targetUserId}`)

    return new Response(
      JSON.stringify({
        success: true,
        messages: formattedMessages,
        unread_count: formattedMessages.filter(msg => !msg.is_read).length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Error in fetch-user-messages function:', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace available'
    })
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error occurred while fetching messages',
        details: error?.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 