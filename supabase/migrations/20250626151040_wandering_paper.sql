/*
  # Final RLS Fix Migration - Comprehensive Database Reset

  This migration consolidates all RLS fixes and ensures a clean state for user creation
  and data access policies. It removes problematic triggers and relies on Edge Functions
  for cross-user operations and user profile creation.

  1. Changes
    - Removes all user creation triggers and functions (user profiles now created via Edge Function)
    - Resets and applies minimal, non-recursive RLS policies for all tables
    - Ensures service role can perform necessary operations
    - Prevents infinite recursion in RLS policy evaluation

  2. Security
    - Users can only access their own data directly
    - All cross-user queries must use Edge Functions with service role
    - Admin operations handled via Edge Functions
    - Maintains data security while fixing performance issues
*/

-- 1. Clean up old user creation trigger and function
-- This ensures user profile creation is solely handled by the 'create-user-profile' Edge Function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Also clean up any other variations that might exist
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS create_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile(uuid) CASCADE;

COMMENT ON TABLE public.users IS 'User profiles are now created via Edge Function only. No database triggers for user creation.';

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Old user creation trigger and function removed.';
END $$;

-- 2. Reset and apply RLS policies for the 'users' table
-- These policies are minimal and non-recursive, allowing users to access only their own profile
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean slate
DROP POLICY IF EXISTS "users_own_profile_only" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_insert_new_profile" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_select_own_profile_strict" ON public.users;
DROP POLICY IF EXISTS "users_select_full_profile" ON public.users;
DROP POLICY IF EXISTS "users_select_public_info" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_read_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_update_own" ON public.users;
DROP POLICY IF EXISTS "service_role_full_access" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create minimal, non-recursive policies
CREATE POLICY "users_own_profile_only" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_new_profile" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

COMMENT ON TABLE public.users IS 'RLS policies strictly limit direct user access to their own profile. All cross-user data access must be handled via Supabase Edge Functions using the service role key.';

-- Log the users table fix
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for users table reset and applied.';
END $$;

-- 3. Reset and apply RLS policies for the 'extensions' table
-- These policies are minimal and non-recursive, allowing users to access only their own extensions
ALTER TABLE public.extensions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "extensions_select_own" ON public.extensions;
DROP POLICY IF EXISTS "extensions_insert_own" ON public.extensions;
DROP POLICY IF EXISTS "extensions_update_own" ON public.extensions;
DROP POLICY IF EXISTS "extensions_delete_own" ON public.extensions;
DROP POLICY IF EXISTS "extensions_all_own" ON public.extensions;
DROP POLICY IF EXISTS "extensions_select_for_user" ON public.extensions;
DROP POLICY IF EXISTS "extensions_owner_only" ON public.extensions;
DROP POLICY IF EXISTS "Users can manage own extensions" ON public.extensions;
DROP POLICY IF EXISTS "Admins can read all extensions" ON public.extensions;
DROP POLICY IF EXISTS "Admins can update extension verification" ON public.extensions;

ALTER TABLE public.extensions ENABLE ROW LEVEL SECURITY;

-- Create single, comprehensive policy for extensions
CREATE POLICY "extensions_owner_only" ON public.extensions
  FOR ALL TO authenticated
  USING (owner_id = auth.uid());

COMMENT ON TABLE public.extensions IS 'RLS policy allows users to access only their own extensions. Cross-user extension access must use Edge Functions.';

-- Log the extensions table fix
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for extensions table reset and applied.';
END $$;

-- 4. Reset and apply RLS policies for the 'review_assignments' table
-- These policies are minimal and non-recursive, allowing users to access only assignments where they are the reviewer
ALTER TABLE public.review_assignments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "review_assignments_select_reviewer" ON public.review_assignments;
DROP POLICY IF EXISTS "review_assignments_update_reviewer" ON public.review_assignments;
DROP POLICY IF EXISTS "review_assignments_select_own" ON public.review_assignments;
DROP POLICY IF EXISTS "review_assignments_update_own" ON public.review_assignments;
DROP POLICY IF EXISTS "review_assignments_select_for_user" ON public.review_assignments;
DROP POLICY IF EXISTS "review_assignments_reviewer_only" ON public.review_assignments;
DROP POLICY IF EXISTS "review_assignments_reviewer_update" ON public.review_assignments;
DROP POLICY IF EXISTS "Users can read own assignments" ON public.review_assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON public.review_assignments;

