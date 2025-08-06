-- Adiciona coluna mensalidades_pagas à tabela membros
-- Esta coluna armazena um array de strings no formato "MM/YYYY" para tracking de pagamentos mensais

-- Adicionar a coluna mensalidades_pagas como array de texto
ALTER TABLE membros ADD COLUMN IF NOT EXISTS mensalidades_pagas TEXT[];

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_membros_mensalidades_pagas ON membros USING GIN (mensalidades_pagas);

-- Comentário documentando a coluna
COMMENT ON COLUMN membros.mensalidades_pagas IS 'Array de strings no formato MM/YYYY indicando meses pagos (ex: ["07/2025", "08/2025"])';

-- Para membros existentes que já pagaram julho/2025, vamos inicializar a coluna
-- (Baseado no fato de que você mencionou que 62 membros já pagaram julho)
UPDATE membros 
SET mensalidades_pagas = ARRAY['07/2025']
WHERE status = 'ativo' 
  AND mensalidades_pagas IS NULL
  AND pagamento_inscricao = 'ok';

-- Log da alteração
INSERT INTO logs_atividade (acao, detalhes) VALUES 
('add_mensalidades_pagas_column', jsonb_build_object(
  'descricao', 'Adicionada coluna mensalidades_pagas para tracking de pagamentos mensais',
  'membros_inicializados', (SELECT COUNT(*) FROM membros WHERE mensalidades_pagas IS NOT NULL),
  'data_criacao', NOW()
));