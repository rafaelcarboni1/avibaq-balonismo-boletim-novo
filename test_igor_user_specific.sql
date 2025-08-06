-- Script para testar especificamente o usuário igor_pk_@hotmail.com
-- Data: Janeiro 2025
-- Problema: Usuário não consegue acessar checklist devido a foreign key constraint

-- =====================================================================
-- TESTE ESPECÍFICO DO USUÁRIO IGOR
-- =====================================================================

-- 1. Verificar se o usuário existe em auth.users
SELECT 
    '=== USUÁRIO EM AUTH.USERS ===' as teste;

SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    'Existe em auth.users' as status
FROM auth.users 
WHERE email = 'igor_pk_@hotmail.com';

-- 2. Verificar se o usuário existe em public.users
SELECT 
    '=== USUÁRIO EM PUBLIC.USERS ===' as teste;

SELECT 
    id,
    email,
    auth_id,
    role,
    nome,
    created_at,
    'Existe em public.users' as status
FROM users 
WHERE email = 'igor_pk_@hotmail.com';

-- 3. Verificar se há inconsistência entre as tabelas
SELECT 
    '=== VERIFICAR SINCRONIZAÇÃO ===' as teste;

SELECT 
    au.id as auth_id,
    au.email as auth_email,
    u.id as users_id,
    u.email as users_email,
    u.auth_id as users_auth_id,
    CASE 
        WHEN u.auth_id = au.id THEN '✅ Sincronizado'
        WHEN u.auth_id IS NULL THEN '⚠️ auth_id NULL em users'
        ELSE '❌ Dessincronizado'
    END as status_sync
FROM auth.users au
LEFT JOIN users u ON u.email = au.email
WHERE au.email = 'igor_pk_@hotmail.com';

-- 4. Testar a função RPC get_current_user_table_id
-- (Nota: Esta função só funciona com usuário autenticado, então simularemos)
SELECT 
    '=== SIMULAR FUNÇÃO RPC ===' as teste;

-- Simular o que a função RPC faria para este usuário
WITH user_simulation AS (
    SELECT id as simulated_auth_uid FROM auth.users WHERE email = 'igor_pk_@hotmail.com'
)
SELECT 
    us.simulated_auth_uid,
    au.email as auth_email,
    u.id as users_table_id,
    u.email as users_email,
    CASE 
        WHEN u.id IS NOT NULL THEN '✅ RPC retornaria ID válido'
        ELSE '❌ RPC retornaria NULL'
    END as rpc_result
FROM user_simulation us
JOIN auth.users au ON au.id = us.simulated_auth_uid
LEFT JOIN users u ON u.email = au.email;

-- 5. Verificar se há itens de checklist órfãos para este usuário
SELECT 
    '=== ITENS CHECKLIST ÓRFÃOS ===' as teste;

-- Buscar itens onde marcado_por aponta para um ID que não existe
SELECT 
    ci.id as item_id,
    ci.voo_id,
    ci.marcado_por,
    ci.item_descricao,
    'Órfão - marcado_por inválido' as problema
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  )
  AND ci.marcado_por::text LIKE '%f36990a5-192f-41dc-aa95-8720d9122071%'
LIMIT 5;

-- 6. Verificar se o ID do usuário Igor está sendo usado incorretamente
SELECT 
    '=== VERIFICAR USO INCORRETO DO ID ===' as teste;

-- Buscar se o auth_id está sendo usado como foreign key
SELECT 
    ci.id as item_id,
    ci.marcado_por,
    au.email as auth_email,
    'Auth ID usado como foreign key (ERRO!)' as problema
FROM checklist_itens ci
JOIN auth.users au ON au.id::text = ci.marcado_por::text
WHERE au.email = 'igor_pk_@hotmail.com'
LIMIT 5;

-- 7. Verificar a solução correta
SELECT 
    '=== SOLUÇÃO CORRETA ===' as teste;

SELECT 
    au.id as auth_id,
    au.email,
    u.id as correct_users_table_id,
    'Este é o ID correto para usar como foreign key' as solucao
FROM auth.users au
JOIN users u ON u.email = au.email
WHERE au.email = 'igor_pk_@hotmail.com';

-- 8. Contar problemas relacionados a este usuário
SELECT 
    '=== RESUMO DE PROBLEMAS ===' as teste;

SELECT 
    'Itens com marcado_por órfão' as problema,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  )
UNION ALL
SELECT 
    'Itens com created_by órfão' as problema,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.created_by IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.created_by
  )
UNION ALL
SELECT 
    'Itens com preenchido_por órfão' as problema,
    COUNT(*) as quantidade
FROM checklist_itens ci
WHERE ci.preenchido_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.preenchido_por
  );

-- =====================================================================
-- DIAGNÓSTICO FINAL
-- =====================================================================

SELECT 
    '=== DIAGNÓSTICO FINAL ===' as resultado;

SELECT 
    'O problema provavelmente é:' as diagnostico,
    'Auth ID sendo usado como foreign key em vez do users.id' as causa_provavel
UNION ALL
SELECT 
    'Solução necessária:' as diagnostico,
    'Limpar dados órfãos e usar users.id correto' as acao_necessaria;