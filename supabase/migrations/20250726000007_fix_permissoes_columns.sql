-- Corrigir função para usar apenas colunas que existem na tabela permissoes
-- O erro mostra que p.nivel_acesso não existe na tabela permissoes

-- 1. Primeiro, verificar quais colunas realmente existem na tabela permissoes
-- Assumindo que a tabela tem: id, role, recurso, acao, permitido, restricoes, data_criacao, data_atualizacao

-- 2. Corrigir função get_user_combined_permissions para não usar colunas inexistentes
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
  RETURN QUERY
  WITH user_role AS (
    -- Buscar o role do usuário alvo
    SELECT u.role
    FROM users u
    WHERE u.id = p_user_id
  ),
  role_permissions AS (
    -- Permissões herdadas do role
    -- REMOVER p.nivel_acesso se não existe na tabela permissoes
    SELECT 
      p.recurso,
      p.acao,
      p.permitido,
      'role'::TEXT as fonte,
      'basico'::TEXT as nivel_acesso, -- Valor padrão se coluna não existe
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

-- 3. Opcional: Se queremos adicionar a coluna nivel_acesso na tabela permissoes
-- (Execute apenas se quiser que a tabela permissoes tenha essa coluna)
-- ALTER TABLE permissoes ADD COLUMN IF NOT EXISTS nivel_acesso TEXT DEFAULT 'basico';

-- 4. Garantir permissões
GRANT EXECUTE ON FUNCTION get_user_combined_permissions(UUID) TO authenticated;