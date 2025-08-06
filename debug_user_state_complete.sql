-- DIAGNÓSTICO ULTRA-COMPLETO DO ESTADO DOS USUÁRIOS
-- Data: 1 de agosto de 2025
-- Objetivo: Investigar TODAS as possíveis causas do erro de foreign key

-- =====================================================================
-- FASE 1: VERIFICAR ESTADO ATUAL DOS USUÁRIOS
-- =====================================================================

-- 1.1 Mostrar todos os usuários logados recentemente com seus IDs
SELECT 
    'USUÁRIOS ATIVOS' as info,
    au.id as auth_id,
    au.email as auth_email,
    au.last_sign_in_at,
    pu.id as users_table_id,
    pu.email as users_email,
    pu.role,
    pu.auth_id as users_auth_id_column,
    CASE 
        WHEN pu.auth_id = au.id THEN '✅ IDs SINCRONIZADOS'
        WHEN pu.auth_id IS NULL THEN '❌ auth_id NULL'
        ELSE '⚠️ IDs DIFERENTES'
    END as status_sync
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE au.last_sign_in_at > NOW() - INTERVAL '24 hours'
ORDER BY au.last_sign_in_at DESC;

-- 1.2 Verificar usuários que podem ter problema de sincronização
SELECT 
    'PROBLEMAS DE SINCRONIZAÇÃO' as problema,
    COUNT(*) as quantidade,
    string_agg(DISTINCT au.email, ', ') as emails_problematicos
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.auth_id IS NULL 
  AND au.last_sign_in_at > NOW() - INTERVAL '24 hours';

-- =====================================================================
-- FASE 2: VERIFICAR TRIGGERS ATIVOS
-- =====================================================================

-- 2.1 Listar todos os triggers que podem estar usando auth.uid()
SELECT 
    'TRIGGERS ATIVOS' as info,
    t.trigger_name,
    t.event_manipulation,
    t.event_object_table,
    p.prosrc as trigger_function_source
FROM information_schema.triggers t
JOIN pg_proc p ON p.proname = t.trigger_name OR p.proname = REPLACE(t.trigger_name, '_trigger', '')
WHERE t.trigger_schema = 'public'
  AND (t.event_object_table LIKE '%checklist%' OR t.event_object_table = 'voos')
ORDER BY t.event_object_table, t.trigger_name;

-- 2.2 Verificar se há triggers que usam auth.uid() diretamente
SELECT 
    'TRIGGERS COM AUTH.UID()' as alerta,
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_definition ILIKE '%auth.uid()%'
  AND routine_name LIKE '%trigger%';

-- =====================================================================
-- FASE 3: TESTAR INSERÇÃO REAL EM CHECKLIST_ITENS
-- =====================================================================

-- 3.1 Simular exatamente o que o frontend está tentando fazer
DO $$
DECLARE
    test_user_record RECORD;
    test_voo_id UUID := '12345678-1234-1234-1234-123456789012'; -- ID fictício
    auth_id_atual UUID;
BEGIN
    RAISE NOTICE '=== TESTE DE INSERÇÃO REAL ===';
    
    -- Simular usuário logado (pegar o mais recente)
    SELECT au.id as auth_id, pu.id as users_table_id, au.email, pu.role
    INTO test_user_record
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.auth_id = au.id
    WHERE au.last_sign_in_at > NOW() - INTERVAL '24 hours'
    ORDER BY au.last_sign_in_at DESC
    LIMIT 1;
    
    IF test_user_record IS NULL THEN
        RAISE NOTICE '❌ NENHUM USUÁRIO LOGADO RECENTEMENTE ENCONTRADO';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testando com usuário: % (auth_id: %, users_table_id: %)', 
                 test_user_record.email, test_user_record.auth_id, test_user_record.users_table_id;
    
    -- Testar inserção exatamente como o frontend faz
    BEGIN
        INSERT INTO checklist_itens (
            id,
            voo_id,
            bloco,
            categoria,
            item_texto,
            obrigatorio,
            marcado,
            marcado_em,
            marcado_por  -- Esta é a coluna problemática
        ) VALUES (
            gen_random_uuid(),
            test_voo_id,
            1,
            'teste',
            'Item de teste para diagnóstico',
            true,
            true,
            NOW(),
            test_user_record.users_table_id  -- USANDO users_table_id como deveria
        );
        
        RAISE NOTICE '✅ INSERÇÃO FUNCIONOU com users_table_id: %', test_user_record.users_table_id;
        
        -- Limpar teste
        DELETE FROM checklist_itens WHERE voo_id = test_voo_id;
        RAISE NOTICE '🧹 Item de teste removido';
        
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE '❌ ERRO FOREIGN KEY: %', SQLERRM;
            RAISE NOTICE 'Detalhes: users_table_id usado = %, auth_id = %', 
                         test_user_record.users_table_id, test_user_record.auth_id;
            
            -- Verificar se o users_table_id realmente existe na tabela users
            IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_record.users_table_id) THEN
                RAISE NOTICE '✅ users_table_id EXISTE na tabela users';
            ELSE
                RAISE NOTICE '❌ users_table_id NÃO EXISTE na tabela users!';
            END IF;
            
        WHEN OTHERS THEN
            RAISE NOTICE '❌ OUTRO ERRO: %', SQLERRM;
    END;
    
END $$;

-- =====================================================================
-- FASE 4: VERIFICAR CONSTRAINTS E FOREIGN KEYS
-- =====================================================================

-- 4.1 Verificar todos os foreign keys da tabela checklist_itens
SELECT 
    'FOREIGN KEYS CHECKLIST_ITENS' as info,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'checklist_itens'
    AND tc.table_schema = 'public';

-- =====================================================================
-- FASE 5: DIAGNÓSTICO DA FUNÇÃO get_user_by_auth_id
-- =====================================================================

-- 5.1 Testar se a função get_user_by_auth_id funciona
DO $$
DECLARE
    test_auth_id UUID;
    result_record RECORD;
BEGIN
    -- Pegar um auth_id real para teste
    SELECT id INTO test_auth_id 
    FROM auth.users 
    WHERE last_sign_in_at > NOW() - INTERVAL '24 hours'
    ORDER BY last_sign_in_at DESC 
    LIMIT 1;
    
    IF test_auth_id IS NULL THEN
        RAISE NOTICE '❌ Nenhum auth_id para testar';
        RETURN;
    END IF;
    
    RAISE NOTICE '=== TESTE DA FUNÇÃO get_user_by_auth_id ===';
    RAISE NOTICE 'Testando com auth_id: %', test_auth_id;
    
    -- Testar a função
    SELECT * INTO result_record 
    FROM get_user_by_auth_id(test_auth_id) 
    LIMIT 1;
    
    IF result_record IS NULL THEN
        RAISE NOTICE '❌ FUNÇÃO get_user_by_auth_id NÃO RETORNOU DADOS';
    ELSE
        RAISE NOTICE '✅ FUNÇÃO FUNCIONOU - retornou ID: %', result_record.id;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO NA FUNÇÃO get_user_by_auth_id: %', SQLERRM;
END $$;

-- =====================================================================
-- RESUMO DO DIAGNÓSTICO
-- =====================================================================

SELECT '🔍 DIAGNÓSTICO ULTRA-COMPLETO EXECUTADO' as status,
       'Analise todos os resultados acima para identificar a causa raiz' as instrucao;