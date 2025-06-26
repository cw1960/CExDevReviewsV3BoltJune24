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

-- Ensure the users table exists with the CORRECT structure for the application
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  credit_balance integer DEFAULT 0,
  subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
  has_completed_qualification boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  role text DEFAULT 'user' CHECK (role IN ('admin', 'moderator', 'user')),
  onboarding_complete boolean DEFAULT false,
  exchanges_this_month integer DEFAULT 0,
  last_exchange_reset_date timestamptz DEFAULT now(),
  cookie_preferences text DEFAULT 'not_set' CHECK (cookie_preferences IN ('accepted', 'declined', 'not_set')),
  cookie_consent_timestamp timestamptz DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Clean up any problematic policies and recreate essential ones
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
DROP POLICY IF EXISTS "Public read access for users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_read_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_update_own" ON public.users;
DROP POLICY IF EXISTS "service_role_full_access" ON public.users;

-- Create clean, non-conflicting RLS policies that match the application's expectations
CREATE POLICY "users_own_profile_only" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_new_profile" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Add helpful comment
COMMENT ON TABLE public.users IS 'User profiles created via Edge Function only. Schema matches application expectations with credit_balance, onboarding_complete, etc.';

-- Log successful cleanup
DO $$
BEGIN
  RAISE LOG 'Users table schema fixed to match application expectations. User signup should now work properly.';
END $$;