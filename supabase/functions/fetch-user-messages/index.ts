import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Fetch User Messages function up and running!")

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
    const { user_id } = await req.json()

    // Verify user can only fetch their own messages (unless admin)
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Determine target user ID
    let targetUserId = user.id
    if (user_id && profile.role === 'admin') {
      // Admins can fetch messages for any user
      targetUserId = user_id
    } else if (user_id && user_id !== user.id) {
      // Non-admins can only fetch their own messages
      return new Response(
        JSON.stringify({ success: false, error: 'Access denied' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('Fetching messages for user:', targetUserId)

    // Fetch user messages
    const { data: messages, error: fetchError } = await supabaseClient
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
        sender:sender_id(name, email)
      `)
      .eq('recipient_id', targetUserId)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching messages:', fetchError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch messages: ' + fetchError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    console.log(`Fetched ${formattedMessages.length} messages for user ${targetUserId}`)

    return new Response(
      JSON.stringify({
        success: true,
        messages: formattedMessages,
        unread_count: formattedMessages.filter(msg => !msg.is_read).length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Unexpected error in fetch-user-messages:', error)
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