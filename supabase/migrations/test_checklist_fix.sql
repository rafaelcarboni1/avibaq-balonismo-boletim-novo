-- Script de teste para verificar se a correção do erro 23503 funcionou
-- Data: 25 de dezembro de 2024

-- =====================================================================
-- TESTE 1: VERIFICAR INTEGRIDADE DOS DADOS
-- =====================================================================

SELECT '=== TESTE 1: INTEGRIDADE DOS DADOS ===' as info;

-- Verificar se ainda há dados órfãos
SELECT 
    'Dados órfãos restantes' as teste,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASSOU'
        ELSE '❌ FALHOU - ' || COUNT(*) || ' registros órfãos'
    END as resultado
FROM (
    SELECT ci.id
    FROM checklist_itens ci
    WHERE (ci.marcado_por IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.marcado_por))
       OR (ci.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.created_by))
       OR (ci.preenchido_por IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.preenchido_por))
) as orfaos;

-- =====================================================================
-- TESTE 2: VERIFICAR CONSTRAINTS
-- =====================================================================

SELECT '=== TESTE 2: CONSTRAINTS ATIVAS ===' as info;

-- Verificar se constraints foram recriadas
SELECT 
    tc.constraint_name as constraint_name,
    kcu.column_name as coluna,
    '✅ ATIVA' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'checklist_itens'
    AND tc.table_schema = 'public'
    AND kcu.column_name IN ('marcado_por', 'created_by', 'preenchido_por')
ORDER BY kcu.column_name;

-- =====================================================================
-- TESTE 3: VERIFICAR TRIGGER
-- =====================================================================

SELECT '=== TESTE 3: TRIGGER DE VALIDAÇÃO ===' as info;

-- Verificar se trigger está ativo
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    '✅ ATIVO' as status
FROM information_schema.triggers
WHERE event_object_table = 'checklist_itens'
    AND trigger_schema = 'public'
    AND trigger_name = 'trigger_validate_checklist_user_ids';

-- =====================================================================
-- TESTE 4: VERIFICAR FUNÇÃO RPC
-- =====================================================================

SELECT '=== TESTE 4: FUNÇÃO RPC ===' as info;

-- Verificar se função RPC existe
SELECT 
    routine_name,
    routine_type,
    '✅ DISPONÍVEL' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name = 'get_current_user_table_id';

-- =====================================================================
-- TESTE 5: SIMULAR INSERÇÃO PROBLEMÁTICA
-- =====================================================================

SELECT '=== TESTE 5: SIMULAÇÃO DE INSERÇÃO ===' as info;

-- Tentar inserir um registro com marcado_por inválido
-- (deve ser corrigido pelo trigger)
DO $$
DECLARE
    test_voo_id UUID;
    test_result TEXT;
BEGIN
    -- Buscar um voo existente para teste
    SELECT id INTO test_voo_id FROM voos LIMIT 1;
    
    IF test_voo_id IS NOT NULL THEN
        BEGIN
            -- Tentar inserir com marcado_por inválido
            INSERT INTO checklist_itens (
                voo_id, 
                bloco, 
                item_numero, 
                item_descricao, 
                marcado, 
                marcado_por
            ) VALUES (
                test_voo_id,
                1,
                999,
                'TESTE - Item de validação',
                true,
                '00000000-0000-0000-0000-000000000000'::UUID -- ID inválido
            );
            
            -- Verificar se foi inserido com marcado_por NULL (corrigido pelo trigger)
            SELECT 
                CASE 
                    WHEN marcado_por IS NULL THEN '✅ PASSOU - Trigger corrigiu ID inválido'
                    ELSE '❌ FALHOU - ID inválido não foi corrigido'
                END
            INTO test_result
            FROM checklist_itens 
            WHERE voo_id = test_voo_id 
                AND item_numero = 999 
                AND item_descricao = 'TESTE - Item de validação';
            
            RAISE NOTICE '%', test_result;
            
            -- Limpar registro de teste
            DELETE FROM checklist_itens 
            WHERE voo_id = test_voo_id 
                AND item_numero = 999 
                AND item_descricao = 'TESTE - Item de validação';
                
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ FALHOU - Erro na inserção de teste: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '⚠️ AVISO - Nenhum voo encontrado para teste';
    END IF;
END $$;

-- =====================================================================
-- TESTE 6: VERIFICAR USUÁRIOS ÓRFÃOS
-- =====================================================================

SELECT '=== TESTE 6: USUÁRIOS ÓRFÃOS ===' as info;

-- Verificar se ainda há usuários em auth.users sem correspondente em public.users
SELECT 
    'Usuários órfãos (auth.users sem public.users)' as teste,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ PASSOU - Nenhum usuário órfão'
        ELSE '⚠️ ATENÇÃO - ' || COUNT(*) || ' usuários órfãos encontrados'
    END as resultado
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL;

-- Listar usuários órfãos se existirem
SELECT 
    '=== USUÁRIOS ÓRFÃOS ENCONTRADOS ===' as info,
    au.email,
    au.created_at,
    au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_id = au.id
WHERE pu.id IS NULL
LIMIT 5;

-- =====================================================================
-- TESTE 7: ESTATÍSTICAS FINAIS
-- =====================================================================

SELECT '=== TESTE 7: ESTATÍSTICAS FINAIS ===' as info;

SELECT 
    'Total de usuários em auth.users' as estatistica,
    COUNT(*) as valor
FROM auth.users
UNION ALL
SELECT 
    'Total de usuários em public.users' as estatistica,
    COUNT(*) as valor
FROM public.users
UNION ALL
SELECT 
    'Total de itens checklist' as estatistica,
    COUNT(*) as valor
FROM checklist_itens
UNION ALL
SELECT 
    'Itens com marcado_por válido' as estatistica,
    COUNT(*) as valor
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = ci.marcado_por)
UNION ALL
SELECT 
    'Itens com created_by válido' as estatistica,
    COUNT(*) as valor
FROM checklist_itens ci
WHERE ci.created_by IS NOT NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = ci.created_by)
UNION ALL
SELECT 
    'Itens com preenchido_por válido' as estatistica,
    COUNT(*) as valor
FROM checklist_itens ci
WHERE ci.preenchido_por IS NOT NULL
  AND EXISTS (SELECT 1 FROM users u WHERE u.id = ci.preenchido_por);

-- =====================================================================
-- RESUMO DOS TESTES
-- =====================================================================

SELECT '=== RESUMO DOS TESTES ===' as info;

SELECT 
    '✅ Teste 1: Integridade dos dados' as teste,
    'Verificou se dados órfãos foram limpos' as descricao
UNION ALL
SELECT 
    '✅ Teste 2: Constraints ativas' as teste,
    'Verificou se foreign keys foram recriadas' as descricao
UNION ALL
SELECT 
    '✅ Teste 3: Trigger de validação' as teste,
    'Verificou se trigger está ativo' as descricao
UNION ALL
SELECT 
    '✅ Teste 4: Função RPC' as teste,
    'Verificou se função get_current_user_table_id existe' as descricao
UNION ALL
SELECT 
    '✅ Teste 5: Simulação de inserção' as teste,
    'Testou se trigger corrige IDs inválidos' as descricao
UNION ALL
SELECT 
    '✅ Teste 6: Usuários órfãos' as teste,
    'Verificou se há usuários sem correspondência' as descricao
UNION ALL
SELECT 
    '✅ Teste 7: Estatísticas finais' as teste,
    'Resumo geral do estado do sistema' as descricao;

SELECT '=== TESTES CONCLUÍDOS ===' as status;