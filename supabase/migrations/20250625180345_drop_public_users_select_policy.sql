/*
  # Fix RLS Infinite Recursion for Users Table - Drop Public Select Policy

  1. Changes
    - Drops the "users_select_public_info" policy that was causing infinite recursion.
    - This policy was overly broad and interfered with RLS evaluation, leading to errors.

  2. Security
    - Authenticated users will now only be able to select their own full profile data directly.
    - Any queries needing public user information or admin access to all user data should
      be handled via Supabase Edge Functions using the service role key, which bypasses RLS.
*/

-- Drop the problematic policy that allows public selection of user info
DROP POLICY IF EXISTS "users_select_public_info" ON users;

-- Update the comment on the users table to reflect the RLS simplification
COMMENT ON TABLE users IS 'RLS policies simplified to prevent infinite recursion and query timeouts. Public user info and admin operations should use service role via Edge Functions.';

