# First Review Requirement Fix - July 19, 2025

## Problem

The most recent update was supposed to apply the first review requirement only to new users as of Saturday, July 19, 2025, but instead it was being applied to all users. This meant that existing users before July 19, 2025 who already fulfilled the requirement to complete their first review assignment were being asked to do so again.

## Root Cause

The `has_completed_first_review` field was being used in the code but didn't exist in the database schema. This caused the field to always be `undefined` or `false`, making all users appear as if they hadn't completed their first review.

## Solution

### 1. Database Schema Update

- **Migration**: `20250719000000_add_first_review_requirement.sql`
- **Action**: Added `has_completed_first_review` boolean field to the `users` table
- **Default**: `false` for all users

### 2. Existing User Data Migration

The migration automatically updates existing users based on the following logic:

- **Users created before July 19, 2025** who have at least one approved review: `has_completed_first_review = true`
- **Users created before July 19, 2025** who have no approved reviews: `has_completed_first_review = false`
- **Users created on or after July 19, 2025**: `has_completed_first_review = false` (must complete first review)

### 3. Code Updates

#### Database Types (`src/types/database.ts`)

- Added `has_completed_first_review: boolean` to the users table type definitions
- Updated Row, Insert, and Update interfaces

#### User Creation (`supabase/functions/create-user-profile/index.ts`)

- Added `has_completed_first_review: false` to new user creation
- Ensures new users must complete their first review before submitting extensions

#### Review Processing (`supabase/functions/process-submitted-review/index.ts`)

- Already had logic to set `has_completed_first_review = true` when user completes their first approved review
- This now works correctly with the database field

### 4. UI Components

The following components already had the correct logic and now work properly:

- **DashboardPage.tsx**: Shows first review requirement alert for users who haven't completed it
- **ExtensionLibraryPage.tsx**: Prevents extension submission for users who haven't completed first review
- **Create Extension Function**: Blocks extension submission to queue for users without first review

## Expected Behavior After Fix

### Existing Users (Created Before July 19, 2025)

- **With approved reviews**: Can submit extensions to queue immediately
- **Without approved reviews**: Must complete first review before submitting extensions

### New Users (Created On or After July 19, 2025)

- **All new users**: Must complete first review before submitting extensions to queue
- **Default state**: `has_completed_first_review = false`

## Migration Details

```sql
-- Add the field
ALTER TABLE public.users
ADD COLUMN has_completed_first_review boolean DEFAULT false;

-- Update existing users with approved reviews
UPDATE public.users
SET has_completed_first_review = true
WHERE created_at < '2025-07-19 00:00:00+00'
AND id IN (
  SELECT DISTINCT reviewer_id
  FROM review_assignments
  WHERE status = 'approved'
);
```

## Testing

The fix has been tested with simulated user data to ensure:

1. Existing users with approved reviews are properly marked as having completed their first review
2. Existing users without approved reviews are not affected
3. New users are required to complete their first review

## Files Modified

1. `supabase/migrations/20250719000000_add_first_review_requirement.sql` (new)
2. `src/types/database.ts`
3. `supabase/functions/create-user-profile/index.ts`

## Status

✅ **FIXED** - The first review requirement now correctly applies only to new users as of July 19, 2025, while existing users who have already completed reviews are not affected.
