-- INVESTIGAÇÃO: Execute no Dashboard do Supabase
-- URL: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- 1. Ver estrutura completa da tabela users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Ver os usuários admin específicos (sem mostrar dados sensíveis)
SELECT 
  id, 
  email,
  role, 
  auth_id,
  ativo,
  primeira_senha,
  created_at
FROM users 
WHERE role = 'admin';

-- 3. Verificar como está a distribuição de auth_id
SELECT 
  role,
  COUNT(*) as total,
  COUNT(auth_id) as with_auth_id,
  COUNT(CASE WHEN auth_id IS NULL THEN 1 END) as without_auth_id
FROM users 
GROUP BY role;

-- 4. Ver se existe algum padrão nos usuários com auth_id vs sem auth_id
SELECT 
  'With auth_id' as category,
  COUNT(*) as count,
  MIN(created_at) as oldest_date,
  MAX(created_at) as newest_date
FROM users 
WHERE auth_id IS NOT NULL

UNION ALL

SELECT 
  'Without auth_id' as category,
  COUNT(*) as count,
  MIN(created_at) as oldest_date,
  MAX(created_at) as newest_date
FROM users 
WHERE auth_id IS NULL

ORDER BY category;