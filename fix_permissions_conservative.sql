-- CORREÇÃO CONSERVADORA: Execute no Dashboard do Supabase
-- URL: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- ABORDAGEM: Resolver APENAS o problema das colunas inexistentes
-- SEM MEXER na verificação de admin que estava funcionando antes

-- 1. Função corrigida que resolve APENAS o problema das colunas inexistentes
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
  -- MANTER a verificação de admin ORIGINAL que funcionava
  IF NOT (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
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
    -- CORREÇÃO: usar valores padrão para colunas que NÃO existem na tabela permissoes
    SELECT 
      p.recurso,
      p.acao,
      p.permitido,
      'role'::TEXT as fonte,
      'basico'::TEXT as nivel_acesso, -- Valor padrão (coluna não existe em permissoes)
      NULL::JSONB as restricoes       -- Valor padrão (coluna não existe em permissoes)
    FROM permissoes p
    CROSS JOIN user_role ur
    WHERE p.role = ur.role
  ),
  direct_permissions AS (
    -- Permissões diretas do usuário (estas colunas EXISTEM em user_permissions)
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

-- 2. Recriar políticas RLS com verificação ORIGINAL (usando users.id = auth.uid())
-- Remover políticas temporárias muito permissivas
DROP POLICY IF EXISTS "Emergency admin access users" ON users;
DROP POLICY IF EXISTS "Emergency admin access user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "Emergency admin access audit_log" ON permission_audit_log;

-- Recriar políticas RLS conservadoras (usando a verificação ORIGINAL)
CREATE POLICY "Admins can read all users for permissions" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()  -- MANTER verificação original
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can read user permissions" ON user_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()  -- MANTER verificação original
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create user permissions" ON user_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()  -- MANTER verificação original
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update user permissions" ON user_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()  -- MANTER verificação original
      AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()  -- MANTER verificação original
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete user permissions" ON user_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()  -- MANTER verificação original
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view audit logs" ON permission_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()  -- MANTER verificação original
      AND role = 'admin'
    )
  );

-- 3. Comentário de documentação
COMMENT ON FUNCTION get_user_combined_permissions(UUID) IS 
'Função corrigida em 2025-07-28: resolve problema das colunas inexistentes (nivel_acesso, restricoes) 
na tabela permissoes, mantendo verificação de admin original que funcionava.';

-- 4. Status
SELECT 'Correção conservadora aplicada! Resolve colunas inexistentes mantendo verificação admin original.' as status;