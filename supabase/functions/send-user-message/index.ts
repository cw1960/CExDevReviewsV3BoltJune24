import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('🚀 send-user-message function started [v11.0 - FULL RESTORE FOR DASHBOARD TEST]')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('🔧 Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })

    if (!supabaseUrl || !supabaseServiceKey) {
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

    const { recipient_id, subject, message, priority, popup_on_login, admin_key } = body

    // VERIFY ADMIN KEY - this is our authentication
    if (!admin_key || admin_key !== 'chrome_ex_dev_admin_2025') {
      console.error('❌ Invalid or missing admin key')
      return new Response(
        JSON.stringify({ success: false, error: 'Valid admin key required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('✅ Valid admin key provided - proceeding with message')

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

    // Use service role client for ALL operations (bypasses RLS completely)
    console.log('🔧 Creating service role client...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify recipient exists
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

    // Insert message with service role (bypasses all RLS)
    console.log('💾 Inserting message into user_messages table...')
    const messagePayload = {
      recipient_id: recipient_id,
      sender_id: null, // System admin messages have null sender_id
      subject: subject,
      message: message,
      priority: priority || 'normal',
      popup_on_login: popup_on_login || false,
      is_read: false // Correct column name from schema
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
          errorCode: insertError.code,
          hint: insertError.hint 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('✅ Message sent successfully to:', recipient.email)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: messageData.id,
        recipient: {
          id: recipient.id,
          email: recipient.email,
          name: recipient.name
        },
        debug: 'Message sent via service role authentication with admin key'
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
        details: error?.message || 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 