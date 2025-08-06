-- Query para descobrir os valores válidos do enum user_role
-- Execute esta query no SQL Editor do Supabase

-- 1. Verificar se user_role é realmente um enum
SELECT typname, typtype 
FROM pg_type 
WHERE typname = 'user_role';

-- 2. Se for enum, listar os valores válidos
SELECT unnest(enum_range(NULL::user_role)) as valid_roles;

-- 3. Verificar a estrutura da coluna 'role' na tabela users
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name = 'role';