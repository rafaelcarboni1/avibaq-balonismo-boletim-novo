-- SOLUÇÃO SIMPLES: Adicionar coluna created_by que está faltando
-- Data: 1 de agosto de 2025

-- =====================================================================
-- VERIFICAR SE COLUNA JÁ EXISTE
-- =====================================================================

DO $$
BEGIN
    -- Verificar se coluna created_by existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'checklist_itens' 
          AND column_name = 'created_by'
          AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '❌ Coluna created_by NÃO existe. Será criada.';
        
        -- Adicionar coluna created_by
        ALTER TABLE checklist_itens 
        ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Coluna created_by adicionada com sucesso!';
    ELSE
        RAISE NOTICE '✅ Coluna created_by já existe.';
    END IF;
    
    -- Verificar se coluna preenchido_por existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'checklist_itens' 
          AND column_name = 'preenchido_por'
          AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '❌ Coluna preenchido_por NÃO existe. Será criada.';
        
        -- Adicionar coluna preenchido_por  
        ALTER TABLE checklist_itens 
        ADD COLUMN preenchido_por UUID REFERENCES users(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Coluna preenchido_por adicionada com sucesso!';
    ELSE
        RAISE NOTICE '✅ Coluna preenchido_por já existe.';
    END IF;
END $$;

-- =====================================================================
-- MOSTRAR ESTRUTURA FINAL DA TABELA
-- =====================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================================
-- RESULTADO:
-- =====================================================================

-- ✅ Colunas created_by e preenchido_por serão adicionadas
-- ✅ São opcionais (podem ser NULL) 
-- ✅ Têm foreign key para users(id)
-- ✅ ON DELETE SET NULL para segurança

SELECT '✅ Colunas adicionadas! Agora teste o checklist novamente.' as status;