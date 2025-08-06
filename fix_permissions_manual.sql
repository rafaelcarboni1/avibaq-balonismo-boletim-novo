-- CORREÇÃO MANUAL: Executar no Dashboard do Supabase
-- URL: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- Função corrigida que remove referencias às colunas inexistentes
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
  -- Verificar se o usuário atual é admin ou está consultando suas próprias permissões
  IF NOT (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    ) 
    OR auth.uid() = p_user_id
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas admins podem consultar permissões de outros usuários';
  END IF;

  RETURN QUERY
  WITH user_role AS (
    -- Buscar o role do usuário
    SELECT u.role
    FROM users u
    WHERE u.id = p_user_id
  ),
  role_permissions AS (
    -- Permissões herdadas do role
    -- CORREÇÃO: usar valores padrão para colunas inexistentes
    SELECT 
      p.recurso,
      p.acao,
      p.permitido,
      'role'::TEXT as fonte,
      'basico'::TEXT as nivel_acesso, -- Valor padrão
      NULL::JSONB as restricoes       -- Valor padrão
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