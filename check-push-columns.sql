-- Verificar estrutura das tabelas de push notifications
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('push_notifications', 'push_delivery_logs', 'push_scheduled_jobs', 'users')
    AND table_schema = 'public'
ORDER BY table_name, ordinal_position;