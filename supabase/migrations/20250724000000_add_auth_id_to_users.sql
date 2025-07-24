-- Add auth_id column to users table for linking with Supabase Auth
-- This column will store the UUID from auth.users.id to link our custom users table
-- with the Supabase authentication system

-- Add auth_id column and migrated_at timestamp
DO $$ 
BEGIN
    -- Add auth_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'auth_id') THEN
        ALTER TABLE users ADD COLUMN auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
    END IF;
    
    -- Add migrated_at column to track when the user was migrated to auth
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'migrated_at') THEN
        ALTER TABLE users ADD COLUMN migrated_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add additional fields that might be missing for agencies
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cnpj') THEN
        ALTER TABLE users ADD COLUMN cnpj TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'razao_social') THEN
        ALTER TABLE users ADD COLUMN razao_social TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nome_fantasia') THEN
        ALTER TABLE users ADD COLUMN nome_fantasia TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'telefone') THEN
        ALTER TABLE users ADD COLUMN telefone TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'celular') THEN
        ALTER TABLE users ADD COLUMN celular TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'endereco') THEN
        ALTER TABLE users ADD COLUMN endereco TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cidade') THEN
        ALTER TABLE users ADD COLUMN cidade TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'cep') THEN
        ALTER TABLE users ADD COLUMN cep TEXT;
    END IF;
END $$;

-- Add comment to document the purpose of auth_id column
COMMENT ON COLUMN users.auth_id IS 'UUID linking to auth.users.id for Supabase authentication integration';
COMMENT ON COLUMN users.migrated_at IS 'Timestamp when user was migrated to Supabase Auth system';