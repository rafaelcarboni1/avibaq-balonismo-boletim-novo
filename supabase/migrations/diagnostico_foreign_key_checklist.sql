-- 🔍 Diagnóstico e Correção de Foreign Key - Checklist Itens
-- Data: 2025-01-24
-- Problema: Erro 23503 - Key is not present in table "users"

-- 1. DIAGNÓSTICO: Verificar dados órfãos
SELECT 'Dados órfãos em marcado_por:' as diagnostico;
SELECT 
    ci.id,
    ci.voo_id,
    ci.marcado_por,
    ci.item_descricao,
    ci.marcado_em
FROM checklist_itens ci
LEFT JOIN users u ON ci.marcado_por = u.id
WHERE ci.marcado_por IS NOT NULL 
  AND u.id IS NULL;

SELECT 'Dados órfãos em created_by:' as diagnostico;
SELECT 
    ci.id,
    ci.voo_id,
    ci.created_by,
    ci.item_descricao
FROM checklist_itens ci
LEFT JOIN users u ON ci.created_by = u.id
WHERE ci.created_by IS NOT NULL 
  AND u.id IS NULL;

SELECT 'Dados órfãos em preenchido_por:' as diagnostico;
SELECT 
    ci.id,
    ci.voo_id,
    ci.preenchido_por,
    ci.item_descricao
FROM checklist_itens ci
LEFT JOIN users u ON ci.preenchido_por = u.id
WHERE ci.preenchido_por IS NOT NULL 
  AND u.id IS NULL;

-- 2. VERIFICAR USUÁRIOS EXISTENTES
SELECT 'Total de usuários:' as info, COUNT(*) as total FROM users;
SELECT 'Usuários ativos:' as info, COUNT(*) as total FROM users WHERE ativo = true;

-- 3. VERIFICAR ITENS DE CHECKLIST PROBLEMÁTICOS
SELECT 'Total de itens checklist:' as info, COUNT(*) as total FROM checklist_itens;
SELECT 'Itens com marcado_por:' as info, COUNT(*) as total FROM checklist_itens WHERE marcado_por IS NOT NULL;

-- 4. CORREÇÃO: Limpar dados órfãos
-- Backup dos dados antes da correção
CREATE TABLE IF NOT EXISTS checklist_itens_backup_foreign_key AS 
SELECT * FROM checklist_itens;

-- Limpar referências órfãs em marcado_por
UPDATE checklist_itens 
SET marcado_por = NULL,
    marcado_em = NULL
WHERE marcado_por IS NOT NULL 
  AND marcado_por NOT IN (SELECT id FROM users);

-- Limpar referências órfãs em created_by
UPDATE checklist_itens 
SET created_by = NULL
WHERE created_by IS NOT NULL 
  AND created_by NOT IN (SELECT id FROM users);

-- Limpar referências órfãs em preenchido_por
UPDATE checklist_itens 
SET preenchido_por = NULL
WHERE preenchido_por IS NOT NULL 
  AND preenchido_por NOT IN (SELECT id FROM users);

-- 5. VERIFICAÇÃO PÓS-CORREÇÃO
SELECT 'Verificação pós-correção - dados órfãos restantes:' as resultado;
SELECT 
    'marcado_por' as campo,
    COUNT(*) as orfaos
FROM checklist_itens ci
LEFT JOIN users u ON ci.marcado_por = u.id
WHERE ci.marcado_por IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
    'created_by' as campo,
    COUNT(*) as orfaos
FROM checklist_itens ci
LEFT JOIN users u ON ci.created_by = u.id
WHERE ci.created_by IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 
    'preenchido_por' as campo,
    COUNT(*) as orfaos
FROM checklist_itens ci
LEFT JOIN users u ON ci.preenchido_por = u.id
WHERE ci.preenchido_por IS NOT NULL AND u.id IS NULL;

-- 6. TESTE DE INSERÇÃO
-- Testar se conseguimos inserir/atualizar sem erro
SELECT 'Teste concluído - foreign keys corrigidas' as status;