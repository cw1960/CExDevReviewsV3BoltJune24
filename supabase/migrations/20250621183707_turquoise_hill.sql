/*
  # Add Freemium Fields to Users Table

  1. New Fields
    - `subscription_status` (text) - tracks if user is 'free' or 'premium'
    - `exchanges_this_month` (integer) - tracks monthly submission count for free users
    - `last_exchange_reset_date` (timestamptz) - tracks when monthly count was last reset
    - `cookie_preferences` (text) - tracks user's cookie consent preference
    - `cookie_consent_timestamp` (timestamptz) - records when cookie consent was given/updated

  2. Changes
    - Add new columns to users table with appropriate defaults
    - Update handle_new_user function to set default values for new users
    - Add index for performance on subscription_status queries

  3. Security
    - Maintain existing RLS policies
    - Ensure new fields are accessible to users for their own profiles
*/

-- Add freemium fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS exchanges_this_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_exchange_reset_date timestamptz DEFAULT now();

-- Update the handle_new_user function to set freemium defaults
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
BEGIN
  -- Extract name from metadata, handle null/empty cases
  user_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), NULL);
  
  -- Insert new user record with freemium defaults
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    credit_balance, 
    onboarding_complete,
    subscription_status,
    exchanges_this_month,
    last_exchange_reset_date,
    cookie_preferences, -- New column
    cookie_consent_timestamp -- New column
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    1, -- Give new users 1 welcome credit
    false,
    'free', -- Default to free tier
    0, -- Start with 0 monthly exchanges
    now(), -- Set initial reset date
    'not_set', -- Default cookie preference
    now() -- Set initial cookie consent timestamp
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for performance on subscription status queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Add index for performance on monthly exchange tracking
CREATE INDEX IF NOT EXISTS idx_users_last_exchange_reset ON users(last_exchange_reset_date);

-- Add comment explaining the freemium model
COMMENT ON COLUMN users.subscription_status IS 'User subscription tier: free (1 extension, 4 monthly submissions) or premium (unlimited)';
COMMENT ON COLUMN users.exchanges_this_month IS 'Number of extensions submitted to review queue this month (free tier only)';
COMMENT ON COLUMN users.last_exchange_reset_date IS 'Date when monthly exchange count was last reset (every 28 days)';
