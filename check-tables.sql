-- Verificar se as tabelas push existem
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'push_%'
ORDER BY table_name;

-- Verificar estrutura da tabela push_notifications se existir
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'push_notifications' 
  AND table_schema = 'public'
ORDER BY ordinal_position;