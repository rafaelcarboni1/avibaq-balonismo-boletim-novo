-- Add field to track if user needs to change password on first login
-- This allows us to force password change for users created with temporary passwords

-- Add column to track if user has temporary password
ALTER TABLE users ADD COLUMN primeira_senha BOOLEAN DEFAULT true;

-- Set existing users as not requiring password change (they already have their passwords)
UPDATE users SET primeira_senha = false WHERE senha_hash IS NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN users.primeira_senha IS 
  'Indicates if user has temporary password and must change it on first login. Set to true when admin creates user, false after user changes password.';