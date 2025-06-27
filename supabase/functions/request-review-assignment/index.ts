import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestAssignmentRequest {
  user_id: string
}

serve(async (req) => {
  console.log('🚀 request-review-assignment function started')
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

    console.log('✅ Environment variables check passed')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

    const { user_id }: RequestAssignmentRequest = requestBody

    if (!user_id) {
      console.error('❌ Missing user_id in request')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User ID is required' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log('Processing assignment request for user:', user_id)

    // 1. Verify user is qualified and doesn't have too many active assignments
    console.log('🔍 Step 1: Fetching user profile...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email, has_completed_qualification')
      .eq('id', user_id)
      .single()

    if (userError) {
      console.error('❌ User fetch error:', {
        message: userError.message,
        code: userError.code,
        details: userError.details
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found or database error',
          details: userError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    if (!user) {
      console.error('❌ User not found in database')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    console.log('✅ User found:', { id: user.id, name: user.name, qualified: user.has_completed_qualification })

    if (!user.has_completed_qualification) {
      console.log('❌ User not qualified')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User must complete qualification before requesting assignments' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // 2. Check if user already has active assignments (limit to 1 active assignment)
    console.log('🔍 Step 2: Checking active assignments...')
    const { data: activeAssignments, error: activeError } = await supabase
      .from('review_assignments')
      .select('id')
      .eq('reviewer_id', user_id)
      .eq('status', 'assigned')

    if (activeError) {
      console.error('❌ Error checking active assignments:', {
        message: activeError.message,
        code: activeError.code,
        details: activeError.details
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to check active assignments',
          details: activeError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('📊 Active assignments found:', activeAssignments?.length || 0)

    if (activeAssignments && activeAssignments.length >= 1) {
      console.log('❌ User already has active assignment')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'You already have an active assignment. Please complete your current review before requesting another.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // 3. Find available extensions for review (FIFO order)
    console.log('🔍 Step 3: Finding available extensions...')
    const { data: availableExtensions, error: extensionsError } = await supabase
      .from('extensions')
      .select('*')
      .eq('status', 'queued')
      .neq('owner_id', user_id) // Can't review own extension
      .order('submitted_to_queue_at', { ascending: true }) // FIFO: First in, first out

    if (extensionsError) {
      console.error('❌ Error fetching available extensions:', {
        message: extensionsError.message,
        code: extensionsError.code,
        details: extensionsError.details
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch available extensions',
          details: extensionsError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('📦 Available extensions found:', availableExtensions?.length || 0)

    if (!availableExtensions || availableExtensions.length === 0) {
      console.log('ℹ️ No extensions available for review')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No extensions are currently available for review. Please check back later.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // 4. Filter out extensions from owners the user has already reviewed
    console.log('🔍 Step 4: Checking review relationships...')
    const { data: existingRelationships, error: relationshipsError } = await supabase
      .from('review_relationships')
      .select('reviewed_owner_id')
      .eq('reviewer_id', user_id)

    if (relationshipsError) {
      console.error('❌ Error fetching review relationships:', {
        message: relationshipsError.message,
        code: relationshipsError.code,
        details: relationshipsError.details
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to check review relationships',
          details: relationshipsError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const excludedOwnerIds = existingRelationships?.map(r => r.reviewed_owner_id) || []
    console.log('🚫 Excluded owner IDs:', excludedOwnerIds.length)

    const eligibleExtensions = availableExtensions.filter(
      ext => !excludedOwnerIds.includes(ext.owner_id)
    )

    console.log('✅ Eligible extensions after filtering:', eligibleExtensions.length)

    if (eligibleExtensions.length === 0) {
      console.log('ℹ️ No eligible extensions after filtering')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No new extensions available for review. You have already reviewed extensions from all available developers.' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    // 5. Select the first eligible extension (FIFO)
    const selectedExtension = eligibleExtensions[0]
    console.log(`✅ Selected extension: ${selectedExtension.name} (ID: ${selectedExtension.id}) for user: ${user.name}`)

    // 6. Create assignment batch
    console.log('🔍 Step 6: Creating assignment batch...')
    const { data: batch, error: batchError } = await supabase
      .from('assignment_batches')
      .insert({
        reviewer_id: user_id,
        assignment_type: 'single',
        status: 'active'
      })
      .select()
      .single()

    if (batchError) {
      console.error('❌ Error creating assignment batch:', {
        message: batchError.message,
        code: batchError.code,
        details: batchError.details
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create assignment batch',
          details: batchError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ Assignment batch created:', batch.id)

    // 7. Generate unique assignment number
    console.log('🔍 Step 7: Generating assignment number...')
    const { data: assignmentCount, error: countError } = await supabase
      .from('review_assignments')
      .select('assignment_number')
      .order('assignment_number', { ascending: false })
      .limit(1)

    if (countError) {
      console.error('❌ Error getting assignment count:', {
        message: countError.message,
        code: countError.code,
        details: countError.details
      })
      // Clean up the batch
      try {
        await supabase.from('assignment_batches').delete().eq('id', batch.id)
        console.log('🧹 Cleaned up batch after assignment count error')
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup batch:', cleanupError)
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate assignment number',
          details: countError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    const nextAssignmentNumber = (assignmentCount?.[0]?.assignment_number || 0) + 1
    console.log('📊 Next assignment number:', nextAssignmentNumber)

    // 8. Create review assignment
    console.log('🔍 Step 8: Creating review assignment...')
    const dueDate = new Date()
    dueDate.setHours(dueDate.getHours() + 48) // 48 hours to complete

    const { data: assignment, error: assignmentError } = await supabase
      .from('review_assignments')
      .insert({
        batch_id: batch.id,
        extension_id: selectedExtension.id,
        reviewer_id: user_id,
        assignment_number: nextAssignmentNumber,
        due_at: dueDate.toISOString(),
        assigned_at: new Date().toISOString(), // <-- FIXED: add this line
        status: 'assigned'
      })
      .select()
      .single()

    if (assignmentError) {
      console.error('❌ Error creating review assignment:', {
        message: assignmentError.message,
        code: assignmentError.code,
        details: assignmentError.details
      })
      // Clean up the batch
      try {
        await supabase.from('assignment_batches').delete().eq('id', batch.id)
        console.log('🧹 Cleaned up batch after assignment creation error')
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup batch:', cleanupError)
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create review assignment',
          details: assignmentError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log('✅ Review assignment created:', assignment.id)

    // 9. Update extension status to 'assigned'
    console.log('🔍 Step 9: Updating extension status...')
    const { error: extensionUpdateError } = await supabase
      .from('extensions')
      .update({ status: 'assigned' })
      .eq('id', selectedExtension.id)

    if (extensionUpdateError) {
      console.error('❌ Error updating extension status:', {
        message: extensionUpdateError.message,
        code: extensionUpdateError.code,
        details: extensionUpdateError.details
      })
      // Clean up assignment and batch
      try {
        await supabase.from('review_assignments').delete().eq('id', assignment.id)
        await supabase.from('assignment_batches').delete().eq('id', batch.id)
        console.log('🧹 Cleaned up assignment and batch after extension update error')
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup assignment and batch:', cleanupError)
      }
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update extension status',
          details: extensionUpdateError.message
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      )
    }

    console.log(`✅ Successfully created assignment #${nextAssignmentNumber} for extension ${selectedExtension.name}`)

    // Trigger MailerLite event for review assignment
    try {
      console.log('📧 Triggering MailerLite review assignment event...')
      const { error: mailerLiteError } = await supabase.functions.invoke('mailerlite-integration', {
        body: {
          user_email: user.email,
          event_type: 'review_assigned',
          custom_data: {
            extension_name: selectedExtension.name,
            assignment_number: nextAssignmentNumber,
            due_date: dueDate.toISOString(),
            assignment_date: new Date().toISOString()
          }
        }
      })
      
      if (mailerLiteError) {
        console.error('❌ MailerLite error:', mailerLiteError)
      } else {
        console.log('✅ MailerLite review assignment event triggered')
      }
    } catch (mailerLiteError) {
      console.error('❌ Failed to trigger MailerLite assignment event:', mailerLiteError)
      // Don't fail the assignment process if MailerLite fails
    }

    console.log('🎉 Assignment process completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Assignment created successfully! You have been assigned to review "${selectedExtension.name}".`,
        assignment: {
          id: assignment.id,
          assignment_number: nextAssignmentNumber,
          extension_name: selectedExtension.name,
          due_date: dueDate.toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('💥 CRITICAL ERROR in request-review-assignment function:', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace available'
    })
    
    // Ensure we always return a proper response to prevent EarlyDrop
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error occurred while processing assignment request',
        details: error?.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})