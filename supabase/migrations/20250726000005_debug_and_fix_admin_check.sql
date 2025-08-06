-- Debug e correção da verificação de admin na função RPC
-- O problema é que a verificação de admin não está funcionando mesmo com usuário logado como admin

-- 1. Primeiro, vamos criar uma função de debug para entender o problema
CREATE OR REPLACE FUNCTION debug_admin_check()
RETURNS TABLE(
  current_auth_uid UUID,
  current_auth_uid_text TEXT,
  user_found BOOLEAN,
  user_role TEXT,
  is_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_auth_uid,
    auth.uid()::text as current_auth_uid_text,
    EXISTS(SELECT 1 FROM users u WHERE u.id = auth.uid()) as user_found,
    (SELECT u.role FROM users u WHERE u.id = auth.uid() LIMIT 1) as user_role,
    EXISTS(SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin') as is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corrigir a função get_user_combined_permissions removendo a verificação problemática temporariamente
-- E adicionando logs de debug
CREATE OR REPLACE FUNCTION get_user_combined_permissions(p_user_id UUID)
RETURNS TABLE(
  recurso TEXT,
  acao TEXT,
  permitido BOOLEAN,
  fonte TEXT, -- 'role' ou 'user_specific'
  nivel_acesso TEXT,
  restricoes JSONB
) AS $$
DECLARE
  current_user_id UUID;
  current_user_role TEXT;
  is_admin_user BOOLEAN;
BEGIN
  -- Debug: capturar informações do usuário atual
  current_user_id := auth.uid();
  
  SELECT u.role INTO current_user_role 
  FROM users u 
  WHERE u.id = current_user_id;
  
  is_admin_user := (current_user_role = 'admin');
  
  -- Log de debug (temporário)
  RAISE NOTICE 'DEBUG: auth.uid()=%, role=%, is_admin=%, target_user=%', 
    current_user_id, current_user_role, is_admin_user, p_user_id;

  -- Verificação de segurança mais simples e clara
  IF current_user_role != 'admin' AND current_user_id != p_user_id THEN
    RAISE EXCEPTION 'Acesso negado. User ID: %, Role: %, Target: %', 
      current_user_id, current_user_role, p_user_id;
  END IF;

  RETURN QUERY
  WITH user_role AS (
    -- Buscar o role do usuário alvo
    SELECT u.role
    FROM users u
    WHERE u.id = p_user_id
  ),
  role_permissions AS (
    -- Permissões herdadas do role
    SELECT 
      p.recurso,
      p.acao,
      p.permitido,
      'role'::TEXT as fonte,
      p.nivel_acesso,
      p.restricoes
    FROM permissoes p
    CROSS JOIN user_role ur
    WHERE p.role = ur.role
  ),
  direct_permissions AS (
    -- Permissões diretas do usuário
    SELECT 
      up.recurso,
      up.acao,
      up.permitido,
      'user_specific'::TEXT as fonte,
      up.nivel_acesso,
      up.restricoes
    FROM user_permissions up
    WHERE up.user_id = p_user_id
    AND (up.data_expiracao IS NULL OR up.data_expiracao > NOW())
  )
  -- Combinar permissões: permissões diretas sobrescrevem as do role
  SELECT DISTINCT ON (rp.recurso, rp.acao)
    rp.recurso,
    rp.acao,
    COALESCE(dp.permitido, rp.permitido) as permitido,
    COALESCE(dp.fonte, rp.fonte) as fonte,
    COALESCE(dp.nivel_acesso, rp.nivel_acesso) as nivel_acesso,
    COALESCE(dp.restricoes, rp.restricoes) as restricoes
  FROM role_permissions rp
  FULL OUTER JOIN direct_permissions dp 
    ON rp.recurso = dp.recurso AND rp.acao = dp.acao
  WHERE rp.recurso IS NOT NULL OR dp.recurso IS NOT NULL
  ORDER BY rp.recurso, rp.acao, dp.permitido DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Garantir permissões de execução
GRANT EXECUTE ON FUNCTION debug_admin_check() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_combined_permissions(UUID) TO authenticated;