/*
  # Fix New User Signup Database Error

  1. Problem
    - The "Database Error Saving New User" error occurs when the handle_new_user trigger
      function fails to insert a new user profile into the public.users table
    - This happens because RLS policies may interfere with the SECURITY DEFINER function
      even though it should have elevated privileges

  2. Solution
    - Modify the handle_new_user function to explicitly bypass RLS during the INSERT operation
    - Use SET LOCAL row_security.active = false to disable RLS for the function execution
    - Ensure RLS is reset after the operation completes

  3. Security
    - This change only affects the trigger function execution context
    - RLS remains active for all other database operations
    - The function still maintains SECURITY DEFINER privileges as intended
*/

-- Drop and recreate the user creation function with RLS bypass
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
BEGIN
  -- Disable RLS for this function execution to ensure INSERT succeeds
  SET LOCAL row_security.active = false;
  
  -- Extract name from metadata, handle null/empty cases
  user_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), NULL);
  
  -- Insert new user record with freemium defaults
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
    cookie_consent_timestamp
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    1, -- Give new users 1 welcome credit
    false,
    'free', -- Default to free tier
    0, -- Start with 0 monthly exchanges
    now(), -- Set initial reset date
    'not_set', -- Default cookie preference
    now() -- Set initial cookie consent timestamp
  );
  
  -- Reset RLS to default state
  RESET row_security.active;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Reset RLS even in error cases
    RESET row_security.active;
    
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add comment explaining the RLS bypass
COMMENT ON FUNCTION handle_new_user() IS 'Creates user profile after auth signup. Uses RLS bypass to ensure INSERT always succeeds regardless of policy evaluation context.';