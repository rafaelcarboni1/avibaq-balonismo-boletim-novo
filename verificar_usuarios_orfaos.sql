-- Script para verificar o resultado da correção de usuários órfãos
-- Executar após aplicar fix_orphan_auth_users.sql

-- 1. Verificar se ainda existem usuários órfãos
SELECT 
    '=== USUÁRIOS ÓRFÃOS RESTANTES ===' as info;

SELECT 
    au.id as auth_id,
    au.email,
    au.created_at,
    au.last_sign_in_at,
    CASE 
        WHEN au.last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'ATIVO'
        WHEN au.last_sign_in_at IS NOT NULL THEN 'INATIVO'
        ELSE 'NUNCA_LOGOU'
    END as status_atividade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL
ORDER BY au.last_sign_in_at DESC NULLS LAST;

-- 2. Contar usuários órfãos
SELECT 
    'Usuários órfãos restantes' as status,
    COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL;

-- 3. Verificar usuários recém-criados (últimos 10 minutos)
SELECT 
    '=== USUÁRIOS RECÉM-CRIADOS ===' as info;

SELECT 
    pu.id,
    pu.auth_id,
    pu.email,
    pu.nome,
    pu.role,
    pu.ativo,
    pu.created_at,
    au.last_sign_in_at
FROM public.users pu
INNER JOIN auth.users au ON au.id = pu.auth_id
WHERE pu.created_at >= NOW() - INTERVAL '10 minutes'
ORDER BY pu.created_at DESC;

-- 4. Estatísticas gerais
SELECT 
    '=== ESTATÍSTICAS GERAIS ===' as info;

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
    'Usuários sem auth_id' as tipo,
    COUNT(*) as quantidade
FROM public.users pu
WHERE pu.auth_id IS NULL;

-- 5. Verificar checklist_itens com problemas
SELECT 
    '=== CHECKLIST ITENS COM PROBLEMAS ===' as info;

SELECT 
    COUNT(*) as itens_com_marcado_por_invalido
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  );

-- 6. Listar usuários por role
SELECT 
    '=== USUÁRIOS POR ROLE ===' as info;

SELECT 
    role,
    COUNT(*) as quantidade,
    COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
    COUNT(CASE WHEN auth_id IS NOT NULL THEN 1 END) as com_auth_id
FROM public.users
GROUP BY role
ORDER BY quantidade DESC;

-- 7. Verificar usuários que se cadastraram via /associar-se
-- (assumindo que são pilotos com auth_id preenchido)
SELECT 
    '=== USUÁRIOS CADASTRADOS VIA /ASSOCIAR-SE ===' as info;

SELECT 
    pu.id,
    pu.email,
    pu.nome,
    pu.role,
    pu.ativo,
    pu.created_at,
    au.last_sign_in_at,
    CASE 
        WHEN m.id IS NOT NULL THEN 'SIM'
        ELSE 'NÃO'
    END as tem_registro_membro
FROM public.users pu
INNER JOIN auth.users au ON au.id = pu.auth_id
LEFT JOIN membros m ON m.user_id = pu.id
WHERE pu.role = 'piloto'
  AND pu.auth_id IS NOT NULL
ORDER BY pu.created_at DESC
LIMIT 20;