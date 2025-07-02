-- Fix user_messages priority values to match frontend expectations
-- Change from 'normal', 'high', 'urgent' to 'low', 'medium', 'high', 'urgent'

-- First, update any existing 'normal' priority messages to 'medium'
UPDATE public.user_messages 
SET priority = 'medium' 
WHERE priority = 'normal';

-- Check if the table already has the correct constraint
DO $$
BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'user_messages_priority_check'
        AND table_name = 'user_messages'
    ) THEN
        ALTER TABLE public.user_messages DROP CONSTRAINT user_messages_priority_check;
        RAISE NOTICE 'Dropped existing priority constraint';
    END IF;
    
    -- Add the new constraint with correct priority values
    ALTER TABLE public.user_messages 
    ADD CONSTRAINT user_messages_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    
    RAISE NOTICE 'Added new priority constraint: low, medium, high, urgent';
END $$;

-- Update the default value
ALTER TABLE public.user_messages 
ALTER COLUMN priority SET DEFAULT 'medium';

-- Log the completion
DO $$
BEGIN
  RAISE NOTICE 'User messages priority values updated to match frontend: low, medium, high, urgent';
END $$; 