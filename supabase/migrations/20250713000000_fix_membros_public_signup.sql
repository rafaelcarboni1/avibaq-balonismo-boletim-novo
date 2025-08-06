-- Add policy to allow public signup for membros table
-- This migration fixes the issue where users cannot register via the public signup page

-- Policy to allow public signup (anyone can insert into membros table)
CREATE POLICY "Allow public signup for membros" ON membros
  FOR INSERT WITH CHECK (true);

-- Add comment to document the policy
COMMENT ON POLICY "Allow public signup for membros" ON membros IS 
  'Allows anyone to insert into membros table, needed for public signup flow'; 