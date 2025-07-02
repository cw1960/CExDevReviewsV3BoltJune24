-- Fix user_messages priority values to match frontend expectations
-- Change from 'normal', 'high', 'urgent' to 'low', 'medium', 'high', 'urgent'

-- First, create a temporary column without constraints
ALTER TABLE public.user_messages ADD COLUMN priority_temp TEXT;

-- Copy data to temporary column, converting 'normal' to 'medium'
UPDATE public.user_messages 
SET priority_temp = CASE 
    WHEN priority = 'normal' THEN 'medium'
    WHEN priority IN ('low', 'medium', 'high', 'urgent') THEN priority
    ELSE 'medium'  -- Default for any unexpected values
END;

-- Drop the old priority column (this removes all constraints on it)
ALTER TABLE public.user_messages DROP COLUMN priority;

-- Rename temporary column to priority
ALTER TABLE public.user_messages RENAME COLUMN priority_temp TO priority;

-- Add the new constraint with correct priority values
ALTER TABLE public.user_messages 
ADD CONSTRAINT user_messages_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Update the default value
ALTER TABLE public.user_messages 
ALTER COLUMN priority SET DEFAULT 'medium';

-- Log the completion
DO $$
BEGIN
  RAISE NOTICE 'User messages priority values updated to match frontend: low, medium, high, urgent';
END $$; 