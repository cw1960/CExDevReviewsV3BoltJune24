import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RemoveFromQueueRequest {
  extension_id: string
  admin_key: string
}

serve(async (req) => {
  console.log('🚀 admin-remove-from-queue function started')
  
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request - returning CORS headers')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📥 Parsing request body...')
    const { extension_id, admin_key }: RemoveFromQueueRequest = await req.json()

    // Admin key check
    console.log('🔑 Checking admin key...')
    if (admin_key !== 'chrome_ex_dev_admin_2025') {
      console.log('❌ Invalid admin key provided')
      return new Response(JSON.stringify({ success: false, error: 'Invalid admin key' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      })
    }

    if (!extension_id) {
      console.log('❌ Missing extension_id')
      return new Response(JSON.stringify({ success: false, error: 'Extension ID is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    console.log('✅ Admin authenticated, processing extension:', extension_id)

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ Missing environment variables')
      return new Response(JSON.stringify({ success: false, error: 'Missing config' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    // Create client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Get extension details first
    console.log('🔍 Fetching extension details...')
    const { data: extension, error: extensionError } = await supabase
      .from('extensions')
      .select(`
        id,
        name,
        owner_id,
        status,
        submitted_to_queue_at,
        owner:users!extensions_owner_id_fkey(
          id,
          email,
          subscription_status,
          exchanges_this_month
        )
      `)
      .eq('id', extension_id)
      .single()

    if (extensionError || !extension) {
      console.log('❌ Extension not found:', extensionError?.message)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Extension not found' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      })
    }

    // Check if extension is actually in queue
    if (extension.status !== 'queued') {
      console.log('❌ Extension is not in queue, current status:', extension.status)
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Extension is not in queue (current status: ${extension.status})` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

    console.log('✅ Extension found and is in queue:', extension.name)

    // 2. Update extension status back to verified
    console.log('🔄 Removing extension from queue...')
    const { error: updateError } = await supabase
      .from('extensions')
      .update({ 
        status: 'verified',
        submitted_to_queue_at: null 
      })
      .eq('id', extension_id)

    if (updateError) {
      console.log('❌ Failed to update extension status:', updateError.message)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to remove extension from queue' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    console.log('✅ Extension removed from queue')

    // 3. Refund the credit that was spent to submit to queue
    console.log('💰 Refunding credit to user...')
    const { error: creditError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: extension.owner_id,
        amount: 1,
        type: 'earned',
        description: `Credit refund: Admin removed "${extension.name}" from queue`
      })

    if (creditError) {
      console.log('❌ Failed to refund credit:', creditError.message)
      // Don't fail the whole operation for this, but log it
    } else {
      console.log('✅ Credit refunded successfully')
    }

    // 4. Adjust monthly exchange count for free tier users
    if (extension.owner.subscription_status === 'free' && extension.owner.exchanges_this_month > 0) {
      console.log('📉 Adjusting monthly exchange count for free tier user...')
      const { error: exchangeError } = await supabase
        .from('users')
        .update({ 
          exchanges_this_month: Math.max(0, extension.owner.exchanges_this_month - 1)
        })
        .eq('id', extension.owner_id)

      if (exchangeError) {
        console.log('❌ Failed to adjust exchange count:', exchangeError.message)
        // Don't fail the whole operation for this, but log it
      } else {
        console.log('✅ Monthly exchange count adjusted')
      }
    }

    console.log('🎉 Successfully removed extension from queue with full cleanup')

    return new Response(JSON.stringify({ 
      success: true,
      message: `Extension "${extension.name}" removed from queue successfully`,
      extension_name: extension.name,
      owner_email: extension.owner.email
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.log('💥 Error in admin-remove-from-queue function:', error.message)
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}) 