-- supabase/migrations/[TIMESTAMP]_fix_users_rls_recursion.sql

-- This migration fixes an infinite recursion issue detected in the 'users' RLS policies.
-- The 'users_select_public_info' policy, while intended to be permissive, can cause
-- recursion in complex join scenarios or when RLS is evaluated implicitly.
--
-- By dropping this policy, we ensure that any queries needing to fetch user data
-- (especially for users other than the authenticated one) must go through
-- Supabase Edge Functions using the service role key, which bypasses RLS.
-- The 'users_select_full_profile' policy (auth.uid() = id) remains for direct
-- access to the authenticated user's own profile, which is safe and non-recursive.

-- Drop the problematic policy that allows public selection of user info
DROP POLICY IF EXISTS "users_select_public_info" ON users;

-- Update the comment on the users table to reflect the RLS simplification
COMMENT ON TABLE users IS 'RLS policies simplified to prevent infinite recursion and query timeouts. Public user info and admin operations should use service role via Edge Functions.';

