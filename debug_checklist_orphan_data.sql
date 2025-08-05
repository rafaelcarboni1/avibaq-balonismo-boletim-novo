-- Script para diagnosticar dados órfãos na tabela checklist_itens
-- Data: Janeiro 2025
-- Problema: Foreign key constraint violation no campo marcado_por

-- =====================================================================
-- DIAGNÓSTICO: Verificar dados órfãos
-- =====================================================================

-- 1. Verificar itens com marcado_por que não existem na tabela users
SELECT 
    '=== DADOS ÓRFÃOS EM marcado_por ===' as diagnostico;

SELECT 
    ci.id,
    ci.voo_id,
    ci.marcado_por,
    ci.marcado_em,
    ci.item_descricao,
    'ÓRFÃO - usuário não existe' as status
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  )
LIMIT 10;

-- 2. Verificar itens com created_by órfãos
SELECT 
    '=== DADOS ÓRFÃOS EM created_by ===' as diagnostico;

SELECT 
    ci.id,
    ci.voo_id,
    ci.created_by,
    ci.item_descricao,
    'ÓRFÃO - usuário não existe' as status
FROM checklist_itens ci
WHERE ci.created_by IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.created_by
  )
LIMIT 10;

-- 3. Verificar itens com preenchido_por órfãos
SELECT 
    '=== DADOS ÓRFÃOS EM preenchido_por ===' as diagnostico;

SELECT 
    ci.id,
    ci.voo_id,
    ci.preenchido_por,
    ci.item_descricao,
    'ÓRFÃO - usuário não existe' as status
FROM checklist_itens ci
WHERE ci.preenchido_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.preenchido_por
  )
LIMIT 10;

-- 4. Contar total de registros órfãos
SELECT 
    '=== RESUMO DE DADOS ÓRFÃOS ===' as diagnostico;

SELECT 
    'marcado_por' as campo,
    COUNT(*) as total_orfaos
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  )
UNION ALL
SELECT 
    'created_by' as campo,
    COUNT(*) as total_orfaos
FROM checklist_itens ci
WHERE ci.created_by IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.created_by
  )
UNION ALL
SELECT 
    'preenchido_por' as campo,
    COUNT(*) as total_orfaos
FROM checklist_itens ci
WHERE ci.preenchido_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.preenchido_por
  );

-- 5. Verificar usuário específico do erro (igor_pk_@hotmail.com)
SELECT 
    '=== VERIFICAR USUÁRIO ESPECÍFICO ===' as diagnostico;

SELECT 
    u.id::text,
    u.email,
    u.auth_id::text,
    u.created_at,
    'Usuário existe na tabela users' as status
FROM users u
WHERE u.email = 'igor_pk_@hotmail.com'
UNION ALL
SELECT 
    au.id::text,
    au.email,
    au.id::text as auth_id,
    au.created_at,
    'Usuário existe no auth.users' as status
FROM auth.users au
WHERE au.email = 'igor_pk_@hotmail.com';

-- 6. Verificar se há inconsistência entre auth.users e public.users
SELECT 
    '=== USUÁRIOS ÓRFÃOS EM AUTH ===' as diagnostico;

SELECT 
    au.id,
    au.email,
    au.created_at,
    'Existe em auth.users mas não em public.users' as problema
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.auth_id = au.id
)
LIMIT 5;