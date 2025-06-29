/*
  # Fix user_profiles RLS policies and constraints

  1. Issues Fixed
    - Update RLS policies to use proper auth.uid() function
    - Ensure foreign key references auth.users correctly
    - Fix INSERT policy to allow user profile creation

  2. Changes Made
    - Drop existing RLS policies
    - Recreate policies with correct auth.uid() references
    - Update foreign key constraint if needed
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Recreate policies with correct auth.uid() function
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

-- Ensure the foreign key constraint references auth.users correctly
-- First drop the existing constraint if it exists
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;