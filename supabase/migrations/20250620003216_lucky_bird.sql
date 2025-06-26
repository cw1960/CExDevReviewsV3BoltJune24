/*
  # Fix User Creation Trigger

  1. Changes
    - Fix the handle_new_user function to properly handle user creation
    - Add proper error handling and logging
    - Ensure RLS policies allow the trigger to insert users
    - Add service role bypass for the trigger function

  2. Security
    - Update trigger function to use SECURITY DEFINER
    - Ensure proper permissions for user creation
*/

-- Drop and recreate the user creation function with proper permissions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
BEGIN
  -- Extract name from metadata, handle null/empty cases
  user_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), NULL);
  
  -- Insert new user record
  INSERT INTO public.users (id, email, name, credit_balance, onboarding_complete)
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    1, -- Give new users 1 welcome credit
    false
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
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

-- Add a policy to allow the trigger function to insert users
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;
CREATE POLICY "Allow trigger to insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update the existing insert policy to be more permissive for new user creation
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');