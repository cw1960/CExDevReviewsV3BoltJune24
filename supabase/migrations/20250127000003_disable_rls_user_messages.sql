-- Temporarily disable RLS on user_messages for admin testing
-- This allows service role to access the table without policy complications

ALTER TABLE public.user_messages DISABLE ROW LEVEL SECURITY;

-- Keep the grants for safety
GRANT SELECT, INSERT, UPDATE ON public.user_messages TO authenticated;
GRANT ALL ON public.user_messages TO service_role;

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Disabled RLS on user_messages table for admin testing';
  RAISE NOTICE 'Service role now has full access to user_messages';
END $$; 