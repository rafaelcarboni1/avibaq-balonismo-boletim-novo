-- Migração simplificada para corrigir RLS da página de permissões
-- Evita conflitos de naming e palavras reservadas

-- 1. Remover políticas existentes que podem conflitar
DROP POLICY IF EXISTS "Admins can read all users for management" ON users;
DROP POLICY IF EXISTS "Admins can manage user permissions" ON user_permissions;

-- 2. Política simples para admins lerem usuários 
CREATE POLICY "admin_read_users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()::uuid 
      AND admin_user.role = 'admin'
    )
  );

-- 3. Políticas para user_permissions 
CREATE POLICY "admin_read_user_perms" ON user_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()::uuid 
      AND admin_user.role = 'admin'
    )
  );

CREATE POLICY "admin_insert_user_perms" ON user_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()::uuid 
      AND admin_user.role = 'admin'
    )
  );

CREATE POLICY "admin_update_user_perms" ON user_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()::uuid 
      AND admin_user.role = 'admin'
    )
  );

CREATE POLICY "admin_delete_user_perms" ON user_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()::uuid 
      AND admin_user.role = 'admin'
    )
  );

-- 4. Política para audit logs
CREATE POLICY "admin_read_audit_logs" ON permission_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id = auth.uid()::uuid 
      AND admin_user.role = 'admin'
    )
  );

-- Política para sistema inserir logs via triggers
CREATE POLICY "system_insert_audit_logs" ON permission_audit_log
  FOR INSERT WITH CHECK (true);