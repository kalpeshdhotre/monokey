/*
  # Fix Registration and Database Issues

  1. Database Schema Fixes
    - Fix RLS policies to work with triggers
    - Ensure proper foreign key constraints
    - Fix trigger function for user registration

  2. Security Updates
    - Update RLS policies for proper authentication
    - Ensure triggers work with RLS enabled

  3. Data Consistency
    - Fix any constraint issues
    - Ensure proper data types and defaults
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop and recreate RLS policies to ensure they work correctly
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Recreate the handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles with data from auth.users metadata
  INSERT INTO public.user_profiles (
    id,
    first_name,
    last_name,
    phone_number,
    mono_password_hash,
    storage_location
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    NEW.raw_user_meta_data->>'phoneNumber',
    COALESCE(NEW.raw_user_meta_data->>'monoPasswordHash', ''),
    COALESCE(NEW.raw_user_meta_data->>'storageLocation', 'saas')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Recreate RLS policies with proper permissions
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Allow the trigger function to bypass RLS for initial user creation
CREATE POLICY "Allow trigger to insert profiles"
  ON user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Ensure the foreign key constraint is correct
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make sure the table structure is correct
ALTER TABLE user_profiles 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL,
ALTER COLUMN mono_password_hash SET NOT NULL;

-- Ensure storage_location has proper default and constraint
ALTER TABLE user_profiles 
ALTER COLUMN storage_location SET DEFAULT 'saas';

-- Add constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_storage_location_check'
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_storage_location_check 
    CHECK (storage_location IN ('saas', 'google-drive', 'onedrive', 'local'));
  END IF;
END $$;