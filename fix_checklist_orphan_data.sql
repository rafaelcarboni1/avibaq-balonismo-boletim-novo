-- Script de correção para limpar dados órfãos na tabela checklist_itens
-- Este script resolve o erro: foreign key constraint "checklist_itens_marcado_por_fkey"

-- BACKUP: Criar uma tabela de backup antes das correções
CREATE TABLE IF NOT EXISTS checklist_itens_backup_20241225 AS 
SELECT * FROM checklist_itens;

-- 1. Limpar referências órfãs na coluna marcado_por
UPDATE checklist_itens 
SET marcado_por = NULL,
    updated_at = NOW()
WHERE marcado_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = marcado_por
  );

-- 2. Limpar referências órfãs na coluna created_by
UPDATE checklist_itens 
SET created_by = NULL,
    updated_at = NOW()
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = created_by
  );

-- 3. Limpar referências órfãs na coluna preenchido_por
UPDATE checklist_itens 
SET preenchido_por = NULL,
    updated_at = NOW()
WHERE preenchido_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = preenchido_por
  );

-- 4. Verificação final - deve retornar 0 para todas as colunas
SELECT 
    'Verificação pós-correção' as status,
    (
        SELECT COUNT(*) FROM checklist_itens ci
        WHERE ci.marcado_por IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.marcado_por)
    ) as marcado_por_orfaos,
    (
        SELECT COUNT(*) FROM checklist_itens ci
        WHERE ci.created_by IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.created_by)
    ) as created_by_orfaos,
    (
        SELECT COUNT(*) FROM checklist_itens ci
        WHERE ci.preenchido_por IS NOT NULL 
          AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.preenchido_por)
    ) as preenchido_por_orfaos;

-- 5. Estatísticas de correção
SELECT 
    'Estatísticas de correção' as info,
    COUNT(*) as total_registros,
    COUNT(marcado_por) as com_marcado_por,
    COUNT(created_by) as com_created_by,
    COUNT(preenchido_por) as com_preenchido_por
FROM checklist_itens;

-- 6. Recriar índices para melhor performance (se necessário)
CREATE INDEX IF NOT EXISTS idx_checklist_itens_marcado_por ON checklist_itens(marcado_por) WHERE marcado_por IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checklist_itens_created_by ON checklist_itens(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checklist_itens_preenchido_por ON checklist_itens(preenchido_por) WHERE preenchido_por IS NOT NULL;

-- 7. Verificar integridade das foreign keys
SELECT 
    'Teste de integridade' as teste,
    constraint_name,
    table_name,
    column_name
FROM information_schema.key_column_usage 
WHERE table_name = 'checklist_itens' 
  AND constraint_name LIKE '%_fkey'
ORDER BY constraint_name;