-- Add policy to allow public signup for users table
-- This migration fixes the issue where users cannot register via the public signup page

-- Policy to allow public signup (anyone can insert into users table)
CREATE POLICY "Allow public signup" ON users
  FOR INSERT WITH CHECK (true);

-- Add comment to document the policy
COMMENT ON POLICY "Allow public signup" ON users IS 
  'Allows anyone to insert into users table, needed for public signup flow'; 