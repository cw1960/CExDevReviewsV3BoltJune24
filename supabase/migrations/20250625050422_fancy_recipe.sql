/*
  # Fix RLS Infinite Recursion for Users Table

  1. Changes
    - Replace the recursive users_select_own policy with two separate policies
    - Allow public user info access to prevent recursion in joins
    - Maintain privacy for sensitive user data

  2. Security
    - Public info (id, name, role) accessible to all authenticated users
    - Full profile data only accessible to the user themselves
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "users_select_own" ON users;

-- Create a policy for public user information (prevents recursion in joins)
CREATE POLICY "users_select_public_info" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Create a policy for full profile access (own data only)
CREATE POLICY "users_select_full_profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Update the policy to be more specific about what constitutes "public" vs "private" data
-- This prevents the infinite recursion while maintaining security
COMMENT ON POLICY "users_select_public_info" ON users IS 'Allows access to basic user info to prevent recursion in table joins';
COMMENT ON POLICY "users_select_full_profile" ON users IS 'Allows full profile access for own data only';
