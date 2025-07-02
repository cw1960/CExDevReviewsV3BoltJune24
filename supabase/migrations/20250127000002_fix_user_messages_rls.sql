-- Fix RLS policies for user_messages table
-- The issue: policies use auth.uid() but table stores profile IDs
-- Solution: Map auth.uid() to profile ID via users table

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.user_messages;
DROP POLICY IF EXISTS "Users can update their own message read status" ON public.user_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON public.user_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.user_messages;

-- Create new correct policies that map auth.uid() to profile IDs

-- Users can only see their own messages (direct auth.uid() match)
CREATE POLICY "Users can view their own messages" ON public.user_messages
    FOR SELECT
    USING (recipient_id = auth.uid());

-- Users can only mark their own messages as read (direct auth.uid() match)
CREATE POLICY "Users can update their own message read status" ON public.user_messages
    FOR UPDATE
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- Only admins can send messages (check admin role via auth.uid)
CREATE POLICY "Admins can insert messages" ON public.user_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Only admins can view all messages (check admin role via auth.uid)
CREATE POLICY "Admins can view all messages" ON public.user_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Log the completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed RLS policies for user_messages table';
  RAISE NOTICE 'Policies now correctly map auth.uid() to profile IDs';
END $$; 