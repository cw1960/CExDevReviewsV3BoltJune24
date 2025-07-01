import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Send User Message function up and running!")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user from JWT
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      console.error('Authorization error - user is not admin:', profileError)
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { recipient_id, subject, message, priority = 'normal', popup_on_login = false } = await req.json()

    console.log('Send message request:', { recipient_id, subject, priority, popup_on_login })

    // Validate required fields
    if (!recipient_id || !subject?.trim() || !message?.trim()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Recipient ID, subject, and message are required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify recipient exists
    const { data: recipient, error: recipientError } = await supabaseClient
      .from('users')
      .select('id, name, email')
      .eq('id', recipient_id)
      .single()

    if (recipientError || !recipient) {
      console.error('Recipient not found:', recipientError)
      return new Response(
        JSON.stringify({ success: false, error: 'Recipient not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Insert message
    const { data: messageData, error: insertError } = await supabaseClient
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
      console.error('Error inserting message:', insertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send message: ' + insertError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Message sent successfully:', messageData.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Message sent successfully to ${recipient.name || recipient.email}`,
        data: messageData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error in send-user-message:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error: ' + error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}) 