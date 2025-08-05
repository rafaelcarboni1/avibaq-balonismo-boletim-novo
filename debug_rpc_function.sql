-- Debug da função RPC get_current_user_table_id
-- Verificar se existe conflito de tipos

SELECT 'Verificando função get_current_user_table_id:' as status;

-- Verificar se a função existe e seus tipos
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type,
    prosrc as source_code
FROM pg_proc 
WHERE proname = 'get_current_user_table_id';

-- Verificar se há múltiplas versões da função
SELECT 
    COUNT(*) as function_count,
    'Número de funções com este nome' as description
FROM pg_proc 
WHERE proname = 'get_current_user_table_id';

-- Recriar a função corretamente
DROP FUNCTION IF EXISTS get_current_user_table_id();

CREATE OR REPLACE FUNCTION get_current_user_table_id()
RETURNS UUID AS $$
DECLARE
    user_email TEXT;
    user_table_id UUID;
BEGIN
    -- Obter email do usuário autenticado
    SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
    
    IF user_email IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Buscar ID na tabela users
    SELECT id INTO user_table_id FROM users WHERE email = user_email;
    
    RETURN user_table_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_current_user_table_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_table_id() TO anon;

SELECT 'Função RPC recriada com sucesso' as status;

-- Verificar novamente após recriação
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_current_user_table_id';