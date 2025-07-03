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
  admin_key?: string
}

Deno.serve(async (req) => {
  console.log('🚀 send-user-message function started [v7.0 - JWT Compatible]')
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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('❌ Missing environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

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
      popup_on_login = false,
      admin_key
    }: SendMessageRequest = requestBody

    // Get the Authorization header for user authentication
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

    // Create client with user auth for verification
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Check if user is admin - use multiple verification methods
    let isAdmin = false
    let adminProfile = null
    
    console.log('🔍 Checking admin status for user:', user.id, user.email)
    
    try {
      // Method 1: Check users table for admin role
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, id, name, email')
        .eq('id', user.id)
        .single()

      if (profile && profile.role === 'admin') {
        isAdmin = true
        adminProfile = profile
        console.log('✅ Admin found in users table:', user.id)
      } else {
        console.log('ℹ️ User not found in users table or not admin role')
      }
    } catch (checkError) {
      console.log('ℹ️ Error checking users table:', checkError)
    }

    // Method 2: Check by known admin emails (fallback)
    if (!isAdmin) {
      const adminEmails = ['chrism2homefolder@gmail.com', 'cristo@cristolopez.com', 'admin@chromeexdev.reviews', 'chris@chromeexdev.reviews']
      if (adminEmails.includes(user.email || '')) {
        isAdmin = true
        console.log('✅ Admin verified by email:', user.email)
      }
    }

    // Method 3: Check admin key (additional verification)
    if (!isAdmin && admin_key === 'chrome_ex_dev_admin_2025') {
      isAdmin = true
      console.log('✅ Admin verified by admin key')
    }

    if (!isAdmin) {
      console.error('❌ Authorization failed - user is not admin')
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

    console.log('✅ Admin authentication successful')

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

    console.log('🔍 Verifying recipient exists...')
    
    // Verify recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', recipient_id)
      .single()

    if (recipientError || !recipient) {
      console.error('❌ Recipient not found:', recipientError?.message)
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

    console.log('✅ Recipient found:', recipient.email)

    // Use authenticated admin user ID as sender (or fallback to system admin)
    const senderId = adminProfile?.id || user.id || '00000000-0000-0000-0000-000000000001'
    
    console.log('📤 Inserting message with sender:', senderId)
    
    // Insert message using service role (bypasses RLS)
    const { data: messageData, error: insertError } = await supabase
      .from('user_messages')
      .insert({
        recipient_id,
        sender_id: senderId,
        subject: subject.trim(),
        message: message.trim(),
        priority,
        popup_on_login
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error inserting message:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send message: ' + insertError.message,
          details: insertError
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
      message: (error as any)?.message || 'Unknown error',
      name: (error as any)?.name || 'Unknown',
      stack: (error as any)?.stack || 'No stack trace available'
    })
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error occurred while sending message',
        details: (error as any)?.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 