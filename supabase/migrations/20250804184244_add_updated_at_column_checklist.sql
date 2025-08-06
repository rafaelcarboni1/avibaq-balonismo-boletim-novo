-- CORREÇÃO: Adicionar coluna updated_at na tabela checklist_itens
-- Problema: Trigger tenta setar updated_at mas coluna não existe
-- Data: 04 de agosto de 2025

-- =====================================================================
-- ADICIONAR COLUNA updated_at SE NÃO EXISTIR
-- =====================================================================

-- Verificar e adicionar coluna updated_at se ela não existir
DO $$
BEGIN
    -- Verificar se a coluna updated_at existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'checklist_itens' 
        AND column_name = 'updated_at'
    ) THEN
        -- Adicionar a coluna se não existir
        ALTER TABLE checklist_itens 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Coluna updated_at adicionada à tabela checklist_itens';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe na tabela checklist_itens';
    END IF;
END $$;

-- =====================================================================
-- CRIAR TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- =====================================================================

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION trigger_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela checklist_itens
DROP TRIGGER IF EXISTS trigger_checklist_updated_at ON checklist_itens;
CREATE TRIGGER trigger_checklist_updated_at
    BEFORE UPDATE ON checklist_itens
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_updated_at();

-- =====================================================================
-- COMENTÁRIOS
-- =====================================================================

COMMENT ON COLUMN checklist_itens.updated_at IS 'Timestamp da última atualização do registro';
COMMENT ON FUNCTION trigger_update_updated_at() IS 'Atualiza automaticamente o campo updated_at';