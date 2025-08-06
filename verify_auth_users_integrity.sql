-- Script para verificar integridade entre auth.users e public.users
-- Este script identifica usuários que existem no auth mas não na tabela users

-- 1. Verificar usuários no auth.users que não existem em public.users
SELECT 
    '=== USUÁRIOS ÓRFÃOS (existem no auth mas não em public.users) ===' as info;

SELECT 
    au.id as auth_id,
    au.email,
    au.created_at as auth_created_at,
    au.last_sign_in_at,
    CASE 
        WHEN pu.id IS NULL THEN '❌ NÃO EXISTE em public.users'
        ELSE '✅ Existe em public.users'
    END as status_public_users
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL
ORDER BY au.last_sign_in_at DESC NULLS LAST;

-- 2. Contar usuários órfãos
SELECT 
    '=== ESTATÍSTICAS ===' as info,
    COUNT(*) as total_usuarios_auth
FROM auth.users;

SELECT 
    'Usuários em public.users' as tipo,
    COUNT(*) as quantidade
FROM public.users;

SELECT 
    'Usuários órfãos (auth sem public)' as tipo,
    COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL;

-- 3. Verificar usuários que fizeram login recentemente mas não existem em public.users
SELECT 
    '=== USUÁRIOS ÓRFÃOS COM LOGIN RECENTE (CRÍTICO) ===' as info;

SELECT 
    au.id as auth_id,
    au.email,
    au.last_sign_in_at,
    'CRÍTICO: Usuário ativo mas sem registro em public.users' as problema
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL 
  AND au.last_sign_in_at > NOW() - INTERVAL '7 days'
ORDER BY au.last_sign_in_at DESC;

-- 4. Verificar se há usuários em public.users sem auth_id
SELECT 
    '=== USUÁRIOS EM PUBLIC.USERS SEM AUTH_ID ===' as info;

SELECT 
    pu.id,
    pu.email,
    pu.nome,
    pu.role,
    pu.auth_id,
    'Usuário sem auth_id - pode causar problemas' as problema
FROM public.users pu
WHERE pu.auth_id IS NULL
ORDER BY pu.created_at DESC;

-- 5. Verificar integridade geral
SELECT 
    '=== VERIFICAÇÃO DE INTEGRIDADE GERAL ===' as info;

SELECT 
    'Total auth.users' as tipo,
    COUNT(*) as quantidade
FROM auth.users
UNION ALL
SELECT 
    'Total public.users' as tipo,
    COUNT(*) as quantidade
FROM public.users
UNION ALL
SELECT 
    'Usuários com auth_id válido' as tipo,
    COUNT(*) as quantidade
FROM public.users pu
INNER JOIN auth.users au ON au.id = pu.auth_id
UNION ALL
SELECT 
    'Usuários órfãos (auth sem public)' as tipo,
    COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL;

-- 6. Sugestão de correção para usuários órfãos
SELECT 
    '=== SCRIPT DE CORREÇÃO SUGERIDO ===' as info;

SELECT 
    'Para corrigir usuários órfãos, execute:' as instrucao,
    'INSERT INTO public.users (auth_id, email, nome, role, ativo) SELECT id, email, SPLIT_PART(email, ''@'', 1), ''piloto'', true FROM auth.users WHERE id NOT IN (SELECT COALESCE(auth_id, ''00000000-0000-0000-0000-000000000000'') FROM public.users);' as sql_sugerido;

-- 7. Verificar se há checklist_itens com marcado_por inválido
SELECT 
    '=== CHECKLIST_ITENS COM MARCADO_POR INVÁLIDO ===' as info;

SELECT 
    ci.id as checklist_item_id,
    ci.voo_id,
    ci.marcado_por,
    'marcado_por não existe em users' as problema
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  )
LIMIT 10;