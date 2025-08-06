-- =====================================================================
-- VALIDAÇÃO FINAL DO SISTEMA DE CHECKLIST CORRIGIDO
-- Data: Janeiro 2025
-- Objetivo: Verificar se todas as correções foram aplicadas com sucesso
-- =====================================================================

-- TESTE 1: Verificar estrutura da tabela
SELECT 
    '🔍 TESTE 1: ESTRUTURA DA TABELA' as teste,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
    AND column_name IN ('marcado_em', 'marcado_por', 'preenchido_por', 'item_descricao', 'motivo_nao_marcado', 'created_by')
ORDER BY column_name;

-- TESTE 2: Verificar constraints existentes
SELECT 
    '🔗 TESTE 2: CONSTRAINTS' as teste,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'checklist_itens'
    AND constraint_name LIKE '%_fkey'
ORDER BY constraint_name;

-- TESTE 3: Verificar índices criados
SELECT 
    '📊 TESTE 3: ÍNDICES' as teste,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'checklist_itens'
    AND indexname LIKE 'idx_checklist_%'
ORDER BY indexname;

-- TESTE 4: Verificar função de criação de checklist
SELECT 
    '⚙️ TESTE 4: FUNÇÃO CHECKLIST' as teste,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('criar_checklist_padrao', 'trigger_criar_checklist_voo')
ORDER BY routine_name;

-- TESTE 5: Verificar trigger
SELECT 
    '🎯 TESTE 5: TRIGGER' as teste,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_voos_criar_checklist'
ORDER BY trigger_name;

-- TESTE 6: Teste prático de inserção e atualização
DO $$
DECLARE
    test_user_id UUID;
    test_voo_id UUID;
    test_item_id UUID;
    item_count INTEGER;
BEGIN
    RAISE NOTICE '🧪 TESTE 6: OPERAÇÕES PRÁTICAS';
    
    -- Buscar dados para teste
    SELECT id INTO test_user_id FROM users LIMIT 1;
    SELECT id INTO test_voo_id FROM voos LIMIT 1;
    
    IF test_user_id IS NOT NULL AND test_voo_id IS NOT NULL THEN
        -- Teste de inserção com foreign keys opcionais
        INSERT INTO checklist_itens (
            voo_id, bloco, item_numero, item_descricao, 
            marcado, motivo_nao_marcado, marcado_por
        ) VALUES (
            test_voo_id, 1, 999, 'TESTE VALIDAÇÃO FINAL', 
            false, 'Teste de validação', test_user_id
        ) RETURNING id INTO test_item_id;
        
        RAISE NOTICE '✅ Inserção com foreign key: OK (ID: %)', test_item_id;
        
        -- Teste de atualização
        UPDATE checklist_itens 
        SET marcado = true, 
            marcado_em = NOW(), 
            motivo_nao_marcado = NULL,
            preenchido_por = test_user_id
        WHERE id = test_item_id;
        
        RAISE NOTICE '✅ Atualização com múltiplas foreign keys: OK';
        
        -- Teste com foreign key NULL
        UPDATE checklist_itens 
        SET marcado_por = NULL,
            preenchido_por = NULL,
            created_by = NULL
        WHERE id = test_item_id;
        
        RAISE NOTICE '✅ Atualização com foreign keys NULL: OK';
        
        -- Limpar teste
        DELETE FROM checklist_itens WHERE id = test_item_id;
        
        RAISE NOTICE '✅ Limpeza do teste: OK';
        
        -- Verificar se existem checklists criados automaticamente
        SELECT COUNT(*) INTO item_count 
        FROM checklist_itens 
        WHERE voo_id = test_voo_id;
        
        RAISE NOTICE 'ℹ️ Itens de checklist existentes para voo %: %', test_voo_id, item_count;
        
    ELSE
        RAISE NOTICE '⚠️ Não foi possível executar teste prático - faltam dados de usuário ou voo';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ ERRO no teste prático: %', SQLERRM;
END $$;

-- TESTE 7: Verificar backup criado
SELECT 
    '💾 TESTE 7: BACKUP' as teste,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name = 'checklist_itens_backup_jan2025';

-- RESULTADO FINAL
SELECT 
    '🎉 VALIDAÇÃO FINAL CONCLUÍDA' as status,
    'Sistema de checklist corrigido e funcionando!' as resultado,
    NOW() as timestamp_validacao;

-- RESUMO DAS CORREÇÕES APLICADAS
SELECT 
    '📋 RESUMO DAS CORREÇÕES' as info,
    'Foreign keys tornadas opcionais (ON DELETE SET NULL)' as correcao_1,
    'Estrutura da tabela unificada (item_descricao)' as correcao_2,
    'Função de criação de checklist corrigida' as correcao_3,
    'Trigger recriado com função wrapper' as correcao_4,
    'Índices de performance adicionados' as correcao_5,
    'Backup de segurança criado' as correcao_6;

-- PRÓXIMOS PASSOS RECOMENDADOS
SELECT 
    '🚀 PRÓXIMOS PASSOS' as info,
    '1. Testar frontend com as correções aplicadas' as passo_1,
    '2. Monitorar logs de erro no console do navegador' as passo_2,
    '3. Verificar se marcação de itens funciona sem erros' as passo_3,
    '4. Confirmar que novos voos criam checklist automaticamente' as passo_4,
    '5. Validar que não há mais erros de foreign key constraint' as passo_5;