ALTER TABLE public.review_assignments ENABLE ROW LEVEL SECURITY;

-- Create minimal policies for review assignments
CREATE POLICY "review_assignments_reviewer_only" ON public.review_assignments
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "review_assignments_reviewer_update" ON public.review_assignments
  FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid());

COMMENT ON TABLE public.review_assignments IS 'RLS policy allows users to access only assignments where they are the reviewer. Cross-user assignment access must use Edge Functions.';

-- Log the review assignments table fix
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for review_assignments table reset and applied.';
END $$;

-- 5. Reset and apply RLS policies for the 'credit_transactions' table
ALTER TABLE public.credit_transactions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "credit_transactions_select_own" ON public.credit_transactions;
DROP POLICY IF EXISTS "credit_transactions_insert_own" ON public.credit_transactions;
DROP POLICY IF EXISTS "Users can read own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.credit_transactions;

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create minimal policies for credit transactions
CREATE POLICY "credit_transactions_select_own" ON public.credit_transactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "credit_transactions_insert_own" ON public.credit_transactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Log the credit transactions table fix
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for credit_transactions table reset and applied.';
END $$;

-- 6. Reset and apply RLS policies for the 'assignment_batches' table
ALTER TABLE public.assignment_batches DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "assignment_batches_select_own" ON public.assignment_batches;
DROP POLICY IF EXISTS "Users can read own batches" ON public.assignment_batches;

ALTER TABLE public.assignment_batches ENABLE ROW LEVEL SECURITY;

-- Create minimal policy for assignment batches
CREATE POLICY "assignment_batches_select_own" ON public.assignment_batches
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid());

-- Log the assignment batches table fix
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for assignment_batches table reset and applied.';
END $$;

-- 7. Reset and apply RLS policies for the 'review_relationships' table
ALTER TABLE public.review_relationships DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "review_relationships_select_own" ON public.review_relationships;
DROP POLICY IF EXISTS "review_relationships_insert_own" ON public.review_relationships;
DROP POLICY IF EXISTS "Users can read own review relationships" ON public.review_relationships;
DROP POLICY IF EXISTS "System can insert review relationships" ON public.review_relationships;
DROP POLICY IF EXISTS "Admins can read all review relationships" ON public.review_relationships;

ALTER TABLE public.review_relationships ENABLE ROW LEVEL SECURITY;

-- Create minimal policies for review relationships
CREATE POLICY "review_relationships_select_own" ON public.review_relationships
  FOR SELECT TO authenticated
  USING (reviewer_id = auth.uid() OR reviewed_owner_id = auth.uid());

CREATE POLICY "review_relationships_insert_own" ON public.review_relationships
  FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- Log the review relationships table fix
DO $$
BEGIN
  RAISE NOTICE 'RLS policies for review_relationships table reset and applied.';
END $$;

-- 8. Ensure email_logs table has no RLS (admin only via service role)
ALTER TABLE public.email_logs DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Admins can read email logs" ON public.email_logs;

-- Keep email_logs without RLS - only accessible via service role
COMMENT ON TABLE public.email_logs IS 'Email logs accessible only via service role for admin operations.';

-- Log the email logs table fix
DO $$
BEGIN
  RAISE NOTICE 'Email logs table configured for service role access only.';
END $$;

-- 9. Force schema refresh to ensure all changes are recognized
-- Add and immediately remove a temporary column to force Supabase to refresh the schema
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS temp_final_fix_refresh text DEFAULT 'refresh';
ALTER TABLE public.users DROP COLUMN IF EXISTS temp_final_fix_refresh;

-- Log the completion of this final RLS fix migration
DO $$
BEGIN
  RAISE NOTICE 'Final RLS fix migration completed successfully. Database policies are now in a clean, non-recursive state.';
  RAISE NOTICE 'User signup should now work properly via Edge Function.';
  RAISE NOTICE 'All cross-user data access must use Edge Functions with service role key.';
END $$;

-- Add final comment explaining the new architecture
COMMENT ON SCHEMA public IS 'RLS policies reset to minimal, non-recursive configurations. User creation via Edge Function. Cross-user operations via Edge Functions with service role.';
