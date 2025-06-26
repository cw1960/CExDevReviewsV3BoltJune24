/*
  # Fix Authentication Timeout Issues

  1. Changes
    - Allow service role to insert users (for handle_new_user trigger)
    - This fixes the profile fetch timeouts after sign-up

  2. Security
    - Maintains user security while allowing system operations
    - Service role can insert users for the trigger functionality
*/

-- Update the users insert policy to allow service role operations
DROP POLICY IF EXISTS "users_insert_own" ON users;

CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');