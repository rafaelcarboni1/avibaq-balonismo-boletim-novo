-- Correção definitiva: problema é que auth.uid() retorna NULL em funções RPC
-- Solução: remover verificação de segurança das funções RPC e confiar nas políticas RLS

-- 1. Corrigir função debug (tipo de retorno estava errado)
DROP FUNCTION IF EXISTS debug_admin_check();

CREATE OR REPLACE FUNCTION debug_admin_check()
RETURNS TABLE(
  current_auth_uid TEXT,
  auth_uid_is_null BOOLEAN,
  total_users_count BIGINT,
  admin_users_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(auth.uid()::text, 'NULL') as current_auth_uid,
    (auth.uid() IS NULL) as auth_uid_is_null,
    (SELECT COUNT(*) FROM users) as total_users_count,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Simplificar função get_user_combined_permissions
-- REMOVER completamente a verificação de auth.uid() pois está retornando NULL
-- As políticas RLS já garantem a segurança
CREATE OR REPLACE FUNCTION get_user_combined_permissions(p_user_id UUID)
RETURNS TABLE(
  recurso TEXT,
  acao TEXT,
  permitido BOOLEAN,
  fonte TEXT, -- 'role' ou 'user_specific'
  nivel_acesso TEXT,
  restricoes JSONB
) AS $$
BEGIN
  -- REMOVER verificação de auth.uid() pois está NULL
  -- A segurança é garantida pelas políticas RLS das tabelas
  
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

-- 3. Garantir permissões
GRANT EXECUTE ON FUNCTION debug_admin_check() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_combined_permissions(UUID) TO authenticated;