/*
  # Fix RLS Infinite Recursion Error

  1. Changes
    - Drop the problematic "Admins can read all users" policy that causes infinite recursion
    - Drop other admin policies that reference the users table in their USING clause
    - This will prevent the infinite loop when checking admin permissions

  2. Security
    - Removes admin-specific policies that were causing recursion
    - Basic user policies remain intact for normal operations
    - Admin functionality will need to be handled differently (e.g., through service role)
*/

-- Drop the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can read all extensions" ON extensions;
DROP POLICY IF EXISTS "Admins can update extension verification" ON extensions;
DROP POLICY IF EXISTS "Admins can read email logs" ON email_logs;
DROP POLICY IF EXISTS "Admins can read all review relationships" ON review_relationships;

-- Add a comment explaining the change
COMMENT ON TABLE users IS 'RLS policies updated to prevent infinite recursion. Admin operations should use service role or be handled through edge functions.';