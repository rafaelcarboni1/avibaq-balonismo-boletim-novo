-- SCRIPT DE DEBUG: Execute no Dashboard do Supabase
-- URL: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- 1. Verificar estrutura da tabela users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Listar usuários admin atuais
SELECT id, email, role, auth_id, nome 
FROM users 
WHERE role = 'admin';

-- 3. Verificar definição da função atual
SELECT p.proname, pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_user_combined_permissions'
AND n.nspname = 'public';

-- 4. Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'user_permissions', 'permission_audit_log')
ORDER BY tablename, policyname;

-- 5. Verificar estrutura da tabela permissoes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'permissoes' 
ORDER BY ordinal_position;

-- 6. Testar auth.uid() atual
SELECT auth.uid() as current_auth_uid, auth.role() as current_auth_role;

-- 7. Verificar se existe relação entre auth.users e public.users
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  pu.id as public_user_id,
  pu.email as public_email,
  pu.auth_id,
  pu.role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.auth_id
WHERE pu.role = 'admin'
LIMIT 10;