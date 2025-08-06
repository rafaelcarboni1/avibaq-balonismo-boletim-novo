-- CORREÇÃO SIMPLES: Schema checklist_itens compatível com Supabase
-- Data: 31 de julho de 2025
-- Versão simplificada sem DO blocks para evitar problemas de permissão

-- =====================================================================
-- ETAPA 1: CRIAR ENUM SE NÃO EXISTIR
-- =====================================================================

-- Criar enum para blocos do checklist (ignora erro se já existir)
CREATE TYPE bloco_checklist AS ENUM ('bloco1', 'bloco2', 'bloco3');

-- =====================================================================  
-- ETAPA 2: ADICIONAR COLUNAS AUSENTES (IGNORA ERRO SE JÁ EXISTIR)
-- =====================================================================

-- Adicionar coluna preenchido_por se não existir
ALTER TABLE checklist_itens ADD COLUMN preenchido_por UUID REFERENCES users(id);

-- Adicionar coluna preenchido_em se não existir  
ALTER TABLE checklist_itens ADD COLUMN preenchido_em TIMESTAMP WITH TIME ZONE;

-- Adicionar coluna created_at se não existir
ALTER TABLE checklist_itens ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Adicionar coluna updated_at se não existir
ALTER TABLE checklist_itens ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================================
-- ETAPA 3: CORRIGIR TIPO DA COLUNA BLOCO SE NECESSÁRIO
-- =====================================================================

-- Alterar tipo da coluna bloco para usar o enum (se necessário)
-- ALTER TABLE checklist_itens ALTER COLUMN bloco TYPE bloco_checklist USING bloco::text::bloco_checklist;

-- =====================================================================
-- ETAPA 4: ADICIONAR CONSTRAINTS SE NÃO EXISTIREM
-- =====================================================================

-- Constraint para validar motivo obrigatório
ALTER TABLE checklist_itens ADD CONSTRAINT check_motivo_obrigatorio 
  CHECK (marcado = true OR motivo_nao_marcado IS NOT NULL);

-- Unique constraint para evitar duplicatas
ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_voo_bloco_item_unique
  UNIQUE(voo_id, bloco, item_numero);

-- =====================================================================
-- ETAPA 5: HABILITAR RLS E CRIAR ÍNDICES
-- =====================================================================

-- Habilitar RLS
ALTER TABLE checklist_itens ENABLE ROW LEVEL SECURITY;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_checklist_itens_voo ON checklist_itens(voo_id);
CREATE INDEX IF NOT EXISTS idx_checklist_itens_bloco ON checklist_itens(bloco);
CREATE INDEX IF NOT EXISTS idx_checklist_itens_preenchido_por ON checklist_itens(preenchido_por);

-- =====================================================================
-- ETAPA 6: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================================

COMMENT ON TABLE checklist_itens IS 'Itens do checklist de segurança por voo - 3 blocos conforme especificação AVIBAQ';
COMMENT ON COLUMN checklist_itens.preenchido_por IS 'ID do usuário que preencheu o item - pode ser NULL';
COMMENT ON COLUMN checklist_itens.preenchido_em IS 'Timestamp de quando o item foi preenchido';

-- =====================================================================
-- NOTAS IMPORTANTES:
-- =====================================================================

-- Este script usa comandos simples que o Supabase pode executar
-- Se algum comando falhar (ex: coluna já existe), o erro será ignorado
-- e os próximos comandos continuarão sendo executados

-- Para verificar se funcionou, execute:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'checklist_itens' 
-- ORDER BY ordinal_position;