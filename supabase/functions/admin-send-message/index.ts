// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log('🚀 DEBUG VERSION - ADMIN MESSAGE FUNCTION STARTING')
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request - returning CORS headers')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📥 Starting to parse request body...')
    const body = await req.json()
    console.log('✅ Request body parsed successfully:', JSON.stringify(body, null, 2))

    // Simple admin key check
    console.log('🔑 Checking admin key...')
    if (body.admin_key !== 'chrome_ex_dev_admin_2025') {
      console.log('❌ Invalid admin key provided:', body.admin_key)
      return new Response(JSON.stringify({ success: false, error: 'Invalid admin key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    console.log('✅ Admin key is valid')

    // Get environment variables
    console.log('🔧 Getting environment variables...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('🔧 Environment check:', {
      hasUrl: !!supabaseUrl,
      urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING',
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyPreview: supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'MISSING'
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ Missing environment variables')
      return new Response(JSON.stringify({ success: false, error: 'Missing config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    // Create client with service role
    console.log('🔧 Creating Supabase client...')
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      console.log('✅ Supabase client created successfully')

      // Prepare message data
      console.log('📋 Preparing message data...')
      const messageData = {
        recipient_id: body.recipient_id,
        subject: body.subject,
        message: body.message,
        priority: body.priority || 'medium',
        popup_on_login: body.popup_on_login || false,
        is_read: false,
        sender_id: null
      }
      console.log('📋 Message data prepared:', JSON.stringify(messageData, null, 2))

      // Insert message directly
      console.log('💾 Attempting to insert message into user_messages table...')
      const { data, error } = await supabase
        .from('user_messages')
        .insert(messageData)
        .select()
        .single()

      console.log('💾 Database operation completed')
      console.log('💾 Insert result - Data:', data ? JSON.stringify(data, null, 2) : 'NULL')
      console.log('💾 Insert result - Error:', error ? JSON.stringify(error, null, 2) : 'NULL')

      if (error) {
        console.log('❌ Database insert failed')
        console.log('❌ Error message:', error.message)
        console.log('❌ Error code:', error.code)
        console.log('❌ Error details:', error.details)
        console.log('❌ Error hint:', error.hint)
        return new Response(JSON.stringify({ 
          success: false, 
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        })
      }

      console.log('✅ Message inserted successfully with ID:', data.id)
      return new Response(JSON.stringify({ 
        success: true, 
        message_id: data.id,
        debug: 'Insert completed successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })

    } catch (supabaseError) {
      console.log('💥 Error creating Supabase client or database operation:', supabaseError.message)
      console.log('💥 Full error:', JSON.stringify(supabaseError, null, 2))
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Supabase client error: ' + supabaseError.message,
        stack: supabaseError.stack
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

  } catch (error) {
    console.log('💥 Top-level error in function:', error.message)
    console.log('💥 Error name:', error.name)
    console.log('💥 Error stack:', error.stack)
    console.log('💥 Full error object:', JSON.stringify(error, null, 2))
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Function error: ' + error.message,
      name: error.name,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/admin-send-message' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
