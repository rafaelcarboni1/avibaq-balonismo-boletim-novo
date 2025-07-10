-- Fix role constraint in users table to include 'meteo' role
-- This migration fixes the issue where users creation fails when 'meteo' role is selected

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Create a new constraint that includes 'meteo' role
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'meteo', 'tesouraria', 'piloto', 'agencia'));

-- Add comment to document the fix
COMMENT ON CONSTRAINT users_role_check ON users IS 
  'Allows roles: admin, meteo, tesouraria, piloto, agencia. Fixed to include meteo role for meteorologists.';