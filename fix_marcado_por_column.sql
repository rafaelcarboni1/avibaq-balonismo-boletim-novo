-- CORREÇÃO ESPECÍFICA: Coluna marcado_por
-- Data: 1 de agosto de 2025
-- Problema: Foreign key constraint "checklist_itens_marcado_por_fkey"

-- =====================================================================
-- VERIFICAR E CORRIGIR COLUNA marcado_por
-- =====================================================================

-- 1. Remover foreign key problemático se existir
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_marcado_por_fkey;

-- 2. Verificar se coluna marcado_por existe, se não, criar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'checklist_itens' 
          AND column_name = 'marcado_por'
          AND table_schema = 'public'
    ) THEN
        -- Criar coluna marcado_por
        ALTER TABLE checklist_itens 
        ADD COLUMN marcado_por UUID;
        
        RAISE NOTICE '✅ Coluna marcado_por criada';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna marcado_por já existe';
    END IF;
END $$;

-- 3. Recriar foreign key correto e opcional
ALTER TABLE checklist_itens 
ADD CONSTRAINT checklist_itens_marcado_por_fkey 
FOREIGN KEY (marcado_por) REFERENCES users(id) ON DELETE SET NULL;

-- 4. Garantir que todas as colunas de usuário são opcionais
ALTER TABLE checklist_itens ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE checklist_itens ALTER COLUMN preenchido_por DROP NOT NULL;  
ALTER TABLE checklist_itens ALTER COLUMN marcado_por DROP NOT NULL;

-- =====================================================================
-- MOSTRAR ESTRUTURA FINAL
-- =====================================================================

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
  AND table_schema = 'public'
  AND column_name IN ('created_by', 'preenchido_por', 'marcado_por')
ORDER BY column_name;

SELECT '✅ Coluna marcado_por corrigida!' as status;