-- Fix RLS policies for users table
-- This migration adds proper RLS policies to the users table

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read from users table
-- This is needed for the login flow in admin/login.tsx
CREATE POLICY "Authenticated users can read users table" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy to allow users to update their own data (optional, for future use)
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy for admin operations (insert/delete should be restricted to service role)
CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (auth.role() = 'service_role');