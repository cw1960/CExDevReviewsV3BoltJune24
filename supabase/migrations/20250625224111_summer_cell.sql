/*
  # Fix Users RLS Infinite Recursion - Final Solution

  1. Problem Analysis
    - The error "infinite recursion detected in policy for relation 'users'" indicates
      that RLS policies are creating circular dependencies when evaluating permissions
    - This happens when policies reference other tables that in turn reference the users table
    - Even Edge Functions can be affected if the policies are fundamentally flawed

  2. Solution Strategy
    - Drop ALL existing SELECT policies on the users table
    - Create a single, minimal SELECT policy that only allows users to read their own data
    - Ensure no policy references other tables or creates circular dependencies
    - Force all cross-user data access to go through Edge Functions with service role

  3. Security Impact
    - Users can only read their own profile data directly
    - All admin operations, user lookups, and cross-user queries must use Edge Functions
    - This prevents recursion while maintaining security
*/

-- Disable RLS temporarily to clean up policies safely
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on the users table to ensure clean slate
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_select_own_profile_strict" ON users;
DROP POLICY IF EXISTS "users_select_full_profile" ON users;
DROP POLICY IF EXISTS "users_select_public_info" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create the most restrictive possible SELECT policy
-- This policy ONLY allows users to read their own profile data
-- It does NOT reference any other tables or create any potential for recursion
CREATE POLICY "users_own_profile_only" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Create minimal UPDATE policy for users to update their own profile
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Create minimal INSERT policy for new user creation (needed for auth trigger)
CREATE POLICY "users_insert_new_profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Add comprehensive comment explaining the RLS strategy
COMMENT ON TABLE users IS 'CRITICAL: RLS policies are minimal to prevent infinite recursion. Users can only access their own profile. All cross-user queries, admin operations, and complex joins MUST use Supabase Edge Functions with service role key to bypass RLS.';

-- Ensure other tables also have minimal, non-recursive policies
-- Update extensions table policies to be completely self-contained
ALTER TABLE extensions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "extensions_select_own" ON extensions;
DROP POLICY IF EXISTS "extensions_insert_own" ON extensions;
DROP POLICY IF EXISTS "extensions_update_own" ON extensions;
DROP POLICY IF EXISTS "extensions_delete_own" ON extensions;
DROP POLICY IF EXISTS "extensions_all_own" ON extensions;
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;

-- Create minimal extensions policies that don't reference other tables
CREATE POLICY "extensions_owner_only" ON extensions
  FOR ALL TO authenticated
  USING (owner_id = auth.uid());

-- Update review_assignments table policies to be completely self-contained
ALTER TABLE review_assignments DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_assignments_select_reviewer" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_update_reviewer" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_select_own" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_update_own" ON review_assignments;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;

-- Create minimal review_assignments policies that don't reference other tables
CREATE POLICY "review_assignments_reviewer_only" ON review_assignments
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "review_assignments_reviewer_update" ON review_assignments
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid());

-- Add comments to other tables explaining the RLS strategy
COMMENT ON TABLE extensions IS 'RLS policy allows users to access only their own extensions. Cross-user extension access must use Edge Functions.';
COMMENT ON TABLE review_assignments IS 'RLS policy allows users to access only assignments where they are the reviewer. Cross-user assignment access must use Edge Functions.';

-- Log the completion of this migration
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been reset to minimal, non-recursive configurations. All cross-user data access must now use Supabase Edge Functions with service role key.';
END $$;