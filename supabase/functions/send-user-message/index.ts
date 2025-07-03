import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  admin_key: string
}

serve(async (req) => {
  console.log('🚀 send-user-message function started [v7.0 - EXTREME DEBUG]')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log all headers
    console.log('📋 REQUEST HEADERS:')
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'authorization') {
        console.log(`  ${key}: ${value.substring(0, 20)}...`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    console.log('🔧 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasAnonKey: !!supabaseAnonKey
    })

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('❌ Missing environment variables')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const body = await req.json()
    console.log('📥 Request body received:', {
      hasRecipientId: !!body.recipient_id,
      hasSubject: !!body.subject,
      hasMessage: !!body.message,
      hasPriority: !!body.priority,
      hasAdminKey: !!body.admin_key,
      adminKeyCorrect: body.admin_key === 'chrome_ex_dev_admin_2025'
    })

    const { recipient_id, subject, message, priority, admin_key } = body

    // Check admin key first - if valid, bypass complex JWT checks
    if (admin_key === 'chrome_ex_dev_admin_2025') {
      console.log('✅ Valid admin key provided - bypassing JWT validation')
    } else {
      console.log('🔑 No admin key - performing full JWT authentication')
      
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        console.error('❌ No authorization header')
        return new Response(
          JSON.stringify({ success: false, error: 'Authorization required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      console.log('🔍 JWT Token analysis:', {
        hasBearer: authHeader.startsWith('Bearer '),
        tokenLength: authHeader.length,
        tokenPreview: authHeader.substring(0, 30) + '...'
      })

      // Create user client to verify JWT
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      })

      console.log('👤 Attempting to get user from JWT...')
      const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
      
      console.log('👤 JWT Verification result:', {
        hasUser: !!user,
        userEmail: user?.email,
        userId: user?.id,
        errorMessage: authError?.message,
        errorCode: authError?.code
      })
      
      if (authError || !user) {
        console.error('❌ JWT authentication failed:', authError?.message)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Authentication failed',
            details: authError?.message,
            debug: 'JWT token is invalid or expired'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      console.log('✅ JWT verified for user:', user.email)

      // Check if authenticated user is admin
      console.log('🔍 Checking admin status...')
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', user.id)
        .single()

      console.log('👤 Profile lookup result:', {
        found: !!profile,
        role: profile?.role,
        email: profile?.email,
        errorMessage: profileError?.message
      })

      if (profileError || !profile || profile.role !== 'admin') {
        console.error('❌ User is not admin:', {
          profileError: profileError?.message,
          userRole: profile?.role,
          requiredRole: 'admin'
        })
        return new Response(
          JSON.stringify({ success: false, error: 'Admin access required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      console.log('✅ User confirmed as admin:', profile.email)
    }

    if (!recipient_id || !subject || !message) {
      console.error('❌ Missing required fields:', {
        hasRecipientId: !!recipient_id,
        hasSubject: !!subject,
        hasMessage: !!message
      })
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: recipient_id, subject, message' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Use service role for all database operations
    console.log('🔧 Creating service role client...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if recipient exists
    console.log('🔍 Looking up recipient:', recipient_id)
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('id', recipient_id)
      .single()

    console.log('👤 Recipient lookup result:', {
      found: !!recipient,
      email: recipient?.email,
      name: recipient?.name,
      errorMessage: recipientError?.message,
      errorCode: recipientError?.code
    })

    if (recipientError || !recipient) {
      console.error('❌ Recipient not found:', recipientError?.message)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Recipient not found',
          details: recipientError?.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('✅ Recipient found:', recipient.email)

    // Insert message using service role
    console.log('💾 Inserting message into user_messages table...')
    const messagePayload = {
      recipient_id: recipient_id,
      sender_id: null, // Will be null for system admin messages
      subject: subject,
      message: message,
      priority: priority || 'normal',
      popup_on_login: false,
      is_read: false // Correct column name
    }
    console.log('📋 Message payload:', messagePayload)

    const { data: messageData, error: insertError } = await supabase
      .from('user_messages')
      .insert(messagePayload)
      .select()
      .single()

    console.log('💾 Insert result:', {
      success: !!messageData,
      messageId: messageData?.id,
      errorMessage: insertError?.message,
      errorCode: insertError?.code,
      errorDetails: insertError?.details
    })

    if (insertError) {
      console.error('❌ Message insert failed:', insertError.message)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send message',
          details: insertError.message,
          errorCode: insertError.code 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('✅ Message sent successfully:', messageData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: messageData.id,
        recipient: recipient.email,
        debug: 'Message sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('💥 Fatal error:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
        stack: error?.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 