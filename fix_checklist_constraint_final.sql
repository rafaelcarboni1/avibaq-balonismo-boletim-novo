-- Fix final para resolver problema da constraint do checklist
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover a constraint problemática
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS check_motivo_obrigatorio;

-- 2. Criar nova constraint que permite "Aguardando preenchimento"
ALTER TABLE checklist_itens ADD CONSTRAINT check_motivo_obrigatorio_v2 CHECK (
  marcado = true OR (motivo_nao_marcado IS NOT NULL AND trim(motivo_nao_marcado) != '')
);

-- 3. Atualizar qualquer item existente que possa estar inválido
UPDATE checklist_itens 
SET motivo_nao_marcado = 'Aguardando preenchimento'
WHERE marcado = false AND (motivo_nao_marcado IS NULL OR trim(motivo_nao_marcado) = '');

-- 4. Verificar se há itens que ainda violam a constraint
SELECT COUNT(*) as itens_problematicos 
FROM checklist_itens 
WHERE marcado = false AND (motivo_nao_marcado IS NULL OR trim(motivo_nao_marcado) = '');

-- Se o resultado for 0, está tudo correto

COMMIT;