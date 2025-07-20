/*
  # Add First Review Requirement for New Users (July 19, 2025)

  This migration adds the has_completed_first_review field to the users table
  and sets it appropriately for existing users vs new users.

  1. Changes
    - Adds has_completed_first_review boolean field to users table
    - Sets existing users (created before July 19, 2025) who have completed reviews to true
    - Sets existing users (created before July 19, 2025) who haven't completed reviews to false
    - New users (created on or after July 19, 2025) will default to false

  2. Logic
    - Users created before July 19, 2025 who have at least one approved review: has_completed_first_review = true
    - Users created before July 19, 2025 who have no approved reviews: has_completed_first_review = false
    - Users created on or after July 19, 2025: has_completed_first_review = false (default)
*/

-- Add the has_completed_first_review field to the users table
ALTER TABLE public.users 
ADD COLUMN has_completed_first_review boolean DEFAULT false;

-- Update existing users (created before July 19, 2025) who have completed at least one approved review
UPDATE public.users 
SET has_completed_first_review = true
WHERE created_at < '2025-07-19 00:00:00+00'
AND id IN (
  SELECT DISTINCT reviewer_id 
  FROM review_assignments 
  WHERE status = 'approved'
);

-- Add a comment explaining the field
COMMENT ON COLUMN public.users.has_completed_first_review IS 'Indicates if user has completed their first review. Required for new users (July 19, 2025+) before submitting extensions.';

-- Log the migration completion
DO $$
DECLARE
  existing_users_with_reviews integer;
  total_existing_users integer;
BEGIN
  -- Count existing users who have completed reviews
  SELECT COUNT(DISTINCT u.id) INTO existing_users_with_reviews
  FROM public.users u
  JOIN review_assignments ra ON u.id = ra.reviewer_id
  WHERE u.created_at < '2025-07-19 00:00:00+00'
  AND ra.status = 'approved';
  
  -- Count total existing users
  SELECT COUNT(*) INTO total_existing_users
  FROM public.users
  WHERE created_at < '2025-07-19 00:00:00+00';
  
  RAISE NOTICE 'Migration completed: % existing users (before July 19, 2025) have completed reviews out of % total existing users', 
    existing_users_with_reviews, total_existing_users;
  RAISE NOTICE 'New users (July 19, 2025+) will require first review completion before submitting extensions.';
END $$; 