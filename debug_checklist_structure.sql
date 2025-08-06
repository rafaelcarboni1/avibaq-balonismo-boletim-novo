-- DEBUG: Verificar estrutura real da tabela checklist_itens
-- Data: 31 de julho de 2025

-- =====================================================================
-- VERIFICAR ESTRUTURA ATUAL DA TABELA
-- =====================================================================

-- 1. Listar todas as colunas da tabela checklist_itens
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
ORDER BY ordinal_position;

-- 2. Verificar se a tabela existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'checklist_itens'
) as tabela_existe;

-- 3. Verificar constraints da tabela
SELECT 
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.constraint_column_usage 
WHERE table_name = 'checklist_itens';

-- 4. Verificar se enum bloco_checklist existe
SELECT EXISTS (
  SELECT 1 FROM pg_type 
  WHERE typname = 'bloco_checklist'
) as enum_existe;

-- 5. Se enum existe, listar valores
SELECT unnest(enum_range(NULL::bloco_checklist)) as valores_enum;