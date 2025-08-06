-- Script para corrigir usuários órfãos (existem no auth.users mas não em public.users)
-- Este script resolve o problema de users_table_id null no frontend

-- BACKUP: Criar backup da tabela users antes das alterações
CREATE TABLE IF NOT EXISTS users_backup_20241225 AS 
SELECT * FROM users;

-- 1. Identificar usuários órfãos que precisam ser corrigidos
SELECT 
    '=== USUÁRIOS QUE SERÃO CRIADOS EM PUBLIC.USERS ===' as info;

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

-- 2. Inserir usuários órfãos na tabela public.users
-- Definir role baseado no email (heurística simples)
INSERT INTO public.users (
    auth_id,
    email,
    nome,
    role,
    ativo,
    created_at,
    updated_at
)
SELECT 
    au.id as auth_id,
    au.email,
    COALESCE(
        SPLIT_PART(au.email, '@', 1), -- Usar parte antes do @ como nome
        'Usuário'
    ) as nome,
    CASE 
        WHEN au.email ILIKE '%admin%' THEN 'admin'
        WHEN au.email ILIKE '%piloto%' THEN 'piloto'
        WHEN au.email ILIKE '%agencia%' THEN 'agencia'
        ELSE 'piloto' -- Default para piloto
    END as role,
    CASE 
        WHEN au.last_sign_in_at > NOW() - INTERVAL '30 days' THEN true
        ELSE false
    END as ativo,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL;

-- 3. Verificar quantos usuários foram criados
SELECT 
    '=== RESULTADO DA CORREÇÃO ===' as info;

SELECT 
    'Usuários criados' as acao,
    COUNT(*) as quantidade
FROM public.users pu
INNER JOIN auth.users au ON au.id = pu.auth_id
WHERE pu.created_at >= NOW() - INTERVAL '1 minute';

-- 4. Verificar se ainda há usuários órfãos
SELECT 
    'Usuários órfãos restantes' as status,
    COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL;

-- 5. Verificar integridade final
SELECT 
    '=== VERIFICAÇÃO FINAL DE INTEGRIDADE ===' as info;

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
INNER JOIN auth.users au ON au.id = pu.auth_id;

-- 6. Listar usuários recém-criados para verificação
SELECT 
    '=== USUÁRIOS RECÉM-CRIADOS (ÚLTIMOS 5 MINUTOS) ===' as info;

SELECT 
    pu.id,
    pu.auth_id,
    pu.email,
    pu.nome,
    pu.role,
    pu.ativo,
    au.last_sign_in_at
FROM public.users pu
INNER JOIN auth.users au ON au.id = pu.auth_id
WHERE pu.created_at >= NOW() - INTERVAL '5 minutes'
ORDER BY pu.created_at DESC;

-- 7. Atualizar estatísticas da tabela
ANALYZE public.users;

-- 8. Comentário final
SELECT 
    '=== CORREÇÃO CONCLUÍDA ===' as status,
    'Usuários órfãos foram criados na tabela public.users' as resultado,
    'O erro de foreign key constraint deve estar resolvido' as expectativa;

-- 9. Verificar se há checklist_itens que ainda podem ter problemas
SELECT 
    '=== VERIFICAÇÃO DE CHECKLIST_ITENS ===' as info;

SELECT 
    COUNT(*) as itens_com_marcado_por_invalido
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  );

-- 10. Recriar índices se necessário
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role