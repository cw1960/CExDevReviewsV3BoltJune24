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
  console.log('🚀 send-user-message function started [v5.0 - JWT + ADMIN KEY HYBRID]')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('❌ Missing environment variables')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const body = await req.json()
    console.log('📥 Request received with keys:', Object.keys(body))

    const { recipient_id, subject, message, priority, admin_key } = body

    // Check for admin key first
    if (admin_key === 'chrome_ex_dev_admin_2025') {
      console.log('✅ Admin key provided - bypassing JWT auth')
    } else {
      // If no admin key, require JWT authentication
      console.log('🔑 No admin key - checking JWT authentication')
      
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        console.error('❌ No authorization header and no admin key')
        return new Response(
          JSON.stringify({ success: false, error: 'Authorization required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Verify JWT token
      const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      })

      const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ JWT authentication failed:', authError)
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      console.log('✅ JWT verified for user:', user.email)

      // Check if user is admin
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile || profile.role !== 'admin') {
        console.error('❌ User is not admin')
        return new Response(
          JSON.stringify({ success: false, error: 'Admin access required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        )
      }

      console.log('✅ User confirmed as admin')
    }

    if (!recipient_id || !subject || !message) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: recipient_id, subject, message' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Use service role for all database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if recipient exists
    console.log('🔍 Looking up recipient:', recipient_id)
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', recipient_id)
      .single()

    if (recipientError || !recipient) {
      console.error('❌ Recipient not found:', recipientError)
      return new Response(
        JSON.stringify({ success: false, error: 'Recipient not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('✅ Recipient found:', recipient.email)

    // Insert message using service role (bypasses all RLS)
    console.log('💾 Inserting message...')
    const { data: messageData, error: insertError } = await supabase
      .from('user_messages')
      .insert({
        recipient_id: recipient_id,
        subject: subject,
        message: message,
        priority: priority || 'normal',
        sent_by: 'system_admin',
        sent_at: new Date().toISOString(),
        read: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Message insert failed:', insertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to send message',
          details: insertError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('✅ Message sent successfully:', messageData.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message_id: messageData.id,
        recipient: recipient.email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('💥 Fatal error:', error)
    
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