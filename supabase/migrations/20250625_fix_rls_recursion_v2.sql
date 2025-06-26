-- supabase/migrations/20250625_fix_rls_recursion_v2.sql

-- Re-add the policy for public user information to prevent recursion in joins
-- This policy allows authenticated users to select any user's basic info.
-- The more restrictive "users_select_full_profile" will still apply for full profile access.
DROP POLICY IF EXISTS "users_select_public_info" ON users;
CREATE POLICY "users_select_public_info" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Update RLS policy for 'extensions' table
-- Allow users to select their own extensions OR extensions assigned to them for review
DROP POLICY IF EXISTS "extensions_select_for_user" ON extensions;
CREATE POLICY "extensions_select_for_user" ON extensions
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR id IN (SELECT extension_id FROM review_assignments WHERE reviewer_id = auth.uid()));

-- Re-add policies for INSERT, UPDATE, DELETE on extensions for owner
-- These policies ensure users can still manage their own extensions.
DROP POLICY IF EXISTS "extensions_insert_own" ON extensions;
CREATE POLICY "extensions_insert_own" ON extensions
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "extensions_update_own" ON extensions;
CREATE POLICY "extensions_update_own" ON extensions
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "extensions_delete_own" ON extensions;
CREATE POLICY "extensions_delete_own" ON extensions
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Update RLS policy for 'review_assignments' table
-- Allow users to select assignments where they are the reviewer OR assignments related to their own extensions
DROP POLICY IF EXISTS "review_assignments_select_for_user" ON review_assignments;
CREATE POLICY "review_assignments_select_for_user" ON review_assignments
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid() OR extension_id IN (SELECT id FROM extensions WHERE owner_id = auth.uid()));

-- Ensure update policy for review_assignments is still present for reviewer
DROP POLICY IF EXISTS "review_assignments_update_own" ON review_assignments;
CREATE POLICY "review_assignments_update_own" ON review_assignments
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid());
