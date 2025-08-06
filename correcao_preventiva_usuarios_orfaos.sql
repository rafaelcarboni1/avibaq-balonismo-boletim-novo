-- Script de Correção Preventiva para Usuários Órfãos
-- Corrige todos os casos identificados de inconsistências no fluxo de cadastro
-- Executar após análise com analisar_cadastros_associar_se.sql

-- ========================================
-- BACKUP DE SEGURANÇA
-- ========================================

-- Criar backup da tabela users antes das correções
DROP TABLE IF EXISTS users_backup_preventivo;
CREATE TABLE users_backup_preventivo AS SELECT * FROM users;

-- Criar backup da tabela membros antes das correções
DROP TABLE IF EXISTS membros_backup_preventivo;
CREATE TABLE membros_backup_preventivo AS SELECT * FROM membros;

SELECT 'Backups criados com sucesso' as status;

-- ========================================
-- CORREÇÃO 1: USUÁRIOS ÓRFÃOS EM AUTH.USERS
-- ========================================

SELECT '=== INICIANDO CORREÇÃO DE USUÁRIOS ÓRFÃOS ===' as info;

-- Inserir usuários órfãos de auth.users em public.users
INSERT INTO public.users (
    auth_id,
    nome,
    email,
    role,
    username,
    ativo,
    primeira_senha,
    created_at
)
SELECT 
    au.id as auth_id,
    COALESCE(au.raw_user_meta_data->>'nome', au.email) as nome,
    au.email,
    COALESCE(au.raw_user_meta_data->>'role', 'piloto')::user_role as role,
    COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)) as username,
    CASE 
        WHEN au.last_sign_in_at > NOW() - INTERVAL '30 days' THEN true
        ELSE false
    END as ativo,
    false as primeira_senha,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL
  AND au.raw_user_meta_data->>'role' IN ('piloto', 'agencia')
  AND au.email IS NOT NULL;

SELECT 
    'Usuários órfãos corrigidos (auth -> public)' as status,
    COUNT(*) as quantidade
FROM auth.users au
INNER JOIN public.users pu ON pu.auth_id = au.id
WHERE au.raw_user_meta_data->>'role' IN ('piloto', 'agencia')
  AND pu.created_at >= NOW() - INTERVAL '1 minute';

-- ========================================
-- CORREÇÃO 2: SINCRONIZAR MEMBROS ÓRFÃOS
-- ========================================

SELECT '=== SINCRONIZANDO MEMBROS ÓRFÃOS ===' as info;

-- Atualizar membros que não têm user_id válido
-- Tentar encontrar o user_id correto baseado no email
UPDATE membros 
SET user_id = (
    SELECT pu.auth_id 
    FROM public.users pu 
    WHERE pu.email = membros.email 
    LIMIT 1
)
WHERE user_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.users pu 
    WHERE pu.email = membros.email
  );

SELECT 
    'Membros sincronizados com user_id' as status,
    COUNT(*) as quantidade
FROM membros m
INNER JOIN public.users pu ON pu.auth_id = m.user_id
WHERE m.user_id IS NOT NULL;

-- ========================================
-- CORREÇÃO 3: CORRIGIR INCONSISTÊNCIAS DE EMAIL
-- ========================================

SELECT '=== CORRIGINDO INCONSISTÊNCIAS DE EMAIL ===' as info;

-- Atualizar emails inconsistentes entre membros e users
-- Priorizar o email da tabela auth.users como fonte da verdade
UPDATE membros 
SET email = (
    SELECT au.email 
    FROM auth.users au
    INNER JOIN public.users pu ON pu.auth_id = au.id
    WHERE pu.auth_id = membros.user_id
    LIMIT 1
)
WHERE user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM auth.users au
    INNER JOIN public.users pu ON pu.auth_id = au.id
    WHERE pu.auth_id = membros.user_id
      AND au.email != membros.email
  );

SELECT 
    'Emails sincronizados entre membros e auth' as status,
    COUNT(*) as quantidade
FROM membros m
INNER JOIN public.users pu ON pu.auth_id = m.user_id
INNER JOIN auth.users au ON au.id = pu.auth_id
WHERE m.email = au.email;

-- ========================================
-- CORREÇÃO 4: CORRIGIR CHECKLIST_ITENS ÓRFÃOS
-- ========================================

SELECT '=== CORRIGINDO CHECKLIST_ITENS ÓRFÃOS ===' as info;

-- Limpar marcado_por inválido em checklist_itens
-- (Definir como NULL para itens com marcado_por inválido)
UPDATE checklist_itens 
SET marcado_por = NULL,
    marcado_em = NULL
WHERE marcado_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = checklist_itens.marcado_por
  );

SELECT 
    'Checklist itens com marcado_por inválido limpos' as status,
    COUNT(*) as quantidade_limpa
FROM checklist_itens
WHERE marcado_por IS NULL;

-- ========================================
-- VERIFICAÇÃO FINAL DE INTEGRIDADE
-- ========================================

SELECT '=== VERIFICAÇÃO FINAL DE INTEGRIDADE ===' as info;

-- 1. Verificar se ainda existem usuários órfãos
SELECT 
    'Usuários órfãos restantes (auth sem public)' as categoria,
    COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL
  AND au.raw_user_meta_data->>'role' IN ('piloto', 'agencia')
UNION ALL
-- 2. Verificar usuários sem auth_id
SELECT 
    'Usuários sem auth_id (public órfãos)' as categoria,
    COUNT(*) as quantidade
FROM public.users pu
WHERE pu.auth_id IS NULL
  AND pu.role IN ('piloto', 'agencia')
UNION ALL
-- 3. Verificar membros órfãos
SELECT 
    'Membros sem user_id válido' as categoria,
    COUNT(*) as quantidade
FROM membros m
LEFT JOIN public.users pu ON pu.auth_id = m.user_id
WHERE pu.id IS NULL
UNION ALL
-- 4. Verificar checklist órfãos
SELECT 
    'Checklist itens com marcado_por inválido' as categoria,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  );

-- ========================================
-- ESTATÍSTICAS FINAIS
-- ========================================

SELECT '=== ESTATÍSTICAS FINAIS ===' as info;

SELECT 
    'Total auth.users (piloto/agencia)' as categoria,
    COUNT(*) as quantidade
FROM auth.users au
WHERE au.raw_user_meta_data->>'role' IN ('piloto', 'agencia')
UNION ALL
SELECT 
    'Total public.users (piloto/agencia)' as categoria,
    COUNT(*) as quantidade
FROM public.users pu
WHERE pu.role IN ('piloto', 'agencia')
UNION ALL
SELECT 
    'Total membros' as categoria,
    COUNT(*) as quantidade
FROM membros
UNION ALL
SELECT 
    'Usuários com sincronização completa' as categoria,
    COUNT(*) as quantidade
FROM auth.users au
INNER JOIN public.users pu ON pu.auth_id = au.id
INNER JOIN membros m ON m.user_id = pu.auth_id
WHERE au.raw_user_meta_data->>'role' IN ('piloto', 'agencia');

-- ========================================
-- LOG DE CORREÇÕES APLICADAS
-- ========================================

SELECT '=== LOG DE CORREÇÕES APLICADAS ===' as info;

SELECT 
    NOW() as data_correcao,
    'Correção preventiva de usuários órfãos aplicada com sucesso' as status,
    'Backups criados: users_backup_preventivo, membros_backup_preventivo' as backup_info;

SELECT 'CORREÇÃO PREVENTIVA CONCLUÍDA COM SUCESSO!' as resultado_final;