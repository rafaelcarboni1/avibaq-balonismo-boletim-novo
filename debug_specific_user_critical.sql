-- DIAGNÓSTICO CRÍTICO: Verificar usuário logado específico
-- Execute este SQL para verificar o usuário que está dando erro

-- 1. Verificar todos os usuários logados nas últimas 2 horas
SELECT 
    'USUÁRIOS LOGADOS RECENTEMENTE' as info,
    au.id as auth_id,
    au.email as auth_email,
    au.last_sign_in_at,
    pu.id as users_table_id,
    pu.email as users_email,
    pu.role,
    pu.auth_id as users_auth_id_column,
    CASE 
        WHEN pu.auth_id = au.id THEN '✅ SINCRONIZADO'
        WHEN pu.auth_id IS NULL THEN '❌ AUTH_ID_NULL'
        WHEN pu.id IS NULL THEN '❌ USUÁRIO_ÓRFÃO'
        ELSE '⚠️ IDS_DIFERENTES'
    END as status_sync
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE au.last_sign_in_at > NOW() - INTERVAL '2 hours'
ORDER BY au.last_sign_in_at DESC;

-- 2. Verificar se há usuários com auth_id correto mas sem registro em public.users
SELECT 
    'USUÁRIOS ÓRFÃOS CRÍTICOS' as problema,
    au.id as auth_id,
    au.email,
    au.last_sign_in_at,
    'ESTE USUÁRIO CAUSARÁ ERRO DE FOREIGN KEY' as alerta
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.auth_id IS NULL 
  AND au.last_sign_in_at > NOW() - INTERVAL '2 hours';

-- 3. Testar inserção real para simular o erro
DO $$
DECLARE
    test_auth_id UUID;
    test_users_table_id UUID;
    test_email TEXT;
BEGIN
    -- Pegar o usuário mais recentemente logado
    SELECT au.id, pu.id, au.email
    INTO test_auth_id, test_users_table_id, test_email
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.auth_id = au.id
    WHERE au.last_sign_in_at > NOW() - INTERVAL '2 hours'
    ORDER BY au.last_sign_in_at DESC
    LIMIT 1;
    
    RAISE NOTICE '=== TESTE COM USUÁRIO REAL ===';
    RAISE NOTICE 'Email: %', test_email;
    RAISE NOTICE 'Auth ID: %', test_auth_id;
    RAISE NOTICE 'Users Table ID: %', test_users_table_id;
    
    IF test_users_table_id IS NULL THEN
        RAISE NOTICE '❌ PROBLEMA ENCONTRADO: users_table_id é NULL!';
        RAISE NOTICE '❌ Este usuário CAUSARÁ erro de foreign key!';
        RAISE NOTICE '❌ O hook useUser retornará users_table_id = null';
        
        -- Verificar se o usuário precisa ser sincronizado
        IF EXISTS (SELECT 1 FROM auth.users WHERE id = test_auth_id) THEN
            RAISE NOTICE '🔧 SOLUÇÃO: Executar sincronização para este usuário';
        END IF;
    ELSE
        RAISE NOTICE '✅ Users table ID existe: %', test_users_table_id;
        
        -- Testar inserção real em checklist_itens
        BEGIN
            INSERT INTO checklist_itens (
                id, voo_id, bloco, categoria, item_texto, 
                obrigatorio, marcado, marcado_em, marcado_por
            ) VALUES (
                gen_random_uuid(),
                '12345678-1234-1234-1234-123456789012',
                1, 'teste', 'Item de teste crítico',
                true, true, NOW(), test_users_table_id
            );
            
            RAISE NOTICE '✅ INSERÇÃO FUNCIONOU com users_table_id!';
            
            -- Limpar teste
            DELETE FROM checklist_itens 
            WHERE voo_id = '12345678-1234-1234-1234-123456789012';
            
        EXCEPTION
            WHEN foreign_key_violation THEN
                RAISE NOTICE '❌ ERRO FOREIGN KEY mesmo com users_table_id: %', SQLERRM;
            WHEN OTHERS THEN
                RAISE NOTICE '❌ OUTRO ERRO: %', SQLERRM;
        END;
    END IF;
    
END $$;

-- 4. Verificar se há problemas na função get_user_by_auth_id
SELECT 
    'TESTE DA FUNÇÃO get_user_by_auth_id' as info,
    au.id as input_auth_id,
    au.email as input_email,
    (SELECT COUNT(*) FROM get_user_by_auth_id(au.id)) as function_result_count
FROM auth.users au
WHERE au.last_sign_in_at > NOW() - INTERVAL '2 hours'
ORDER BY au.last_sign_in_at DESC
LIMIT 3;

SELECT '🔍 DIAGNÓSTICO CRÍTICO CONCLUÍDO' as status;