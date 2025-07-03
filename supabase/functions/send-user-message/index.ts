import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('🚀 EMERGENCY SIMPLE VERSION - RESTORING BUSINESS FUNCTIONALITY')
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('✅ Got request:', body)

    // Simple admin key check
    if (body.admin_key !== 'chrome_ex_dev_admin_2025') {
      console.log('❌ Invalid admin key')
      return new Response(JSON.stringify({ success: false, error: 'Invalid admin key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    console.log('✅ Admin key valid')

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ success: false, error: 'Missing config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    // Create client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('✅ Supabase client created')

    // Insert message directly
    const { data, error } = await supabase
      .from('user_messages')
      .insert({
        recipient_id: body.recipient_id,
        subject: body.subject,
        message: body.message,
        priority: body.priority || 'normal',
        popup_on_login: body.popup_on_login || false,
        is_read: false,
        sender_id: null
      })
      .select()
      .single()

    if (error) {
      console.log('❌ Database error:', error)
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    console.log('✅ Message sent successfully:', data.id)
    return new Response(JSON.stringify({ 
      success: true, 
      message_id: data.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.log('💥 Error:', error.message)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}) 