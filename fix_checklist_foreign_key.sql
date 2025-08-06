-- Script para identificar e corrigir dados órfãos na tabela checklist_itens
-- Erro: foreign key constraint "checklist_itens_marcado_por_fkey"

-- 1. Verificar dados órfãos na coluna marcado_por
SELECT 
    'marcado_por' as coluna,
    COUNT(*) as total_orfaos
FROM checklist_itens ci
WHERE ci.marcado_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.marcado_por
  );

-- 2. Verificar dados órfãos na coluna created_by
SELECT 
    'created_by' as coluna,
    COUNT(*) as total_orfaos
FROM checklist_itens ci
WHERE ci.created_by IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.created_by
  );

-- 3. Verificar dados órfãos na coluna preenchido_por
SELECT 
    'preenchido_por' as coluna,
    COUNT(*) as total_orfaos
FROM checklist_itens ci
WHERE ci.preenchido_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = ci.preenchido_por
  );

-- 4. Listar registros específicos com dados órfãos
SELECT 
    ci.id,
    ci.voo_id,
    ci.item_descricao,
    ci.marcado_por,
    ci.created_by,
    ci.preenchido_por,
    ci.created_at
FROM checklist_itens ci
WHERE (
    (ci.marcado_por IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.marcado_por))
    OR
    (ci.created_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.created_by))
    OR
    (ci.preenchido_por IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ci.preenchido_por))
)
ORDER BY ci.created_at DESC;

-- 5. Verificar se existem usuários válidos para usar como fallback
SELECT 
    id,
    email,
    nome,
    role,
    ativo
FROM users 
WHERE ativo = true 
  AND role IN ('admin', 'piloto')
ORDER BY created_at ASC
LIMIT 5;

-- CORREÇÕES (executar apenas após análise dos resultados acima)

-- 6. Limpar dados órfãos - definir como NULL as referências inválidas
-- CUIDADO: Execute apenas após confirmar que são dados órfãos
/*
UPDATE checklist_itens 
SET marcado_por = NULL
WHERE marcado_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = marcado_por
  );

UPDATE checklist_itens 
SET created_by = NULL
WHERE created_by IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = created_by
  );

UPDATE checklist_itens 
SET preenchido_por = NULL
WHERE preenchido_por IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = preenchido_por
  );
*/

-- 7. Verificação final - deve retornar 0 para todas as colunas
/*
SELECT 
    'Verificação final' as status,
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
*/