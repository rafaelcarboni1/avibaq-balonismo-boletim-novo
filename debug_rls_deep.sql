-- DEBUG PROFUNDO: Investigar causa raiz do erro RLS
-- Execute este SQL no Dashboard do Supabase - PASSO A PASSO

-- PASSO 1: Verificar se auth.uid() está funcionando
SELECT 
  'TESTE AUTH.UID()' as debug,
  auth.uid() as current_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN 'PROBLEMA: auth.uid() está NULL'
    ELSE 'OK: usuário autenticado'
  END as status;

-- PASSO 2: Verificar políticas RLS ativas na tabela baloes
SELECT 
  'POLÍTICAS RLS BALOES' as debug,
  policyname,
  cmd,
  permissive,
  qual
FROM pg_policies 
WHERE tablename = 'baloes'
ORDER BY policyname;

-- PASSO 3: Simular INSERT manual para testar política
-- ATENÇÃO: Execute este SELECT primeiro para pegar IDs válidos
SELECT 
  'IDS PARA TESTE' as debug,
  m.id as membro_id,
  m.nome_completo,
  m.email,
  m.user_id,
  u.id as auth_user_id
FROM membros m
JOIN auth.users u ON m.email = u.email
WHERE m.tipo = 'piloto' 
AND m.status = 'ativo'
LIMIT 3;

-- PASSO 4: Testar a condição da política RLS manualmente
-- Substitua 'MEMBER_ID_AQUI' e 'AUTH_USER_ID_AQUI' pelos valores do PASSO 3
/*
SELECT 
  'TESTE POLÍTICA RLS' as debug,
  EXISTS (
    SELECT 1 FROM membros m 
    JOIN auth.users u ON (
      (m.user_id = u.id AND u.id = 'AUTH_USER_ID_AQUI') OR 
      (m.user_id IS NULL AND m.email = u.email AND u.id = 'AUTH_USER_ID_AQUI')
    )
    WHERE m.id = 'MEMBER_ID_AQUI'
    AND m.status = 'ativo'
  ) as politica_permite;
*/

-- PASSO 5: Verificar estrutura da tabela baloes
SELECT 
  'ESTRUTURA BALOES' as debug,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'baloes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- PASSO 6: Verificar se RLS está habilitado
SELECT 
  'RLS STATUS' as debug,
  tablename,
  rowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced
FROM pg_tables 
JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE tablename = 'baloes';

-- PASSO 7: Verificar membros do usuário atual (se logado)
SELECT 
  'MEMBRO USUARIO ATUAL' as debug,
  m.id,
  m.nome_completo,
  m.email,
  m.user_id,
  m.tipo,
  m.status,
  CASE 
    WHEN m.user_id = auth.uid() THEN 'MATCH POR USER_ID'
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = m.email) THEN 'MATCH POR EMAIL'
    ELSE 'SEM MATCH'
  END as match_status
FROM membros m
WHERE (m.user_id = auth.uid() OR EXISTS(
  SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = m.email
))
AND m.status = 'ativo';