-- supabase/migrations/20250625211800_fix_users_rls_final.sql

-- This migration addresses persistent infinite recursion issues in RLS policies
-- by strictly limiting direct client-side access to user data.
-- All cross-user data fetching must now explicitly go through Supabase Edge Functions
-- using the service role key, which bypasses RLS.

-- Drop all existing SELECT policies on the users table to ensure a clean slate
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_full_profile" ON users;
DROP POLICY IF EXISTS "users_select_public_info" ON users;

-- Re-create only the policy that allows authenticated users to select their own profile.
-- This is the most restrictive and non-recursive SELECT policy.
CREATE POLICY "users_select_own_profile_strict" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Add a comment to clarify the RLS strategy for the users table.
COMMENT ON TABLE users IS 'RLS policies strictly limit direct user access to their own profile. All cross-user data access must be handled via Supabase Edge Functions using the service role key.';

