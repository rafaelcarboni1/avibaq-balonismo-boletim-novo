-- =====================================================================
-- CORREÇÃO EMERGENCIAL: Foreign Key Constraints do Checklist
-- Data: Janeiro 2025
-- Problema: Constraints rígidas causando erros no frontend
-- =====================================================================

-- DIAGNÓSTICO INICIAL
SELECT '=== DIAGNÓSTICO DOS PROBLEMAS IDENTIFICADOS ===' as info;

-- Verificar constraints atuais
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'checklist_itens'::regclass
    AND contype = 'f';

-- ETAPA 1: TORNAR FOREIGN KEYS OPCIONAIS
SELECT '=== REMOVENDO CONSTRAINTS RÍGIDAS ===' as info;

-- Remover constraints que estão causando problemas
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_created_by_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_marcado_por_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;

-- ETAPA 2: RECRIAR CONSTRAINTS COMO OPCIONAIS
SELECT '=== RECRIANDO CONSTRAINTS OPCIONAIS ===' as info;

-- Recriar constraints com ON DELETE SET NULL para torná-las opcionais
ALTER TABLE checklist_itens 
ADD CONSTRAINT checklist_itens_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES users(id) 
ON DELETE SET NULL;

ALTER TABLE checklist_itens 
ADD CONSTRAINT checklist_itens_marcado_por_fkey 
FOREIGN KEY (marcado_por) REFERENCES users(id) 
ON DELETE SET NULL;

ALTER TABLE checklist_itens 
ADD CONSTRAINT checklist_itens_preenchido_por_fkey 
FOREIGN KEY (preenchido_por) REFERENCES users(id) 
ON DELETE SET NULL;

-- ETAPA 3: VERIFICAR SE HÁ DADOS ÓRFÃOS
SELECT '=== VERIFICANDO DADOS ÓRFÃOS ===' as info;

-- Verificar registros com foreign keys inválidas
SELECT 
    'created_by órfãos' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci
LEFT JOIN users u ON ci.created_by = u.id
WHERE ci.created_by IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
    'marcado_por órfãos' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci
LEFT JOIN users u ON ci.marcado_por = u.id
WHERE ci.marcado_por IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
    'preenchido_por órfãos' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci
LEFT JOIN users u ON ci.preenchido_por = u.id
WHERE ci.preenchido_por IS NOT NULL AND u.id IS NULL;

-- ETAPA 4: LIMPAR DADOS ÓRFÃOS
SELECT '=== LIMPANDO DADOS ÓRFÃOS ===' as info;

-- Definir como NULL os foreign keys órfãos
UPDATE checklist_itens 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
    AND created_by NOT IN (SELECT id FROM users);

UPDATE checklist_itens 
SET marcado_por = NULL 
WHERE marcado_por IS NOT NULL 
    AND marcado_por NOT IN (SELECT id FROM users);

UPDATE checklist_itens 
SET preenchido_por = NULL 
WHERE preenchido_por IS NOT NULL 
    AND preenchido_por NOT IN (SELECT id FROM users);

-- ETAPA 5: VERIFICAÇÃO FINAL
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

-- Verificar se as constraints foram recriadas corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'checklist_itens'::regclass
    AND contype = 'f'
    AND conname LIKE '%_fkey';

-- Contar registros válidos
SELECT 
    COUNT(*) as total_registros,
    COUNT(created_by) as com_created_by,
    COUNT(marcado_por) as com_marcado_por,
    COUNT(preenchido_por) as com_preenchido_por
FROM checklist_itens;

-- ETAPA 6: TESTE DE INSERÇÃO
SELECT '=== TESTE DE INSERÇÃO ===' as info;

-- Testar inserção com foreign keys NULL (deve funcionar)
DO $$
DECLARE
    test_voo_id UUID;
    test_item_id UUID;
BEGIN
    -- Buscar um voo existente para teste
    SELECT id INTO test_voo_id FROM voos LIMIT 1;
    
    IF test_voo_id IS NOT NULL THEN
        -- Inserir item de teste com foreign keys NULL
        INSERT INTO checklist_itens (
            voo_id, bloco, item_numero, item_descricao, 
            marcado, created_by, marcado_por, preenchido_por
        ) VALUES (
            test_voo_id, 1, 999, 'TESTE - Item de diagnóstico', 
            false, NULL, NULL, NULL
        ) RETURNING id INTO test_item_id;
        
        RAISE NOTICE 'SUCESSO: Item de teste inserido com ID %', test_item_id;
        
        -- Remover item de teste
        DELETE FROM checklist_itens WHERE id = test_item_id;
        RAISE NOTICE 'Item de teste removido com sucesso';
    ELSE
        RAISE NOTICE 'AVISO: Nenhum voo encontrado para teste';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERRO no teste: %', SQLERRM;
END;
$$;

-- COMENTÁRIOS FINAIS
COMMENT ON CONSTRAINT checklist_itens_created_by_fkey ON checklist_itens IS 
'Foreign key opcional para users - permite NULL quando usuário não pode ser determinado';

COMMENT ON CONSTRAINT checklist_itens_marcado_por_fkey ON checklist_itens IS 
'Foreign key opcional para users - permite NULL quando usuário não pode ser determinado';

COMMENT ON CONSTRAINT checklist_itens_preenchido_por_fkey ON checklist_itens IS 
'Foreign key opcional para users - permite NULL quando usuário não pode ser determinado';

SELECT '=== CORREÇÃO CONCLUÍDA ===' as info;
SELECT 'Foreign keys tornadas opcionais com ON DELETE SET NULL' as resultado;
SELECT 'Dados órfãos limpos' as resultado;
SELECT 'Sistema deve funcionar sem erros de constraint' as resultado;