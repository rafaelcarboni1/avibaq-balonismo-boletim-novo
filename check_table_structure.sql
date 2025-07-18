-- Script para verificar a estrutura real da tabela checklist_itens
-- Execute este SQL no dashboard do Supabase

-- Verificar estrutura da tabela checklist_itens
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'checklist_itens' 
AND table_schema = 'public'
ORDER BY ordinal_position;