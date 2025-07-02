import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
      .select('id, role')
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

    // Debug: First check if there are any messages at all
    console.log('🔍 Checking for any messages in user_messages table...')
    const { data: allMessages, error: allMessagesError } = await supabase
      .from("user_messages")
      .select("id, sender_id, recipient_id, subject, created_at")
      .limit(5);

    console.log('📊 All messages query result:', { allMessages, allMessagesError })

    // Debug: Check if this user has sent any messages
    console.log('🔍 Checking for messages by this admin user:', profile.id)
    const { data: userMessages, error: userMessagesError } = await supabase
      .from("user_messages")
      .select("id, sender_id, recipient_id, subject, created_at")
      .eq("sender_id", profile.id)

    console.log('📊 User messages query result:', { userMessages, userMessagesError })

    // If no messages, return empty array with debug info
    if (!userMessages || userMessages.length === 0) {
      console.log('ℹ️ No messages found for admin user')
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: [],
          debug: {
            adminUserId: profile.id,
            totalMessages: allMessages?.length || 0,
            adminMessages: userMessages?.length || 0
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Fetch messages sent by admin with recipient details and read status
    console.log('📨 Fetching detailed messages with recipient info...')
    const { data: messages, error: messagesError } = await supabase
      .from("user_messages")
      .select(`
        *,
        recipient:recipient_id (
          id,
          name,
          email
        )
      `)
      .eq("sender_id", profile.id)
      .order("created_at", { ascending: false });

    if (messagesError) {
      console.error("❌ Error fetching detailed sent messages:", messagesError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch sent messages: " + messagesError.message,
          debug: {
            adminUserId: profile.id,
            errorCode: messagesError.code,
            errorDetails: messagesError.details
          }
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('✅ Successfully fetched messages:', messages?.length || 0)

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: messages || [] 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in fetch-admin-sent-messages function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}); 