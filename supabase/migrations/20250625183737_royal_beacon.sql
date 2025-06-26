/*
  # Fix RLS Infinite Recursion - Final Solution

  1. Problem Analysis
    - The `extensions_select_for_user` policy queries `review_assignments` table
    - The `review_assignments_select_for_user` policy queries `extensions` table
    - This creates a circular dependency causing infinite recursion

  2. Solution
    - Simplify RLS policies to prevent cross-table queries
    - Each table's RLS policy will only check direct ownership/involvement
    - Complex cross-table data fetching will be handled by Edge Functions (service role)

  3. Changes
    - Drop problematic policies with circular dependencies
    - Create simple, non-recursive policies
    - Ensure each policy only references its own table or auth.uid()
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "extensions_select_for_user" ON extensions;
DROP POLICY IF EXISTS "extensions_insert_own" ON extensions;
DROP POLICY IF EXISTS "extensions_update_own" ON extensions;
DROP POLICY IF EXISTS "extensions_delete_own" ON extensions;
DROP POLICY IF EXISTS "extensions_all_own" ON extensions;

DROP POLICY IF EXISTS "review_assignments_select_for_user" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_select_own" ON review_assignments;
DROP POLICY IF EXISTS "review_assignments_update_own" ON review_assignments;

-- Create simple, non-recursive policies for extensions table
-- Users can only access extensions they directly own
CREATE POLICY "extensions_select_own" ON extensions
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "extensions_insert_own" ON extensions
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "extensions_update_own" ON extensions
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "extensions_delete_own" ON extensions
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Create simple, non-recursive policies for review_assignments table
-- Users can only access assignments where they are the direct reviewer
CREATE POLICY "review_assignments_select_reviewer" ON review_assignments
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "review_assignments_update_reviewer" ON review_assignments
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid());

-- Add comment explaining the fix
COMMENT ON TABLE extensions IS 'RLS policies simplified to prevent infinite recursion. Cross-table queries handled by Edge Functions.';
COMMENT ON TABLE review_assignments IS 'RLS policies simplified to prevent infinite recursion. Cross-table queries handled by Edge Functions.';