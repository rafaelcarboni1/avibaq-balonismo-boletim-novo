-- CORREÇÃO DA FUNÇÃO RPC get_current_user_table_id
-- Problema identificado: A função atual usa auth.uid() que retorna null quando executada com service role
-- Solução: Corrigir a função para usar auth_id ao invés de buscar por email

SELECT '=== CORRIGINDO FUNÇÃO RPC get_current_user_table_id ===' as info;

-- Verificar estado atual da função
SELECT 
    'Estado atual da função:' as status,
    proname as function_name,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'get_current_user_table_id';

-- Verificar estrutura da tabela users
SELECT 
    'Colunas da tabela users relacionadas à autenticação:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('id', 'auth_id', 'email')
ORDER BY ordinal_position;

-- Verificar dados de exemplo
SELECT 
    'Exemplo de dados users (primeiros 3):' as info,
    id,
    email,
    auth_id
FROM users 
WHERE auth_id IS NOT NULL
LIMIT 3;

-- CRIAR VERSÃO CORRIGIDA DA FUNÇÃO
CREATE OR REPLACE FUNCTION get_current_user_table_id()
RETURNS UUID AS $$
DECLARE
    current_auth_id UUID;
    user_table_id UUID;
    user_email TEXT;
BEGIN
    -- Obter auth.uid() do usuário autenticado
    current_auth_id := auth.uid();
    
    -- Se não há usuário autenticado, retornar null
    IF current_auth_id IS NULL THEN
        RAISE LOG 'get_current_user_table_id: auth.uid() retornou NULL';
        RETURN NULL;
    END IF;
    
    -- Buscar diretamente por auth_id na tabela users
    SELECT id INTO user_table_id 
    FROM users 
    WHERE auth_id = current_auth_id;
    
    -- Se encontrou por auth_id, retornar
    IF user_table_id IS NOT NULL THEN
        RAISE LOG 'get_current_user_table_id: Usuário encontrado por auth_id: % -> %', current_auth_id, user_table_id;
        RETURN user_table_id;
    END IF;
    
    -- FALLBACK: Se não encontrou por auth_id, tentar por email
    -- (para casos onde auth_id ainda não foi sincronizado)
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = current_auth_id;
    
    IF user_email IS NOT NULL THEN
        SELECT id INTO user_table_id 
        FROM users 
        WHERE email = user_email;
        
        IF user_table_id IS NOT NULL THEN
            RAISE LOG 'get_current_user_table_id: Usuário encontrado por email fallback: % -> %', user_email, user_table_id;
            
            -- IMPORTANTE: Atualizar auth_id para sincronizar
            UPDATE users 
            SET auth_id = current_auth_id,
                updated_at = NOW()
            WHERE id = user_table_id;
            
            RAISE LOG 'get_current_user_table_id: auth_id sincronizado para usuário %', user_table_id;
            
            RETURN user_table_id;
        ELSE
            RAISE LOG 'get_current_user_table_id: Email % não encontrado na tabela users', user_email;
        END IF;
    ELSE
        RAISE LOG 'get_current_user_table_id: Email não encontrado para auth_id %', current_auth_id;
    END IF;
    
    -- Se chegou até aqui, usuário não foi encontrado
    RAISE LOG 'get_current_user_table_id: Usuário não encontrado para auth_id %', current_auth_id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_current_user_table_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_table_id() TO anon;

SELECT '✅ Função get_current_user_table_id corrigida' as resultado;

-- CRIAR FUNÇÃO DE TESTE PARA DEBUG
CREATE OR REPLACE FUNCTION debug_get_current_user_table_id()
RETURNS JSON AS $$
DECLARE
    current_auth_id UUID;
    user_table_id UUID;
    user_email TEXT;
    result JSON;
BEGIN
    current_auth_id := auth.uid();
    
    -- Buscar por auth_id
    SELECT id INTO user_table_id FROM users WHERE auth_id = current_auth_id;
    
    -- Buscar email do auth
    SELECT email INTO user_email FROM auth.users WHERE id = current_auth_id;
    
    -- Montar resultado de debug
    result := json_build_object(
        'auth_uid', current_auth_id,
        'auth_email', user_email,
        'found_by_auth_id', user_table_id,
        'users_with_auth_id_count', (SELECT COUNT(*) FROM users WHERE auth_id IS NOT NULL),
        'users_total_count', (SELECT COUNT(*) FROM users)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION debug_get_current_user_table_id() TO authenticated;
GRANT EXECUTE ON FUNCTION debug_get_current_user_table_id() TO anon;

SELECT '✅ Função de debug criada' as resultado;

-- VERIFICAÇÃO FINAL
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

-- Verificar se a função foi criada corretamente
SELECT 
    'Função atualizada:' as status,
    proname as function_name,
    prorettype::regtype as return_type,
    LENGTH(prosrc) as source_length
FROM pg_proc 
WHERE proname IN ('get_current_user_table_id', 'debug_get_current_user_table_id');

-- Estatísticas de usuários
SELECT 
    'Usuários com auth_id preenchido' as estatistica,
    COUNT(*) as quantidade
FROM users 
WHERE auth_id IS NOT NULL
UNION ALL
SELECT 
    'Usuários sem auth_id' as estatistica,
    COUNT(*) as quantidade
FROM users 
WHERE auth_id IS NULL;

SELECT '=== CORREÇÃO CONCLUÍDA ===' as status;
SELECT 'Execute o teste novamente para verificar se a função agora funciona corretamente' as proximos_passos;