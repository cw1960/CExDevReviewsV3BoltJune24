-- Create user_messages table for admin-to-user messaging system
CREATE TABLE IF NOT EXISTS public.user_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'urgent')),
    popup_on_login BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    CONSTRAINT valid_message_length CHECK (length(subject) > 0 AND length(message) > 0)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient_id ON public.user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON public.user_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_unread ON public.user_messages(recipient_id, is_read) WHERE is_read = false;

-- RLS Policies
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own messages
CREATE POLICY "Users can view their own messages" ON public.user_messages
    FOR SELECT
    USING (recipient_id = auth.uid());

-- Users can only mark their own messages as read
CREATE POLICY "Users can update their own message read status" ON public.user_messages
    FOR UPDATE
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- Only admins can send messages
CREATE POLICY "Admins can insert messages" ON public.user_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Only admins can view all messages (for management purposes)
CREATE POLICY "Admins can view all messages" ON public.user_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.user_messages TO authenticated;
GRANT INSERT ON public.user_messages TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.user_messages IS 'Admin-to-user messaging system for in-app notifications';
COMMENT ON COLUMN public.user_messages.priority IS 'Message priority: normal, high, or urgent (affects UI display)';
COMMENT ON COLUMN public.user_messages.popup_on_login IS 'Whether to show this message as a popup on user login';
COMMENT ON COLUMN public.user_messages.is_read IS 'Whether the user has read this message';

-- Log the completion of this migration
DO $$
BEGIN
  RAISE NOTICE 'User messages table migration completed successfully.';
  RAISE NOTICE 'Admin-to-user messaging system is now available.';
END $$;
