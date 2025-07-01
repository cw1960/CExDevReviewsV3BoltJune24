-- Add 'cancelled' status to review_assignments table
-- This allows reviewers to cancel assignments when they encounter problems

-- First, let's check the current constraint name
DO $$
BEGIN
  -- Add 'cancelled' to the existing check constraint
  ALTER TABLE public.review_assignments 
  DROP CONSTRAINT IF EXISTS review_assignments_status_check;
  
  ALTER TABLE public.review_assignments 
  ADD CONSTRAINT review_assignments_status_check 
  CHECK (status IN ('assigned', 'submitted', 'approved', 'cancelled'));
  
  RAISE NOTICE 'Added cancelled status to review_assignments table';
END $$;

-- Add comment explaining the new status
COMMENT ON COLUMN public.review_assignments.status IS 'Status of the review assignment: assigned (active), submitted (awaiting approval), approved (completed), cancelled (cancelled by reviewer due to problems)';

-- Log the completion of this migration
DO $$
BEGIN
  RAISE NOTICE 'Review assignment cancelled status migration completed successfully.';
  RAISE NOTICE 'Reviewers can now cancel assignments when they encounter problems like removed extensions.';
END $$; 