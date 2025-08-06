-- Verificar registros órfãos na tabela checklist_itens
-- Identifica registros que referenciam usuários inexistentes

SELECT 
    'Registros órfãos encontrados:' as status;

-- Verificar marcado_por órfãos
SELECT 
    'marcado_por órfãos:' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci 
LEFT JOIN users u ON ci.marcado_por = u.id 
WHERE ci.marcado_por IS NOT NULL AND u.id IS NULL;

-- Verificar created_by órfãos
SELECT 
    'created_by órfãos:' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci 
LEFT JOIN users u ON ci.created_by = u.id 
WHERE ci.created_by IS NOT NULL AND u.id IS NULL;

-- Verificar preenchido_por órfãos
SELECT 
    'preenchido_por órfãos:' as tipo,
    COUNT(*) as quantidade
FROM checklist_itens ci 
LEFT JOIN users u ON ci.preenchido_por = u.id 
WHERE ci.preenchido_por IS NOT NULL AND u.id IS NULL;

-- Mostrar alguns exemplos de registros órfãos
SELECT 
    ci.id,
    ci.marcado_por,
    ci.created_by,
    ci.preenchido_por,
    'marcado_por órfão' as problema
FROM checklist_itens ci 
LEFT JOIN users u ON ci.marcado_por = u.id 
WHERE ci.marcado_por IS NOT NULL AND u.id IS NULL
LIMIT 5;

SELECT 
    ci.id,
    ci.marcado_por,
    ci.created_by,
    ci.preenchido_por,
    'created_by órfão' as problema
FROM checklist_itens ci 
LEFT JOIN users u ON ci.created_by = u.id 
WHERE ci.created_by IS NOT NULL AND u.id IS NULL
LIMIT 5;

SELECT 
    ci.id,
    ci.marcado_por,
    ci.created_by,
    ci.preenchido_por,
    'preenchido_por órfão' as problema
FROM checklist_itens ci 
LEFT JOIN users u ON ci.preenchido_por = u.id 
WHERE ci.preenchido_por IS NOT NULL AND u.id IS NULL
LIMIT 5;

-- Verificar se a função RPC existe
SELECT 
    'Verificando função RPC:' as status;

SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE proname = 'get_current_user_table_id';

-- Verificar se o trigger existe
SELECT 
    'Verificando trigger:' as status;

SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'validate_checklist_user_ids_trigger';