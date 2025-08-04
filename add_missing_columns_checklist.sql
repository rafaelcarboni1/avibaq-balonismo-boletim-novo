-- SOLUÇÃO SIMPLES: Adicionar colunas que estão faltando na tabela checklist_itens
-- Data: 1 de agosto de 2025
-- Problema: Coluna "created_by" não existe

DO $$
BEGIN
    -- Verificar e adicionar coluna created_by se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checklist_itens' 
          AND column_name = 'created_by'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE checklist_itens 
        ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Coluna created_by adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna created_by já existe';
    END IF;
    
    -- Verificar e adicionar coluna preenchido_por se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checklist_itens' 
          AND column_name = 'preenchido_por'
          AND table_schema = 'public'
    ) THEN
        ALTER TABLE checklist_itens 
        ADD COLUMN preenchido_por UUID REFERENCES users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Coluna preenchido_por adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna preenchido_por já existe';
    END IF;
END $$;

-- Mostrar estrutura final da tabela para confirmar
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
  AND table_schema = 'public'
ORDER BY ordinal_position;