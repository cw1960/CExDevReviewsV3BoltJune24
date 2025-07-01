import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Mark Message Read function up and running!")

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

    // Parse request body
    const { message_id } = await req.json()

    console.log('Mark message as read request:', { message_id, user_id: user.id })

    // Validate required fields
    if (!message_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Message ID is required' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify message exists and belongs to the user
    const { data: message, error: messageError } = await supabaseClient
      .from('user_messages')
      .select('id, recipient_id, is_read')
      .eq('id', message_id)
      .single()

    if (messageError || !message) {
      console.error('Message not found:', messageError)
      return new Response(
        JSON.stringify({ success: false, error: 'Message not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify user owns this message
    if (message.recipient_id !== user.id) {
      console.error('Access denied - user does not own this message')
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Skip if already read
    if (message.is_read) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Message was already marked as read'
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Mark message as read
    const { data: updatedMessage, error: updateError } = await supabaseClient
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
      console.error('Error updating message:', updateError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to mark message as read: ' + updateError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Message marked as read successfully:', message_id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Message marked as read',
        data: updatedMessage
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error in mark-message-read:', error)
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