const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface FetchUserProfileRequest {
  userId: string
}

// Simplified timeout helper with better error handling
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ])
}

Deno.serve(async (req) => {
  const startTime = Date.now()
  console.log('🚀 fetch-user-profile-for-auth function started')
  console.log('📝 Request method:', req.method)
  console.log('🌐 Request URL:', req.url)
  
  // Handle CORS preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request')
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Checking environment variables...')
    // Get environment variables - fail fast if missing
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('❌ Missing required environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
        supabaseAnonKey: !!supabaseAnonKey
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error: Missing environment variables' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('✅ Environment variables check passed')
    // Import Supabase client using the correct syntax for Deno
    const { createClient } = await import('npm:@supabase/supabase-js@2')

    // Extract and validate JWT quickly
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Missing or invalid Authorization header')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing or invalid Authorization header' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const jwt = authHeader.replace('Bearer ', '')
    console.log('🔐 JWT token extracted, length:', jwt.length)

    // Parse request body with enhanced error handling
    console.log('📦 Parsing request body...')
    let requestBody
    try {
      requestBody = await req.json()
      console.log('📋 Request body parsed successfully. Raw body:', JSON.stringify(requestBody))
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', {
        message: parseError?.message || 'Unknown parsing error',
        name: parseError?.name || 'ParseError'
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { userId }: FetchUserProfileRequest = requestBody
    
    console.log('🔍 Extracted userId from request body:', userId)
    console.log('🔍 UserId type:', typeof userId)
    console.log('🔍 UserId length:', userId ? userId.length : 'undefined/null')

    if (!userId) {
      console.error('❌ Missing userId in request body. RequestBody keys:', Object.keys(requestBody || {}))
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('🔍 Processing request for user ID:', userId, 'length:', userId.length)

    // Create clients
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

    // Verify JWT with shorter timeout
    console.log('🔐 Verifying JWT token...')
    let authUser
    try {
      const { data: { user: verifiedUser }, error: authError } = await withTimeout(
        supabaseAuth.auth.getUser(jwt),
        3000, // 3 seconds
        'JWT verification'
      )
      
      if (authError) {
        console.log('❌ JWT verification failed:', {
          message: authError.message,
          name: authError.name
        })
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid or expired JWT token',
            details: authError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      if (!verifiedUser) {
        console.log('❌ No user returned from JWT verification')
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid or expired JWT token' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      authUser = verifiedUser
      console.log('✅ JWT verified successfully for user ID length:', authUser.id.length)
    } catch (jwtError) {
      console.error('❌ JWT verification threw error:', {
        message: jwtError?.message || 'Unknown JWT error',
        name: jwtError?.name || 'JWTError'
      })
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'JWT verification failed',
          details: jwtError?.message || 'Unknown JWT error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Security check
    if (authUser.id !== userId) {
      console.log('🚫 Security violation: User attempted to fetch different profile')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: You can only fetch your own profile data' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    console.log('🔍 Starting database query for user profile')

    // Fetch user profile with shorter timeout and minimal fields
    let user
    try {
      console.log('🔍 Starting database query at:', new Date().toISOString())
      const { data: fetchedUser, error: userError } = await withTimeout(
        supabaseService
          .from('users')
          .select('id, email, name, credit_balance, has_completed_qualification, onboarding_complete, role, subscription_status, exchanges_this_month, last_exchange_reset_date, cookie_preferences, cookie_consent_timestamp, created_at, updated_at')
          .eq('id', userId)
          .single(),
        10000, // 10 seconds (increased from 3s)
        'Database query'
      )
      console.log('🔍 Database query completed at:', new Date().toISOString())

      if (userError) {
        console.log('❌ User profile fetch error:', {
          message: userError.message,
          code: userError.code,
          details: userError.details
        })
        
        // Handle specific error cases
        if (userError.code === 'PGRST116') {
          console.log('ℹ️ User profile not found - this is expected for new users')
          return new Response(
            JSON.stringify({ 
              success: true, 
              data: { user: null },
              message: 'User profile not found'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
        
        console.log('🔍 Database query returned null for userId:', userId)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch user profile',
            details: userError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      user = fetchedUser
      console.log('✅ User profile fetched successfully for userId:', userId)
      console.log('📋 Fetched user data keys:', Object.keys(user || {}))
      console.log('📋 User onboarding_complete:', user?.onboarding_complete)
      console.log('📋 User has_completed_qualification:', user?.has_completed_qualification)
    } catch (dbError) {
      console.error('❌ Database query threw error:', {
        message: dbError?.message || 'Unknown database error',
        name: dbError?.name || 'DatabaseError'
      })
      
      // Handle timeout errors specifically
      if (dbError?.message && dbError.message.includes('timeout')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Database query timeout - please try again',
            errorType: 'TimeoutError'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 408 }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database query failed',
          details: dbError?.message || 'Unknown database error'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const totalDuration = Date.now() - startTime
    console.log('✅ User profile fetched successfully in', totalDuration, 'ms')
    console.log('🎯 Final response data structure:', {
      success: true,
      hasUser: !!user,
      userKeys: user ? Object.keys(user) : [],
      onboardingComplete: user?.onboarding_complete,
      hasCompletedQualification: user?.has_completed_qualification
    })

    // Return the correct structure that AuthContext expects
    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          user: user || null
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error('💥 CRITICAL ERROR in fetch-user-profile-for-auth function:', {
      message: error?.message || 'Unknown error',
      name: error?.name || 'Unknown',
      stack: error?.stack || 'No stack trace available',
      executionTime: totalDuration
    })
    
    // Handle timeout errors specifically
    if (error?.message && error.message.includes('timeout')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Request timeout - please try again',
          errorType: 'TimeoutError',
          executionTime: totalDuration
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 408, // Request Timeout
        }
      )
    }
    
    // Ensure we always return a proper response to prevent EarlyDrop
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error occurred while fetching user profile',
        errorType: error?.name || 'UnknownError',
        details: error?.message || 'Unknown error',
        executionTime: totalDuration
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})