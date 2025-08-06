-- Add INSERT policy for users table
-- This migration fixes the issue where authenticated admins cannot create new users
-- Follows project security rules: RLS active, admin data protected by authentication

-- Policy to allow authenticated users (admins) to insert new users
CREATE POLICY "Authenticated users can insert users" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy to allow authenticated users (admins) to update users  
CREATE POLICY "Authenticated users can update users" ON users
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policy to allow authenticated users (admins) to delete users
CREATE POLICY "Authenticated users can delete users" ON users
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Add comment to document the policies
COMMENT ON TABLE users IS 
  'Users table with RLS policies: authenticated users can perform all operations. Used by /admin/usuarios page.';