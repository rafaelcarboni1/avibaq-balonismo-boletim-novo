-- Script para testar o fluxo do usuário Igor no checklist
-- Data: Janeiro 2025

-- 1. Verificar dados do usuário Igor
SELECT 'DADOS DO USUARIO IGOR' as teste;

SELECT 
    au.id as auth_id,
    au.email as auth_email,
    u.id as users_table_id,
    u.email as users_email,
    u.role,
    u.nome
FROM auth.users au
LEFT JOIN users u ON u.email = au.email
WHERE au.email = 'igor_pk_@hotmail.com';

-- 2. Testar função RPC simulada
SELECT 'TESTE FUNCAO RPC' as teste;

WITH igor_simulation AS (
    SELECT 
        au.id as auth_uid,
        u.id as expected_users_table_id
    FROM auth.users au
    LEFT JOIN users u ON u.email = au.email
    WHERE au.email = 'igor_pk_@hotmail.com'
)
SELECT 
    auth_uid,
    expected_users_table_id,
    CASE 
        WHEN expected_users_table_id IS NOT NULL THEN 'RPC OK'
        ELSE 'RPC RETORNARIA NULL'
    END as rpc_status
FROM igor_simulation;

-- 3. Verificar acesso a voos
SELECT 'ACESSO A VOOS' as teste;

SELECT 
    v.id as voo_id,
    v.data_voo,
    v.status as voo_status,
    m.email as membro_email
FROM voos v
JOIN membros m ON m.id = v.piloto_id
WHERE m.email = 'igor_pk_@hotmail.com'
ORDER BY v.data_voo DESC
LIMIT 3;

-- 4. Verificar itens órfãos
SELECT 'ITENS ORFAOS' as teste;

WITH igor_ids AS (
    SELECT 
        au.id as auth_id,
        u.id as users_table_id
    FROM auth.users au
    LEFT JOIN users u ON u.email = au.email
    WHERE au.email = 'igor_pk_@hotmail.com'
)
SELECT 
    ci.id as item_id,
    ci.marcado_por,
    ig.auth_id,
    ig.users_table_id,
    CASE 
        WHEN ci.marcado_por::text = ig.auth_id::text THEN 'USANDO AUTH_ID ERRO'
        WHEN ci.marcado_por = ig.users_table_id THEN 'USANDO USERS_TABLE_ID OK'
        ELSE 'OUTRO USUARIO'
    END as problema
FROM checklist_itens ci
CROSS JOIN igor_ids ig
WHERE ci.marcado_por IS NOT NULL
LIMIT 5;

-- 5. Diagnóstico final
SELECT 'DIAGNOSTICO FINAL' as teste;

SELECT 
    au.id as auth_id,
    u.id as users_table_id,
    m.id as membro_id,
    CASE 
        WHEN u.id IS NULL THEN 'CRITICO: Usuario nao existe em public.users'
        WHEN m.id IS NULL THEN 'PROBLEMA: Usuario nao e membro piloto'
        ELSE 'OK: Dados consistentes'
    END as status
FROM auth.users au
LEFT JOIN users u ON u.email = au.email
LEFT JOIN membros m ON m.email = au.email AND m.tipo = 'piloto'
WHERE au.email = 'igor_pk_@hotmail.com';