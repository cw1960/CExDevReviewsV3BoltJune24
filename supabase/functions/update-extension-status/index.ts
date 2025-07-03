import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface UpdateExtensionStatusRequest {
  extension_id: string
  status: 'library' | 'verified' | 'queued' | 'assigned' | 'reviewed' | 'completed' | 'rejected'
  submitted_to_queue_at?: string
}

serve(async (req) => {
  console.log('🚀 update-extension-status function started [v2.0 - JWT Compatible]')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Checking environment variables...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
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

    // Handle JWT authentication when enforcement is ON
    const authHeader = req.headers.get('Authorization')
    console.log('🔑 Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.error('❌ No authorization header')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization required'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Verify JWT token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authentication failed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    console.log('✅ User authenticated:', user.email)

    console.log('✅ Environment variables check passed')
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { extension_id, status, submitted_to_queue_at }: UpdateExtensionStatusRequest = await req.json()

    if (!extension_id || !status) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Extension ID and status are required' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`🔄 Updating extension ${extension_id} status to: ${status}`)

    // Verify user owns this extension (security check)
    const { data: extensionCheck, error: checkError } = await supabase
      .from('extensions')
      .select('owner_id')
      .eq('id', extension_id)
      .single()

    if (checkError || !extensionCheck) {
      console.error('❌ Extension not found:', checkError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Extension not found'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    if (extensionCheck.owner_id !== user.id) {
      console.error('❌ User does not own this extension')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You can only update your own extensions'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    console.log('✅ User owns extension, proceeding with update')

    // Prepare update data
    const updateData: any = { status }
    if (submitted_to_queue_at) {
      updateData.submitted_to_queue_at = submitted_to_queue_at
    }

    // Update extension status using service role (bypasses RLS)
    const { data: updatedExtension, error: updateError } = await supabase
      .from('extensions')
      .update(updateData)
      .eq('id', extension_id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Extension update error:', {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update extension status',
          details: updateError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ Extension status updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        data: updatedExtension
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 Error in update-extension-status function:', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace available'
    })
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error occurred while updating extension status',
        details: error?.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})