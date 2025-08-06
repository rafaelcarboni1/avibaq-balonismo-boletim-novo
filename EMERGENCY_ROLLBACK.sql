-- 🚨 ROLLBACK URGENTE: Execute IMEDIATAMENTE no Dashboard do Supabase
-- URL: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- REVERTER TODAS AS POLÍTICAS RLS PARA O ESTADO ANTERIOR

-- 1. Remover todas as políticas que podem estar causando problema
DROP POLICY IF EXISTS "Admins can read all users for permissions" ON users;
DROP POLICY IF EXISTS "Admins can read user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can create user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can delete user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view audit logs" ON permission_audit_log;

-- 2. Recriar políticas mais permissivas para restaurar acesso
-- Política muito permissiva para users (temporária)
CREATE POLICY "Emergency admin access users" ON users
  FOR ALL USING (true);

-- Política muito permissiva para user_permissions (temporária)  
CREATE POLICY "Emergency admin access user_permissions" ON user_permissions
  FOR ALL USING (true);

-- Política muito permissiva para permission_audit_log (temporária)
CREATE POLICY "Emergency admin access audit_log" ON permission_audit_log
  FOR ALL USING (true);

-- 3. Função temporária SEM verificação de admin (para emergência)
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
  -- TEMPORÁRIO: SEM verificação de admin para restaurar funcionalidade
  
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

-- 4. Verificar estrutura da tabela users para entender o problema
SELECT 'EMERGENCY ROLLBACK APPLIED - Please check users table structure:' as status;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 5. Verificar se auth_id existe e está populado
SELECT 
  COUNT(*) as total_users,
  COUNT(auth_id) as users_with_auth_id,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN role = 'admin' AND auth_id IS NOT NULL THEN 1 END) as admin_users_with_auth_id
FROM users;