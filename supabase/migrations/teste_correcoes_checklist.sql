-- 🧪 Teste das Correções do Sistema de Checklist
-- Data: 2025-01-24
-- Objetivo: Validar se as correções resolveram os problemas

-- 1. VERIFICAR SE NÃO HÁ MAIS DADOS ÓRFÃOS
SELECT 'Verificação de dados órfãos após correção:' as teste;

SELECT 
    'marcado_por' as campo,
    COUNT(*) as total_orfaos
FROM checklist_itens ci
LEFT JOIN users u ON ci.marcado_por = u.id
WHERE ci.marcado_por IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
    'created_by' as campo,
    COUNT(*) as total_orfaos
FROM checklist_itens ci
LEFT JOIN users u ON ci.created_by = u.id
WHERE ci.created_by IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
    'preenchido_por' as campo,
    COUNT(*) as total_orfaos
FROM checklist_itens ci
LEFT JOIN users u ON ci.preenchido_por = u.id
WHERE ci.preenchido_por IS NOT NULL AND u.id IS NULL;

-- 2. VERIFICAR ESTRUTURA DA TABELA
SELECT 'Estrutura da tabela checklist_itens:' as teste;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR SE COLUNA item_descricao EXISTE E TEM DADOS
SELECT 'Verificação da coluna item_descricao:' as teste;
SELECT 
    COUNT(*) as total_itens,
    COUNT(item_descricao) as itens_com_descricao,
    COUNT(CASE WHEN item_descricao IS NOT NULL AND LENGTH(item_descricao) > 0 THEN 1 END) as descricoes_preenchidas
FROM checklist_itens;

-- 4. AMOSTRA DE DADOS PARA VERIFICAR TÍTULOS
SELECT 'Amostra de itens do checklist (primeiros 5):' as teste;
SELECT 
    id,
    bloco,
    item_numero,
    LEFT(item_descricao, 50) || '...' as item_descricao_preview,
    marcado,
    motivo_nao_marcado
FROM checklist_itens 
ORDER BY bloco, item_numero 
LIMIT 5;

-- 5. TESTE DE INSERÇÃO SIMULADA (sem executar)
SELECT 'Teste de inserção - estrutura esperada:' as teste;
SELECT 
    'voo_id' as campo, 'uuid' as tipo, 'Referência ao voo' as descricao
UNION ALL
SELECT 
    'bloco' as campo, 'integer' as tipo, 'Número do bloco (1, 2 ou 3)' as descricao
UNION ALL
SELECT 
    'item_numero' as campo, 'integer' as tipo, 'Número sequencial do item' as descricao
UNION ALL
SELECT 
    'item_descricao' as campo, 'text' as tipo, 'Descrição do item do checklist' as descricao
UNION ALL
SELECT 
    'marcado' as campo, 'boolean' as tipo, 'Se o item foi marcado como concluído' as descricao
UNION ALL
SELECT 
    'motivo_nao_marcado' as campo, 'text' as tipo, 'Motivo quando não marcado (opcional)' as descricao
UNION ALL
SELECT 
    'marcado_por' as campo, 'uuid' as tipo, 'ID do usuário que marcou (opcional)' as descricao;

-- 6. VERIFICAR FOREIGN KEYS
SELECT 'Foreign keys da tabela checklist_itens:' as teste;
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'checklist_itens';

SELECT '✅ Teste de correções concluído!' as resultado;