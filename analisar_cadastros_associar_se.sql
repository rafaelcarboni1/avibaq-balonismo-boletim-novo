-- Script para analisar usuários cadastrados via /associar-se
-- Identifica inconsistências e problemas no fluxo de cadastro

-- 1. Verificar usuários em auth.users que não têm correspondente em public.users
SELECT 
    '=== USUÁRIOS ÓRFÃOS EM AUTH.USERS ===' as info;

SELECT 
    au.id as auth_id,
    au.email,
    au.created_at as auth_created_at,
    au.last_sign_in_at,
    au.raw_user_meta_data->>'nome' as nome_metadata,
    au.raw_user_meta_data->>'role' as role_metadata,
    au.raw_user_meta_data->>'username' as username_metadata,
    CASE 
        WHEN au.last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'ATIVO'
        WHEN au.last_sign_in_at IS NOT NULL THEN 'INATIVO'
        ELSE 'NUNCA_LOGOU'
    END as status_atividade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL
  AND au.raw_user_meta_data->>'role' IN ('piloto', 'agencia')
ORDER BY au.created_at DESC;

-- 2. Verificar usuários em public.users sem auth_id (problema inverso)
SELECT 
    '=== USUÁRIOS SEM AUTH_ID EM PUBLIC.USERS ===' as info;

SELECT 
    pu.id,
    pu.email,
    pu.nome,
    pu.role,
    pu.created_at,
    pu.auth_id
FROM public.users pu
WHERE pu.auth_id IS NULL
  AND pu.role IN ('piloto', 'agencia')
ORDER BY pu.created_at DESC;

-- 3. Verificar usuários com auth_id inválido (não existe em auth.users)
SELECT 
    '=== USUÁRIOS COM AUTH_ID INVÁLIDO ===' as info;

SELECT 
    pu.id,
    pu.email,
    pu.nome,
    pu.role,
    pu.auth_id,
    pu.created_at
FROM public.users pu
LEFT JOIN auth.users au ON au.id = pu.auth_id
WHERE pu.auth_id IS NOT NULL
  AND au.id IS NULL
  AND pu.role IN ('piloto', 'agencia')
ORDER BY pu.created_at DESC;

-- 4. Verificar membros órfãos (sem user_id válido)
SELECT 
    '=== MEMBROS ÓRFÃOS (SEM USER_ID VÁLIDO) ===' as info;

SELECT 
    m.id as membro_id,
    m.email,
    m.nome_completo,
    m.tipo,
    m.user_id,
    m.created_at,
    CASE 
        WHEN m.user_id IS NULL THEN 'SEM_USER_ID'
        WHEN pu.id IS NULL THEN 'USER_ID_INVALIDO'
        ELSE 'OK'
    END as status_user_id
FROM membros m
LEFT JOIN public.users pu ON pu.id = m.user_id
WHERE m.user_id IS NULL OR pu.id IS NULL
ORDER BY m.created_at DESC;

-- 5. Verificar inconsistências de email entre membros e users
SELECT 
    '=== INCONSISTÊNCIAS DE EMAIL ENTRE MEMBROS E USERS ===' as info;

SELECT 
    m.id as membro_id,
    m.email as membro_email,
    pu.email as user_email,
    m.nome_completo as membro_nome,
    pu.nome as user_nome,
    m.tipo as membro_tipo,
    pu.role as user_role,
    m.created_at as membro_created_at,
    pu.created_at as user_created_at
FROM membros m
INNER JOIN public.users pu ON pu.id = m.user_id
WHERE m.email != pu.email
ORDER BY m.created_at DESC;

-- 6. Verificar usuários recém-cadastrados (últimas 24 horas)
SELECT 
    '=== USUÁRIOS CADASTRADOS NAS ÚLTIMAS 24H ===' as info;

SELECT 
    au.id as auth_id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    pu.id as user_id,
    pu.email as user_email,
    pu.nome as user_nome,
    pu.role as user_role,
    pu.created_at as user_created_at,
    m.id as membro_id,
    m.nome_completo as membro_nome,
    m.tipo as membro_tipo,
    m.created_at as membro_created_at,
    CASE 
        WHEN pu.id IS NULL THEN 'ÓRFÃO_AUTH'
        WHEN m.id IS NULL THEN 'SEM_MEMBRO'
        ELSE 'COMPLETO'
    END as status_cadastro
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
LEFT JOIN membros m ON m.user_id = pu.id
WHERE au.created_at >= NOW() - INTERVAL '24 hours'
  AND (au.raw_user_meta_data->>'role' IN ('piloto', 'agencia') OR pu.role IN ('piloto', 'agencia'))
ORDER BY au.created_at DESC;

-- 7. Estatísticas do fluxo de cadastro
SELECT 
    '=== ESTATÍSTICAS DO FLUXO DE CADASTRO ===' as info;

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
    'Usuários órfãos (auth sem public)' as categoria,
    COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL
  AND au.raw_user_meta_data->>'role' IN ('piloto', 'agencia')
UNION ALL
SELECT 
    'Usuários sem auth_id' as categoria,
    COUNT(*) as quantidade
FROM public.users pu
WHERE pu.auth_id IS NULL
  AND pu.role IN ('piloto', 'agencia')
UNION ALL
SELECT 
    'Membros órfãos' as categoria,
    COUNT(*) as quantidade
FROM membros m
LEFT JOIN public.users pu ON pu.id = m.user_id
WHERE pu.id IS NULL;

-- 8. Verificar checklist_itens com marcado_por inválido
SELECT 
    '=== CHECKLIST ITENS COM MARCADO_POR INVÁLIDO ===' as info;

SELECT 
    ci.id as checklist_item_id,
    ci.marcado_por,
    ci.marcado_em,
    ci.voo_id,
    v.data_voo,
    v.local_decolagem_previsto
FROM checklist_itens ci
LEFT JOIN users u ON u.id = ci.marcado_por
LEFT JOIN voos v ON v.id = ci.voo_id
WHERE ci.marcado_por IS NOT NULL
  AND u.id IS NULL
ORDER BY ci.marcado_em DESC
LIMIT 10;

-- 9. Verificar padrão de criação de usuários (para identificar possível race condition)
SELECT 
    '=== PADRÃO DE CRIAÇÃO DE USUÁRIOS (ÚLTIMOS 10) ===' as info;

SELECT 
    au.email,
    au.created_at as auth_created,
    pu.created_at as user_created,
    EXTRACT(EPOCH FROM (pu.created_at - au.created_at)) as diferenca_segundos,
    CASE 
        WHEN pu.created_at IS NULL THEN 'ÓRFÃO'
        WHEN EXTRACT(EPOCH FROM (pu.created_at - au.created_at)) > 10 THEN 'DELAY_ALTO'
        WHEN EXTRACT(EPOCH FROM (pu.created_at - au.created_at)) > 2 THEN 'DELAY_NORMAL'
        ELSE 'RÁPIDO'
    END as status_criacao
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE au.raw_user_meta_data->>'role' IN ('piloto', 'agencia')
ORDER BY au.created_at DESC
LIMIT 10;