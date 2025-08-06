-- Função para buscar permissões combinadas de um usuário
-- Esta função combina permissões de role com permissões específicas do usuário
CREATE OR REPLACE FUNCTION get_user_combined_permissions(p_user_id UUID)
RETURNS TABLE (
  recurso text,
  acao text,
  permitido boolean,
  fonte text
) 
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  -- Buscar informações do usuário
  DECLARE
    user_role text;
  BEGIN
    SELECT role INTO user_role 
    FROM users 
    WHERE id = p_user_id;
    
    -- Se usuário não encontrado, retornar vazio
    IF user_role IS NULL THEN
      RETURN;
    END IF;
    
    -- Retornar permissões do role (fonte: 'role')
    RETURN QUERY
    SELECT 
      p.recurso,
      p.acao,
      p.permitido,
      'role'::text as fonte
    FROM permissoes p 
    WHERE p.role = user_role;
    
    -- Retornar permissões específicas do usuário (fonte: 'user_specific')
    RETURN QUERY
    SELECT 
      up.recurso,
      up.acao,
      up.permitido,
      'user_specific'::text as fonte
    FROM user_permissions up 
    WHERE up.user_id = p_user_id 
      AND (up.data_expiracao IS NULL OR up.data_expiracao > NOW());
      
  END;
END;
$$;

-- Garantir que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION get_user_combined_permissions(UUID) TO authenticated;