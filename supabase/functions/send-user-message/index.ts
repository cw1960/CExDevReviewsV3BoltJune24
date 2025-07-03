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
  console.log('🚀 send-user-message function started [v6.0 - Simple Admin Check]')
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

    // SIMPLE ADMIN CHECK - if admin_key is provided, verify it
    if (admin_key) {
      const ADMIN_KEY = 'chrome_ex_dev_admin_2025'
      if (admin_key !== ADMIN_KEY) {
        console.error('❌ Invalid admin key provided')
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid admin key'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          }
        )
      }
      console.log('✅ Admin key verified - proceeding with admin privileges')
    } else {
      // If no admin key, you could add other auth checks here
      console.log('ℹ️ No admin key provided - assuming regular user (add auth logic if needed)')
    }

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

    // Create service role client (bypasses ALL RLS/JWT issues)
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    // Use system admin ID for all admin messages
    const systemAdminId = '00000000-0000-0000-0000-000000000001'
    
    console.log('📤 Inserting message with system admin sender...')
    console.log('Message data:', {
      recipient_id,
      sender_id: systemAdminId,
      subject: subject.trim(),
      message: message.trim(),
      priority,
      popup_on_login
    })
    
    // Insert message using service role (completely bypasses RLS)
    const { data: messageData, error: insertError } = await supabase
      .from('user_messages')
      .insert({
        recipient_id,
        sender_id: systemAdminId,
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