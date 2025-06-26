/*
  # Complete Trigger and Function Cleanup

  1. Changes
    - Forcefully remove ALL user creation triggers and functions
    - Clean up any remaining trigger dependencies
    - Ensure auth.users table is in clean state
    - Remove any conflicting RLS policies that might interfere

  2. Security
    - Maintains existing RLS on users table
    - Ensures Edge Functions can still create profiles with service role
    - Removes any circular dependencies in trigger system

  3. Notes
    - This migration ensures complete cleanup of problematic triggers
    - User profiles will be created exclusively via Edge Function
    - Fixes the "Database error saving new user" issue
*/

-- First, disable any existing triggers on auth.users
ALTER TABLE auth.users DISABLE TRIGGER ALL;

-- Drop all possible variations of the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users CASCADE;

-- Drop all possible variations of the function
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS create_user_profile(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile(uuid) CASCADE;

-- Re-enable triggers (this will only enable system triggers, not our dropped ones)
ALTER TABLE auth.users ENABLE TRIGGER ALL;

-- Ensure the users table exists with proper structure
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id text,
  reviewer_status text DEFAULT 'pending' CHECK (reviewer_status IN ('pending', 'approved', 'rejected')),
  reviewer_specialties text[],
  reviewer_bio text,
  reviewer_experience_years integer,
  reviewer_portfolio_url text,
  admin_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Clean up any problematic policies and recreate essential ones
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Public read access for users" ON public.users;

-- Create clean, non-conflicting RLS policies
CREATE POLICY "authenticated_users_read_own" 
  ON public.users 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "authenticated_users_update_own" 
  ON public.users 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "service_role_full_access" 
  ON public.users 
  FOR ALL 
  TO service_role 
  USING (true);

-- Add helpful comment
COMMENT ON TABLE public.users IS 'User profiles created via Edge Function only. No database triggers for user creation.';

-- Log successful cleanup
DO $$
BEGIN
  RAISE LOG 'Complete trigger cleanup completed. User signup should now work properly.';
END $$;