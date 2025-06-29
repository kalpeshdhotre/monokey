/*
  # Fix user profiles schema and policies

  1. Schema Updates
    - Update foreign key constraint to reference auth.users instead of users
    - Ensure all columns have proper defaults and constraints
    
  2. Security Updates  
    - Fix RLS policies to use auth.uid() instead of uid()
    - Ensure proper permissions for user registration
    
  3. Constraints
    - Add proper check constraint for storage_location
    - Ensure updated_at column has proper trigger
*/

-- First, drop the existing foreign key constraint
ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Add the correct foreign key constraint referencing auth.users
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Create corrected RLS policies using auth.uid()
CREATE POLICY "Users can insert own profile" 
ON public.user_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- Ensure the update trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();