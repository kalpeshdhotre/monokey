/*
  # Fix user_profiles foreign key constraint

  1. Changes
    - Drop the incorrect foreign key constraint that references `users(id)`
    - Add correct foreign key constraint that references `auth.users(id)`
    - This allows user profiles to be created successfully after Supabase Auth user creation

  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity with proper foreign key relationship
*/

-- Drop the incorrect foreign key constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Add the correct foreign key constraint that references auth.users
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_id_fkey 
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;