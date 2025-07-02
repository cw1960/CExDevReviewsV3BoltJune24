-- Fix RLS policies for user_messages table
-- The issue: policies use auth.uid() but table stores profile IDs
-- Solution: Map auth.uid() to profile ID via users table

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own messages" ON public.user_messages;
DROP POLICY IF EXISTS "Users can update their own message read status" ON public.user_messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON public.user_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.user_messages;

-- Create new correct policies that map auth.uid() to profile IDs

-- Users can only see their own messages (map auth.uid to profile ID)
CREATE POLICY "Users can view their own messages" ON public.user_messages
    FOR SELECT
    USING (
        recipient_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Users can only mark their own messages as read (map auth.uid to profile ID)
CREATE POLICY "Users can update their own message read status" ON public.user_messages
    FOR UPDATE
    USING (
        recipient_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        recipient_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Only admins can send messages (check admin role via auth.uid mapping)
CREATE POLICY "Admins can insert messages" ON public.user_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT auth_user_id FROM public.users 
            WHERE role = 'admin'
        )
    );

-- Only admins can view all messages (check admin role via auth.uid mapping)
CREATE POLICY "Admins can view all messages" ON public.user_messages
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT auth_user_id FROM public.users 
            WHERE role = 'admin'
        )
    );

-- Log the completion
DO $$
BEGIN
  RAISE NOTICE 'Fixed RLS policies for user_messages table';
  RAISE NOTICE 'Policies now correctly map auth.uid() to profile IDs';
END $$; 