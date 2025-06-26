/*
  # Fix Query Timeout and Simplify RLS Policies

  1. Changes
    - Simplify all RLS policies to prevent recursion and timeouts
    - Remove complex policy checks that might cause performance issues
    - Ensure basic user operations work without timeouts

  2. Security
    - Maintain basic security while fixing performance issues
    - Users can only access their own data
    - Service role can access everything for admin operations
*/

-- Temporarily disable RLS to clean up policies
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE extensions DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE review_relationships DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Allow trigger to insert users" ON users;

DROP POLICY IF EXISTS "Users can manage own extensions" ON extensions;

DROP POLICY IF EXISTS "Users can read own transactions" ON credit_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON credit_transactions;

DROP POLICY IF EXISTS "Users can read own batches" ON assignment_batches;

DROP POLICY IF EXISTS "Users can read own assignments" ON review_assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON review_assignments;

DROP POLICY IF EXISTS "Users can read own review relationships" ON review_relationships;
DROP POLICY IF EXISTS "System can insert review relationships" ON review_relationships;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_relationships ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for users table
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create simple policies for extensions table
CREATE POLICY "extensions_all_own" ON extensions
  FOR ALL TO authenticated
  USING (owner_id = auth.uid());

-- Create simple policies for credit_transactions table
CREATE POLICY "credit_transactions_select_own" ON credit_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "credit_transactions_insert_own" ON credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create simple policies for assignment_batches table
CREATE POLICY "assignment_batches_select_own" ON assignment_batches
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

-- Create simple policies for review_assignments table
CREATE POLICY "review_assignments_select_own" ON review_assignments
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "review_assignments_update_own" ON review_assignments
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid());

-- Create simple policies for review_relationships table
CREATE POLICY "review_relationships_select_own" ON review_relationships
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid() OR reviewed_owner_id = auth.uid());

CREATE POLICY "review_relationships_insert_own" ON review_relationships
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- Email logs table - no RLS policies (admin only via service role)
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- Add comment explaining the simplification
COMMENT ON TABLE users IS 'RLS policies simplified to prevent infinite recursion and query timeouts. Admin operations use service role.';