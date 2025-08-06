-- CORREÇÃO CRÍTICA: Adicionar colunas ausentes na tabela checklist_itens
-- Data: 31 de julho de 2025
-- Problema: Migração 20250111000005 não foi aplicada completamente

-- =====================================================================
-- VERIFICAR E CORRIGIR SCHEMA DA TABELA CHECKLIST_ITENS
-- =====================================================================

-- 1. Primeiro, verificar se o enum bloco_checklist existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bloco_checklist') THEN
    CREATE TYPE bloco_checklist AS ENUM ('bloco1', 'bloco2', 'bloco3');
    RAISE NOTICE 'Enum bloco_checklist criado com sucesso';
  ELSE
    RAISE NOTICE 'Enum bloco_checklist já existe';
  END IF;
END $$;

-- 2. Verificar se a tabela checklist_itens existe, se não, criar
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_name = 'checklist_itens') THEN
    
    -- Criar tabela completa se não existir
    CREATE TABLE checklist_itens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      voo_id UUID NOT NULL REFERENCES voos(id) ON DELETE CASCADE,
      bloco bloco_checklist NOT NULL,
      item_numero INTEGER NOT NULL,
      item_descricao TEXT NOT NULL,
      marcado BOOLEAN DEFAULT false,
      motivo_nao_marcado TEXT,
      preenchido_em TIMESTAMP WITH TIME ZONE,
      preenchido_por UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      UNIQUE(voo_id, bloco, item_numero),
      CONSTRAINT check_motivo_obrigatorio CHECK (
        marcado = true OR motivo_nao_marcado IS NOT NULL
      )
    );
    
    -- Habilitar RLS
    ALTER TABLE checklist_itens ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Tabela checklist_itens criada completamente';
    
  ELSE
    RAISE NOTICE 'Tabela checklist_itens já existe, verificando colunas...';
  END IF;
END $$;

-- 3. Verificar e adicionar colunas ausentes uma por uma
DO $$
BEGIN
  -- Adicionar coluna preenchido_por se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'checklist_itens' 
                 AND column_name = 'preenchido_por') THEN
    ALTER TABLE checklist_itens ADD COLUMN preenchido_por UUID REFERENCES users(id);
    RAISE NOTICE 'Coluna preenchido_por adicionada';
  ELSE
    RAISE NOTICE 'Coluna preenchido_por já existe';
  END IF;

  -- Adicionar coluna preenchido_em se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'checklist_itens' 
                 AND column_name = 'preenchido_em') THEN
    ALTER TABLE checklist_itens ADD COLUMN preenchido_em TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Coluna preenchido_em adicionada';
  ELSE
    RAISE NOTICE 'Coluna preenchido_em já existe';
  END IF;

  -- Verificar se coluna bloco é do tipo correto
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'checklist_itens' 
             AND column_name = 'bloco' 
             AND udt_name != 'bloco_checklist') THEN
    -- Alterar tipo da coluna se necessário
    ALTER TABLE checklist_itens ALTER COLUMN bloco TYPE bloco_checklist 
      USING bloco::text::bloco_checklist;
    RAISE NOTICE 'Tipo da coluna bloco corrigido';
  END IF;
END $$;

-- 4. Verificar e criar constraint se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
                 WHERE table_name = 'checklist_itens' 
                 AND constraint_name = 'check_motivo_obrigatorio') THEN
    ALTER TABLE checklist_itens ADD CONSTRAINT check_motivo_obrigatorio 
      CHECK (marcado = true OR motivo_nao_marcado IS NOT NULL);
    RAISE NOTICE 'Constraint check_motivo_obrigatorio adicionada';
  ELSE
    RAISE NOTICE 'Constraint check_motivo_obrigatorio já existe';
  END IF;
END $$;

-- 5. Verificar e criar unique constraint se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
                 WHERE table_name = 'checklist_itens' 
                 AND constraint_name = 'checklist_itens_voo_id_bloco_item_numero_key') THEN
    ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_voo_id_bloco_item_numero_key
      UNIQUE(voo_id, bloco, item_numero);
    RAISE NOTICE 'Unique constraint adicionada';
  ELSE
    RAISE NOTICE 'Unique constraint já existe';
  END IF;
END $$;

-- 6. Habilitar RLS se não estiver habilitado
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables 
                 WHERE tablename = 'checklist_itens' 
                 AND rowsecurity = true) THEN
    ALTER TABLE checklist_itens ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS habilitado para checklist_itens';
  ELSE
    RAISE NOTICE 'RLS já está habilitado para checklist_itens';
  END IF;
END $$;

-- 7. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_checklist_itens_voo ON checklist_itens(voo_id);
CREATE INDEX IF NOT EXISTS idx_checklist_itens_bloco ON checklist_itens(bloco);
CREATE INDEX IF NOT EXISTS idx_checklist_itens_preenchido_por ON checklist_itens(preenchido_por);

-- 8. Comentários nas colunas
COMMENT ON TABLE checklist_itens IS 'Itens do checklist de segurança por voo - 3 blocos conforme especificação AVIBAQ';
COMMENT ON COLUMN checklist_itens.voo_id IS 'ID do voo relacionado';
COMMENT ON COLUMN checklist_itens.bloco IS 'Bloco do checklist (bloco1, bloco2, bloco3)';
COMMENT ON COLUMN checklist_itens.preenchido_por IS 'ID do usuário que preencheu o item - pode ser NULL';
COMMENT ON COLUMN checklist_itens.preenchido_em IS 'Timestamp de quando o item foi preenchido';

-- =====================================================================
-- VERIFICAÇÃO FINAL
-- =====================================================================

-- Query para verificar a estrutura final da tabela:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'checklist_itens' 
-- ORDER BY ordinal_position;

-- =====================================================================
-- RESUMO DA CORREÇÃO:
-- =====================================================================

-- ✅ Verifica se enum bloco_checklist existe, cria se necessário
-- ✅ Verifica se tabela existe, cria completa se necessário  
-- ✅ Adiciona colunas ausentes uma por uma (defensivo)
-- ✅ Corrige tipo da coluna bloco se necessário
-- ✅ Adiciona constraints ausentes
-- ✅ Habilita RLS se necessário
-- ✅ Cria índices para performance
-- ✅ Usa DO $$ blocks para execução condicional segura

-- Após executar este script, a tabela checklist_itens estará 100% correta!