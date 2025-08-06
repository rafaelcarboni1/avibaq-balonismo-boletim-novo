-- Migração para adicionar permissões granulares por usuário específico
-- Mantém compatibilidade total com o sistema de permissões por role existente

-- 1. Tabela para permissões específicas por usuário
CREATE TABLE user_permissions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recurso TEXT NOT NULL,
  acao TEXT NOT NULL,
  permitido BOOLEAN NOT NULL DEFAULT true,
  nivel_acesso TEXT DEFAULT 'basico',
  restricoes JSONB,
  concedido_por UUID REFERENCES users(id),
  concedido_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_expiracao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, recurso, acao),
  CHECK (permitido IN (true, false))
);

-- 2. Tabela de auditoria para rastreamento de mudanças
CREATE TABLE permission_audit_log (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  admin_user_id UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL, -- 'grant', 'revoke', 'modify'
  permission_type TEXT NOT NULL, -- 'role', 'user_specific'
  recurso TEXT,
  acao TEXT,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  ip_address INET,
  user_agent TEXT
);

-- 3. Índices para performance
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_recurso ON user_permissions(recurso);
CREATE INDEX idx_user_permissions_acao ON user_permissions(acao);
CREATE INDEX idx_user_permissions_permitido ON user_permissions(permitido);
CREATE INDEX idx_permission_audit_log_timestamp ON permission_audit_log(timestamp);
CREATE INDEX idx_permission_audit_log_target_user ON permission_audit_log(target_user_id);

-- 4. Função otimizada para buscar permissões combinadas (role + usuário específico)
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

-- 5. Função para verificar permissão específica (para uso em RLS policies)
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_recurso TEXT,
  p_acao TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN := false;
BEGIN
  -- Verificar se usuário tem a permissão específica
  SELECT permitido INTO has_perm
  FROM get_user_combined_permissions(p_user_id)
  WHERE recurso = p_recurso AND acao = p_acao
  LIMIT 1;
  
  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para auditoria automática de mudanças
CREATE OR REPLACE FUNCTION log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permission_audit_log (
      admin_user_id,
      target_user_id,
      action,
      permission_type,
      recurso,
      acao,
      new_value
    ) VALUES (
      current_setting('app.current_user_id', true)::UUID,
      NEW.user_id,
      'grant',
      'user_specific',
      NEW.recurso,
      NEW.acao,
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO permission_audit_log (
      admin_user_id,
      target_user_id,
      action,
      permission_type,
      recurso,
      acao,
      old_value,
      new_value
    ) VALUES (
      current_setting('app.current_user_id', true)::UUID,
      NEW.user_id,
      'modify',
      'user_specific',
      NEW.recurso,
      NEW.acao,
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    INSERT INTO permission_audit_log (
      admin_user_id,
      target_user_id,
      action,
      permission_type,
      recurso,
      acao,
      old_value
    ) VALUES (
      current_setting('app.current_user_id', true)::UUID,
      OLD.user_id,
      'revoke',
      'user_specific',
      OLD.recurso,
      OLD.acao,
      row_to_json(OLD)
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para user_permissions
CREATE TRIGGER user_permissions_audit
  AFTER INSERT OR UPDATE OR DELETE ON user_permissions
  FOR EACH ROW EXECUTE FUNCTION log_permission_change();

-- 7. RLS (Row Level Security) para proteger as tabelas
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

-- Política para user_permissions: apenas admins podem gerenciar
CREATE POLICY "Admins can manage user permissions" ON user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Política para logs: apenas admins podem ver
CREATE POLICY "Admins can view audit logs" ON permission_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 8. Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. View para facilitar consultas administrativas
CREATE VIEW v_user_permissions_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.nome,
  u.role,
  up.recurso,
  up.acao,
  up.permitido,
  up.nivel_acesso,
  up.concedido_em,
  up.data_expiracao,
  admin.nome as concedido_por_nome
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN users admin ON up.concedido_por = admin.id
WHERE up.id IS NOT NULL
ORDER BY u.nome, up.recurso, up.acao;

-- 10. Comentários para documentação
COMMENT ON TABLE user_permissions IS 'Permissões específicas por usuário individual, complementam as permissões por role';
COMMENT ON TABLE permission_audit_log IS 'Log de auditoria para todas as mudanças de permissões';
COMMENT ON FUNCTION get_user_combined_permissions(UUID) IS 'Função otimizada para buscar permissões combinadas (role + usuário específico)';
COMMENT ON FUNCTION user_has_permission(UUID, TEXT, TEXT) IS 'Função para verificar se usuário tem permissão específica';
COMMENT ON VIEW v_user_permissions_summary IS 'View para consultas administrativas das permissões por usuário';