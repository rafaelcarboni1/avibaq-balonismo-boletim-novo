-- Testar a função RPC get_current_user_table_id
-- Esta função deve retornar o users_table_id do usuário autenticado

SELECT 'Testando função RPC get_current_user_table_id:' as status;

-- Verificar se a função existe e está acessível
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type,
    proacl as permissions
FROM pg_proc 
WHERE proname = 'get_current_user_table_id';

-- Verificar permissões da função para roles anon e authenticated
SELECT 
    'Verificando permissões da função:' as status;

SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges 
WHERE routine_name = 'get_current_user_table_id'
AND grantee IN ('anon', 'authenticated', 'public');

-- Testar a função com um usuário existente (simulação)
-- Primeiro, vamos ver alguns usuários na tabela
SELECT 
    'Usuários disponíveis na tabela users:' as status;

SELECT 
    id,
    email,
    auth_id,
    nome
FROM users 
LIMIT 5;

-- Verificar se existem usuários com auth_id válido
SELECT 
    'Usuários com auth_id válido:' as status;

SELECT 
    COUNT(*) as usuarios_com_auth_id
FROM users 
WHERE auth_id IS NOT NULL;

-- Verificar constraint de foreign key na tabela checklist_itens
SELECT 
    'Constraints de foreign key em checklist_itens:' as status;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confdeltype as on_delete_action,
    confupdtype as on_update_action
FROM pg_constraint 
WHERE conrelid = 'checklist_itens'::regclass 
AND contype = 'f';