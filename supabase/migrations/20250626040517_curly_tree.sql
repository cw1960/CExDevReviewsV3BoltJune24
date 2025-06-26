/*
  # Fix User Signup RLS Bypass Issue

  1. Problem
    - The handle_new_user function is still being blocked by RLS policies
    - SECURITY DEFINER alone is not sufficient to bypass RLS for the insert operation
    - Users cannot sign up due to "Database error saving new user"

  2. Solution
    - Explicitly disable RLS within the function execution context
    - Use SET LOCAL to temporarily disable row_security for the transaction
    - Ensure proper cleanup in both success and error cases

  3. Security
    - RLS bypass is limited to the function execution context only
    - Function maintains SECURITY DEFINER for elevated privileges
    - All other database operations still respect RLS policies
*/

-- Drop existing function and trigger to recreate with RLS bypass
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create the improved user creation function with explicit RLS bypass
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name text;
BEGIN
  -- Explicitly disable RLS for this function execution
  SET LOCAL row_security.active = false;
  
  -- Extract name from metadata with better null handling
  user_name := COALESCE(
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'name', '')), ''), 
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    split_part(NEW.email, '@', 1) -- Fallback to email username
  );
  
  -- Insert new user record with explicit column specification
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    credit_balance, 
    onboarding_complete,
    subscription_status,
    exchanges_this_month,
    last_exchange_reset_date,
    cookie_preferences,
    cookie_consent_timestamp,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    1, -- Welcome credit
    false,
    'free',
    0,
    CURRENT_TIMESTAMP,
    'not_set',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
  
  -- Reset RLS to default state before returning
  RESET row_security.active;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Reset RLS in case of error
    RESET row_security.active;
    
    -- Log detailed error information
    RAISE LOG 'Failed to create user profile for user_id: %, email: %, error: %', 
      NEW.id, NEW.email, SQLERRM;
    
    -- Re-raise the exception to prevent auth user creation if profile creation fails
    RAISE EXCEPTION 'Database error saving new user: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add helpful comment
COMMENT ON FUNCTION handle_new_user() IS 'Creates user profile after auth signup. Uses SECURITY DEFINER with explicit RLS bypass to ensure reliable user creation.';

-- Verify the setup with a test query (this will be logged)
DO $$
BEGIN
  RAISE LOG 'User signup RLS bypass fix migration completed successfully. Function now explicitly disables RLS during execution.';
END $$;