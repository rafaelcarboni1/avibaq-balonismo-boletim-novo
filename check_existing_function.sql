-- Verificar se a função já existe e sua estrutura atual
SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments,
  p.prosrc as source_code
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE p.proname = 'get_user_combined_permissions' 
  AND n.nspname = 'public';