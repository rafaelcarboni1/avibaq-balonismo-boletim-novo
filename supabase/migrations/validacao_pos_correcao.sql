-- =====================================================================
-- SCRIPT DE VALIDAÇÃO PÓS-CORREÇÃO
-- =====================================================================

-- 1. Verificar estrutura da tabela
SELECT 
    '1. ESTRUTURA DA TABELA' as teste,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
ORDER BY ordinal_position;

-- 2. Verificar constraints
SELECT 
    '2. FOREIGN KEY CONSTRAINTS' as teste,
    constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM information_schema.key_column_usage kcu
JOIN information_schema.referential_constraints rc 
    ON kcu.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage kcu2 
    ON rc.unique_constraint_name = kcu2.constraint_name
WHERE kcu.table_name = 'checklist_itens'
AND kcu.column_name IN ('marcado_por', 'preenchido_por');

-- 3. Testar inserção de item
DO $$
DECLARE
    test_voo_id UUID := gen_random_uuid();
    test_user_id UUID;
BEGIN
    -- Buscar um usuário existente para teste
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '3. TESTE DE INSERÇÃO: ❌ Nenhum usuário encontrado para teste';
        RETURN;
    END IF;
    
    -- Tentar inserir item de teste
    INSERT INTO checklist_itens (
        voo_id, bloco, item_numero, item_descricao, 
        marcado, motivo_nao_marcado, marcado_por
    ) VALUES (
        test_voo_id, 'bloco1', 999, 'TESTE - Item de validação', 
        false, 'Teste de validação', test_user_id
    );
    
    RAISE NOTICE '3. TESTE DE INSERÇÃO: ✅ Sucesso com user_id %', test_user_id;
    
    -- Limpar teste
    DELETE FROM checklist_itens WHERE item_numero = 999 AND item_descricao LIKE 'TESTE%';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '3. TESTE DE INSERÇÃO: ❌ Erro: %', SQLERRM;
END $$;

-- 4. Verificar dados existentes
SELECT 
    '4. DADOS EXISTENTES' as teste,
    COUNT(*) as total_itens,
    COUNT(CASE WHEN marcado_por IS NOT NULL THEN 1 END) as com_marcado_por,
    COUNT(CASE WHEN marcado_em IS NOT NULL THEN 1 END) as com_marcado_em,
    COUNT(CASE WHEN marcado = true THEN 1 END) as marcados
FROM checklist_itens;

SELECT '🎉 VALIDAÇÃO CONCLUÍDA!' as status;