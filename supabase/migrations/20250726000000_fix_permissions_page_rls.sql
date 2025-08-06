-- Migração para corrigir políticas RLS da página de permissões de usuários
-- Resolve erros 404 e problemas de acesso na página /admin/permissoes-usuarios

-- 1. Política para admins lerem informações de outros usuários
-- A página precisa carregar lista de usuários para gerenciar permissões
CREATE POLICY "Admins can read all users for management" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- 2. Melhorar política das user_permissions para incluir INSERT explícito
-- A página atual pode estar falhando ao inserir novas permissões
DROP POLICY IF EXISTS "Admins can manage user permissions" ON user_permissions;

-- Política específica para SELECT
CREATE POLICY "Admins can read user permissions" ON user_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política específica para INSERT
CREATE POLICY "Admins can create user permissions" ON user_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política específica para UPDATE
CREATE POLICY "Admins can update user permissions" ON user_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política específica para DELETE
CREATE POLICY "Admins can delete user permissions" ON user_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 3. Política para permission_audit_log - adicionar INSERT para logs
-- Os triggers de auditoria precisam conseguir inserir logs
CREATE POLICY "System can insert audit logs" ON permission_audit_log
  FOR INSERT WITH CHECK (true); -- Permite inserção pelos triggers

-- 4. Política adicional para leitura de audit logs por admins
-- (já existe, mas garantindo que está correta)
DROP POLICY IF EXISTS "Admins can view audit logs" ON permission_audit_log;

CREATE POLICY "Admins can view audit logs" ON permission_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 5. Política para a view v_user_permissions_summary
-- Views herdam RLS das tabelas, mas é bom garantir
-- Como é uma view, não precisa de política específica

-- 6. Atualizar a função get_user_combined_permissions para ser mais robusta
-- Adicionar verificação de segurança na função
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

-- 7. Comentários para documentação
COMMENT ON POLICY "Admins can read all users for management" ON users IS 
'Permite que admins vejam lista de usuários na página de gerenciamento de permissões';

COMMENT ON POLICY "Admins can read user permissions" ON user_permissions IS 
'Permite que admins leiam permissões específicas de usuários';

COMMENT ON POLICY "System can insert audit logs" ON permission_audit_log IS 
'Permite que triggers do sistema insiram logs de auditoria automaticamente';