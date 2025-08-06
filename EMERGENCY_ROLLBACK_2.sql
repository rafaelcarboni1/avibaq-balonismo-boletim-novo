-- 🚨 SEGUNDO ROLLBACK URGENTE: Execute IMEDIATAMENTE no Dashboard do Supabase
-- URL: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- PROBLEMA: Mesmo a correção conservadora quebrou o login admin
-- SOLUÇÃO: Voltar ao estado que funcionava após o primeiro rollback

-- 1. Remover TODAS as políticas RLS que podem estar interferindo
DROP POLICY IF EXISTS "Admins can read all users for permissions" ON users;
DROP POLICY IF EXISTS "Admins can read user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can create user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can update user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can delete user permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can view audit logs" ON permission_audit_log;

-- Remover também quaisquer outras políticas relacionadas
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- 2. Recriar políticas ULTRA permissivas para garantir funcionamento
CREATE POLICY "Emergency total access users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Emergency total access user_permissions" ON user_permissions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Emergency total access audit_log" ON permission_audit_log
  FOR ALL USING (true) WITH CHECK (true);

-- 3. Função SEM NENHUMA verificação de segurança (temporário)
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
  -- TEMPORÁRIO: ZERO verificações de segurança
  
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

-- 4. Verificar se o problema é na autenticação básica
SELECT 'SEGUNDO ROLLBACK APLICADO - Sistema totalmente aberto para debug' as status;

-- 5. Debug: mostrar informações dos usuários admin
SELECT 
  id, 
  email, 
  role, 
  ativo,
  auth_id IS NOT NULL as tem_auth_id,
  primeira_senha
FROM users 
WHERE role = 'admin';