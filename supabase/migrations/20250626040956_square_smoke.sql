/*
  # Remove User Creation Trigger

  1. Changes
    - Drop the problematic user creation trigger and function
    - This will prevent database-level user profile creation
    - User profiles will now be created via Edge Function

  2. Security
    - Edge Function will use service role to bypass RLS
    - More reliable user profile creation
*/

-- Drop the existing trigger and function that's causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Add comment explaining the change
COMMENT ON TABLE users IS 'User profiles are now created via Edge Function after auth signup, not database trigger. This ensures reliable profile creation by bypassing RLS issues.';

-- Log the completion
DO $$
BEGIN
  RAISE LOG 'User creation trigger removed. User profiles will now be created via Edge Function.';
END $$;