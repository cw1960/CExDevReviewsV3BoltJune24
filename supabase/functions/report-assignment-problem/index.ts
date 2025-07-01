import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ReportAssignmentProblemRequest {
  assignment_id: string
  extension_id: string
  reporter_id: string
  issue_type: string
  description: string
  cancel_assignment: boolean
  extension_name: string
  reporter_email: string
}

serve(async (req) => {
  console.log('🚀 report-assignment-problem function started')
  console.log('📝 Request method:', req.method)
  
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
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('📦 Parsing request body...')
    const requestData: ReportAssignmentProblemRequest = await req.json()

    const {
      assignment_id,
      extension_id,
      reporter_id,
      issue_type,
      description,
      cancel_assignment,
      extension_name,
      reporter_email
    } = requestData

    if (!assignment_id || !reporter_id || !issue_type || !description) {
      console.error('❌ Missing required fields')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: assignment_id, reporter_id, issue_type, description' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log(`🔄 Processing problem report for assignment ${assignment_id}`)

    // 1. If cancelling assignment, update status to cancelled
    if (cancel_assignment) {
      console.log('❌ Cancelling assignment due to reported problem...')
      
      const { error: updateError } = await supabase
        .from('review_assignments')
        .update({ 
          status: 'cancelled',
          admin_notes: `Assignment cancelled by reviewer due to: ${issue_type} - ${description}`
        })
        .eq('id', assignment_id)

      if (updateError) {
        console.error('❌ Error updating assignment status:', updateError)
        throw updateError
      }

      console.log('✅ Assignment status updated to cancelled')

      // Update extension status back to queued if this was the only assignment
      const { data: otherAssignments, error: checkError } = await supabase
        .from('review_assignments')
        .select('id')
        .eq('extension_id', extension_id)
        .neq('status', 'cancelled')

      if (checkError) {
        console.error('❌ Error checking other assignments:', checkError)
        // Don't throw here, continue with logging
      } else if (!otherAssignments || otherAssignments.length === 0) {
        // No other active assignments, put extension back in queue
        const { error: extensionUpdateError } = await supabase
          .from('extensions')
          .update({ status: 'queued' })
          .eq('id', extension_id)

        if (extensionUpdateError) {
          console.error('❌ Error updating extension status:', extensionUpdateError)
          // Don't throw here, continue with logging
        } else {
          console.log('✅ Extension status updated back to queued')
        }
      }
    }

    // 2. Log the problem report for admin review
    console.log('📝 Logging problem report...')
    
    const problemReportLog = {
      to_email: 'admin@chromeexdev.com', // Could be from env variable
      type: 'assignment_problem_report',
      status: 'pending',
      subject: `Assignment Problem Report: ${extension_name}`,
      body: JSON.stringify({
        assignment_id,
        extension_id,
        extension_name,
        reporter_id,
        reporter_email,
        issue_type,
        description,
        cancel_assignment,
        timestamp: new Date().toISOString(),
        severity: cancel_assignment ? 'high' : 'medium'
      }),
      error_message: null
    }

    const { error: logError } = await supabase
      .from('email_logs')
      .insert(problemReportLog)

    if (logError) {
      console.error('❌ Error logging problem report:', logError)
      throw logError
    }

    console.log('✅ Problem report logged successfully')

    // 3. Optionally send immediate email notification to admins
    // This could be implemented later with actual email service
    
    const responseMessage = cancel_assignment 
      ? 'Assignment cancelled successfully and problem reported to admin team.'
      : 'Problem reported to admin team for review.'

    console.log('✅ Problem report processing completed')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: responseMessage,
        cancelled: cancel_assignment
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error in report-assignment-problem function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 