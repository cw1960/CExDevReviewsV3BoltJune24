-- Force schema refresh to resolve "column name does not exist" error
-- This migration adds a temporary column to force Supabase to re-evaluate the entire schema
-- which should resolve any caching issues with the users table structure

-- Add temporary column to force schema refresh
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS temp_schema_refresh_column text DEFAULT 'temp';

-- Immediately remove the temporary column
ALTER TABLE public.users DROP COLUMN IF EXISTS temp_schema_refresh_column;

-- Log the schema refresh
DO $$
BEGIN
  RAISE LOG 'Schema refresh migration completed. This should resolve the "column name does not exist" error.';
END $$;

-- Add comment explaining the purpose
COMMENT ON TABLE public.users IS 'Schema refreshed to resolve column visibility issues. User profiles created via Edge Function.';