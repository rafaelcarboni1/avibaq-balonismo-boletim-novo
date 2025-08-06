-- DEBUG: Verificar estado de TODOS os membros e políticas RLS
-- Execute este SQL no Dashboard do Supabase para debug

-- 1. VERIFICAR TODOS MEMBROS (PILOTOS E AGÊNCIAS) COM PROBLEMAS DE USER_ID
SELECT 
  'MEMBROS COM USER_ID NULL' as debug,
  COUNT(*) as total,
  tipo
FROM membros 
WHERE user_id IS NULL AND status = 'ativo'
GROUP BY tipo;

-- 2. VERIFICAR MEMBROS SEM VINCULAÇÃO
SELECT 
  'MEMBROS SEM VINCULAÇÃO' as debug,
  id,
  nome_completo,
  email,
  user_id,
  tipo,
  status
FROM membros 
WHERE user_id IS NULL AND status = 'ativo'
ORDER BY tipo, nome_completo;

-- 3. VERIFICAR TODOS USUÁRIOS AUTH
SELECT 
  'TOTAL USERS AUTH' as debug,
  COUNT(*) as total_users_auth
FROM auth.users;

-- 4. VERIFICAR MATCH ENTRE MEMBROS E USERS (TODOS)
SELECT 
  'MATCH GERAL MEMBROS-USERS' as debug,
  m.nome_completo,
  m.email as membro_email,
  m.user_id as membro_user_id,
  m.tipo,
  u.id as user_id,
  u.email as user_email,
  CASE 
    WHEN m.user_id = u.id THEN 'VINCULADO POR USER_ID'
    WHEN m.email = u.email THEN 'VINCULADO POR EMAIL'
    ELSE 'NÃO VINCULADO'
  END as status_vinculacao
FROM membros m
FULL OUTER JOIN auth.users u ON (m.user_id = u.id OR m.email = u.email)
WHERE m.status = 'ativo'
ORDER BY m.tipo, status_vinculacao;

-- 4. TESTAR POLÍTICA RLS MANUALMENTE (simular auth.uid())
-- ATENÇÃO: Substitua 'USER_ID_DO_RODRIGO' pelo ID real do usuário auth
/*
SELECT 
  'TESTE RLS MANUAL' as debug,
  b.*
FROM baloes b
WHERE EXISTS (
  SELECT 1 FROM membros m 
  JOIN auth.users u ON (
    (m.user_id = u.id AND u.id = 'USER_ID_DO_RODRIGO') OR 
    (m.user_id IS NULL AND m.email = u.email AND u.id = 'USER_ID_DO_RODRIGO')
  )
  WHERE m.id = b.proprietario_id 
  AND m.status = 'ativo'
);
*/

-- 5. VERIFICAR POLÍTICAS RLS ATIVAS
SELECT 
  'POLÍTICAS RLS' as debug,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'baloes';