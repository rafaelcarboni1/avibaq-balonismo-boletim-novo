-- Garantir que todas as políticas RLS estejam corretas para as tabelas de permissões
-- Remove políticas conflitantes e cria versões limpas

-- 1. Limpar todas as políticas de user_permissions para evitar conflitos
DROP POLICY IF EXISTS "Admins can manage user permissions" ON user_permissions;
DROP POLICY IF EXISTS "admin_read_user_perms" ON user_permissions;
DROP POLICY IF EXISTS "admin_insert_user_perms" ON user_permissions;
DROP POLICY IF EXISTS "admin_update_user_perms" ON user_permissions;
DROP POLICY IF EXISTS "admin_delete_user_perms" ON user_permissions;
DROP POLICY IF EXISTS "Admins can read user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can create user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can delete user permissions" ON user_permissions;

-- 2. Criar políticas limpas para user_permissions
CREATE POLICY "user_permissions_admin_select" ON user_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "user_permissions_admin_insert" ON user_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "user_permissions_admin_update" ON user_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  );

CREATE POLICY "user_permissions_admin_delete" ON user_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  );

-- 3. Limpar e recriar políticas para permission_audit_log
DROP POLICY IF EXISTS "Admins can view audit logs" ON permission_audit_log;
DROP POLICY IF EXISTS "admin_read_audit_logs" ON permission_audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON permission_audit_log;
DROP POLICY IF EXISTS "system_insert_audit_logs" ON permission_audit_log;

CREATE POLICY "audit_log_admin_select" ON permission_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()::uuid 
      AND u.role = 'admin'
    )
  );

-- Permitir que o sistema (triggers) insira logs
CREATE POLICY "audit_log_system_insert" ON permission_audit_log
  FOR INSERT WITH CHECK (true);

-- 4. Verificar se RLS está habilitado nas tabelas
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;