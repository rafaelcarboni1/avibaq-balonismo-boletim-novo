-- Fix users table structure to ensure all required columns exist
-- This migration ensures the users table has all necessary fields for the password system

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add nome column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nome') THEN
        ALTER TABLE users ADD COLUMN nome TEXT;
    END IF;
    
    -- Add senha_hash column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'senha_hash') THEN
        ALTER TABLE users ADD COLUMN senha_hash TEXT;
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'meteo';
    END IF;
    
    -- Add ativo column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'ativo') THEN
        ALTER TABLE users ADD COLUMN ativo BOOLEAN DEFAULT true;
    END IF;
    
    -- Add primeira_senha column if it doesn't exist (already handled by previous migration)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'primeira_senha') THEN
        ALTER TABLE users ADD COLUMN primeira_senha BOOLEAN DEFAULT false;
    END IF;
    
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email TEXT UNIQUE;
    END IF;
    
    -- Add timestamps if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;