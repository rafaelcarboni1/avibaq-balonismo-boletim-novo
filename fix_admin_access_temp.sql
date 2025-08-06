-- SOLUÇÃO TEMPORÁRIA: Remove verificação de admin para debug
-- Execute no Dashboard: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- Versão temporária SEM verificação de admin (para debug)
CREATE OR REPLACE FUNCTION get_user_combined_permissions(p_user_id UUID)
RETURNS TABLE(
  recurso TEXT,
  acao TEXT,
  permitido BOOLEAN,
  fonte TEXT,
  nivel_acesso TEXT,
  restricoes JSONB
) AS $$
BEGIN
  -- TEMPORÁRIO: Removida verificação de admin para debug
  -- TODO: Restaurar verificação após identificar problema
  
  RETURN QUERY
  WITH user_role AS (
    SELECT u.role
    FROM users u
    WHERE u.id = p_user_id
  ),
  role_permissions AS (
    SELECT 
      p.recurso,
      p.acao,
      p.permitido,
      'role'::TEXT as fonte,
      'basico'::TEXT as nivel_acesso,
      NULL::JSONB as restricoes
    FROM permissoes p
    CROSS JOIN user_role ur
    WHERE p.role = ur.role
  ),
  direct_permissions AS (
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
  SELECT DISTINCT ON (COALESCE(rp.recurso, dp.recurso), COALESCE(rp.acao, dp.acao))
    COALESCE(rp.recurso, dp.recurso) as recurso,
    COALESCE(rp.acao, dp.acao) as acao,
    COALESCE(dp.permitido, rp.permitido) as permitido,
    COALESCE(dp.fonte, rp.fonte) as fonte,
    COALESCE(dp.nivel_acesso, rp.nivel_acesso) as nivel_acesso,
    COALESCE(dp.restricoes, rp.restricoes) as restricoes
  FROM role_permissions rp
  FULL OUTER JOIN direct_permissions dp 
    ON rp.recurso = dp.recurso AND rp.acao = dp.acao
  WHERE COALESCE(rp.recurso, dp.recurso) IS NOT NULL 
    AND COALESCE(rp.acao, dp.acao) IS NOT NULL
  ORDER BY COALESCE(rp.recurso, dp.recurso), COALESCE(rp.acao, dp.acao), dp.permitido DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;