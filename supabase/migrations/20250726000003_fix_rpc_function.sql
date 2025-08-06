-- Corrigir função get_user_combined_permissions que pode ter sido corrompida
-- Remove qualquer referência problemática e restaura função limpa

-- 1. Recriar a função get_user_combined_permissions corretamente
-- Removendo qualquer problema de "current_user" ou alias problemáticos
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
  -- Verificação de segurança simples sem alias problemáticos
  IF NOT (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid 
      AND u.role = 'admin'
    ) 
    OR auth.uid()::uuid = p_user_id
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
  ORDER BY rp.recurso, rp.acao, dp.permitido DESC NULLS LAST; -- Priorizar permissões diretas
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Verificar e corrigir permissões de execução
GRANT EXECUTE ON FUNCTION get_user_combined_permissions(UUID) TO authenticated;

-- 3. Comentário
COMMENT ON FUNCTION get_user_combined_permissions(UUID) IS 
'Função para buscar permissões combinadas (role + usuário específico) - versão corrigida sem alias problemáticos';