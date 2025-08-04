-- =====================================================================
-- CORREÇÃO DEFINITIVA DO SISTEMA DE CHECKLIST AVIBAQ
-- Data: Janeiro 2025
-- Problema: Incompatibilidade estrutural e foreign key constraints
-- =====================================================================

-- ETAPA 1: BACKUP DE SEGURANÇA
DO $$
BEGIN
    -- Criar backup apenas se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklist_itens_backup_jan2025') THEN
        CREATE TABLE checklist_itens_backup_jan2025 AS SELECT * FROM checklist_itens;
        RAISE NOTICE '✅ Backup criado: checklist_itens_backup_jan2025';
    ELSE
        RAISE NOTICE 'ℹ️ Backup já existe, pulando criação';
    END IF;
END $$;

-- ETAPA 2: REMOVER CONSTRAINTS PROBLEMÁTICOS
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_preenchido_por_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_marcado_por_fkey;
ALTER TABLE checklist_itens DROP CONSTRAINT IF EXISTS checklist_itens_created_by_fkey;

-- ETAPA 3: ADICIONAR COLUNAS QUE O FRONTEND ESPERA
DO $$
BEGIN
    -- Adicionar coluna marcado_em se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'checklist_itens' AND column_name = 'marcado_em') THEN
        ALTER TABLE checklist_itens ADD COLUMN marcado_em TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Coluna marcado_em adicionada';
    END IF;
    
    -- Adicionar coluna marcado_por se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'checklist_itens' AND column_name = 'marcado_por') THEN
        ALTER TABLE checklist_itens ADD COLUMN marcado_por UUID;
        RAISE NOTICE '✅ Coluna marcado_por adicionada';
    END IF;
    
    -- Garantir que todas as colunas de usuário são opcionais
    ALTER TABLE checklist_itens ALTER COLUMN preenchido_por DROP NOT NULL;
    ALTER TABLE checklist_itens ALTER COLUMN marcado_por DROP NOT NULL;
    
    RAISE NOTICE '✅ Colunas configuradas como opcionais';
END $$;

-- ETAPA 4: MIGRAR DADOS EXISTENTES
UPDATE checklist_itens SET 
    marcado_em = COALESCE(marcado_em, preenchido_em, updated_at, created_at),
    marcado_por = COALESCE(marcado_por, preenchido_por)
WHERE marcado_em IS NULL OR marcado_por IS NULL;

-- ETAPA 5: RECRIAR FOREIGN KEYS COMO OPCIONAIS
ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_marcado_por_fkey 
    FOREIGN KEY (marcado_por) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE checklist_itens ADD CONSTRAINT checklist_itens_preenchido_por_fkey 
    FOREIGN KEY (preenchido_por) REFERENCES users(id) ON DELETE SET NULL;

-- ETAPA 6: CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_checklist_marcado_por ON checklist_itens(marcado_por);
CREATE INDEX IF NOT EXISTS idx_checklist_marcado_em ON checklist_itens(marcado_em);

-- ETAPA 7: VERIFICAR ESTRUTURA FINAL
SELECT 
    'ESTRUTURA FINAL DA TABELA' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
    AND column_name IN ('marcado_em', 'marcado_por', 'preenchido_por', 'item_descricao', 'motivo_nao_marcado')
ORDER BY column_name;

SELECT '🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!' as status;