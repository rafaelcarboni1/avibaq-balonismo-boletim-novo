-- =====================================================================
-- DIAGNÓSTICO COMPLETO DAS FOREIGN KEYS DO CHECKLIST
-- Data: Janeiro 2025
-- Objetivo: Identificar problemas com constraints e foreign keys
-- =====================================================================

-- ETAPA 1: VERIFICAR ESTRUTURA ATUAL DA TABELA
SELECT 
    '=== ESTRUTURA DA TABELA CHECKLIST_ITENS ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
ORDER BY ordinal_position;

-- ETAPA 2: VERIFICAR FOREIGN KEY CONSTRAINTS
SELECT 
    '=== FOREIGN KEY CONSTRAINTS ===' as info;

SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'checklist_itens';

-- ETAPA 3: VERIFICAR SE EXISTEM USUÁRIOS VÁLIDOS
SELECT 
    '=== USUÁRIOS DISPONÍVEIS PARA TESTE ===' as info;

SELECT 
    id,
    email,
    nome,
    auth_id
FROM users 
LIMIT 5;

-- ETAPA 4: VERIFICAR VOOS DISPONÍVEIS
SELECT 
    '=== VOOS DISPONÍVEIS PARA TESTE ===' as info;

SELECT 
    id,
    piloto_id,
    status,
    created_at
FROM voos 
LIMIT 5;

-- ETAPA 5: TESTE DE INSERÇÃO COM FOREIGN KEYS VÁLIDOS
DO $$
DECLARE
    test_user_id UUID;
    test_voo_id UUID;
    test_item_id UUID;
BEGIN
    -- Buscar um usuário válido
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    -- Buscar um voo válido
    SELECT id INTO test_voo_id FROM voos LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '❌ ERRO: Nenhum usuário encontrado para teste';
        RETURN;
    END IF;
    
    IF test_voo_id IS NULL THEN
        RAISE NOTICE '❌ ERRO: Nenhum voo encontrado para teste';
        RETURN;
    END IF;
    
    RAISE NOTICE '=== TESTE DE INSERÇÃO ===';
    RAISE NOTICE 'Usuário de teste: %', test_user_id;
    RAISE NOTICE 'Voo de teste: %', test_voo_id;
    
    -- Tentar inserir item de teste
    BEGIN
        INSERT INTO checklist_itens (
            voo_id, 
            bloco, 
            item_numero, 
            descricao, 
            marcado, 
            motivo_nao_marcado,
            marcado_em,
            marcado_por,
            created_by,
            preenchido_por
        ) VALUES (
            test_voo_id,
            1,
            999,
            'TESTE - Item de diagnóstico',
            false,
            'Teste de foreign key',
            NOW(),
            test_user_id,
            test_user_id,
            test_user_id
        ) RETURNING id INTO test_item_id;
        
        RAISE NOTICE '✅ INSERÇÃO FUNCIONOU! Item ID: %', test_item_id;
        
        -- Teste de atualização
        UPDATE checklist_itens 
        SET 
            marcado = true,
            marcado_em = NOW(),
            marcado_por = test_user_id,
            motivo_nao_marcado = NULL
        WHERE id = test_item_id;
        
        RAISE NOTICE '✅ ATUALIZAÇÃO FUNCIONOU!';
        
        -- Limpar teste
        DELETE FROM checklist_itens WHERE id = test_item_id;
        RAISE NOTICE '✅ LIMPEZA CONCLUÍDA';
        
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE '❌ ERRO DE FOREIGN KEY: %', SQLERRM;
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERRO GERAL: %', SQLERRM;
    END;
END $$;

-- ETAPA 6: TESTE COM FOREIGN KEYS INVÁLIDOS
DO $$
DECLARE
    test_voo_id UUID;
    invalid_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    SELECT id INTO test_voo_id FROM voos LIMIT 1;
    
    IF test_voo_id IS NULL THEN
        RAISE NOTICE '❌ Nenhum voo para teste de FK inválida';
        RETURN;
    END IF;
    
    RAISE NOTICE '=== TESTE COM FOREIGN KEY INVÁLIDA ===';
    
    BEGIN
        INSERT INTO checklist_itens (
            voo_id, 
            bloco, 
            item_numero, 
            descricao, 
            marcado, 
            marcado_por
        ) VALUES (
            test_voo_id,
            1,
            998,
            'TESTE - FK Inválida',
            false,
            invalid_user_id
        );
        
        RAISE NOTICE '⚠️ INESPERADO: Inserção com FK inválida funcionou!';
        
    EXCEPTION
        WHEN foreign_key_violation THEN
            RAISE NOTICE '✅ ESPERADO: Foreign key inválida rejeitada - %', SQLERRM;
        WHEN OTHERS THEN
            RAISE NOTICE '❌ ERRO INESPERADO: %', SQLERRM;
    END;
END $$;

-- ETAPA 7: VERIFICAR DADOS EXISTENTES COM PROBLEMAS
SELECT 
    '=== ITENS COM FOREIGN KEYS PROBLEMÁTICAS ===' as info;

SELECT 
    ci.id,
    ci.voo_id,
    ci.marcado_por,
    ci.created_by,
    ci.preenchido_por,
    u1.email as marcado_por_email,
    u2.email as created_by_email,
    u3.email as preenchido_por_email
FROM checklist_itens ci
LEFT JOIN users u1 ON ci.marcado_por = u1.id
LEFT JOIN users u2 ON ci.created_by = u2.id
LEFT JOIN users u3 ON ci.preenchido_por = u3.id
WHERE 
    (ci.marcado_por IS NOT NULL AND u1.id IS NULL) OR
    (ci.created_by IS NOT NULL AND u2.id IS NULL) OR
    (ci.preenchido_por IS NOT NULL AND u3.id IS NULL)
LIMIT 10;

-- ETAPA 8: VERIFICAR PERMISSÕES RLS
SELECT 
    '=== POLÍTICAS RLS ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'checklist_itens';

SELECT '🎯 DIAGNÓSTICO CONCLUÍDO!' as status;