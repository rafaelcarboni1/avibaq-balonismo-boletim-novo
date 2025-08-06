-- CORREÇÃO DEFINITIVA: Execute no Dashboard do Supabase
-- URL: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- PROBLEMA IDENTIFICADO:
-- A função get_user_combined_permissions está usando users.id = auth.uid()
-- Mas deveria usar users.auth_id = auth.uid()
-- Porque auth.uid() retorna o ID do auth.users, não do public.users

-- 1. Corrigir a função get_user_combined_permissions
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
  -- CORREÇÃO: Usar auth_id em vez de id para verificar admin
  IF NOT (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()  -- MUDANÇA AQUI: auth_id em vez de id
      AND u.role = 'admin'
    ) 
    OR (
      -- Permitir que usuário consulte suas próprias permissões
      SELECT auth_id FROM users WHERE id = p_user_id
    ) = auth.uid()
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

-- 2. Corrigir todas as políticas RLS que usam users.id = auth.uid()
-- Política para a tabela users
DROP POLICY IF EXISTS "Admins can read all users for permissions" ON users;
CREATE POLICY "Admins can read all users for permissions" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()  -- CORREÇÃO AQUI
      AND u.role = 'admin'
    )
  );

-- Política para user_permissions (SELECT)
DROP POLICY IF EXISTS "Admins can read user permissions" ON user_permissions;
CREATE POLICY "Admins can read user permissions" ON user_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()  -- CORREÇÃO AQUI
      AND u.role = 'admin'
    )
  );

-- Política para user_permissions (INSERT)
DROP POLICY IF EXISTS "Admins can create user permissions" ON user_permissions;
CREATE POLICY "Admins can create user permissions" ON user_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()  -- CORREÇÃO AQUI
      AND u.role = 'admin'
    )
  );

-- Política para user_permissions (UPDATE)
DROP POLICY IF EXISTS "Admins can update user permissions" ON user_permissions;
CREATE POLICY "Admins can update user permissions" ON user_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()  -- CORREÇÃO AQUI
      AND u.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()  -- CORREÇÃO AQUI
      AND u.role = 'admin'
    )
  );

-- Política para user_permissions (DELETE)
DROP POLICY IF EXISTS "Admins can delete user permissions" ON user_permissions;
CREATE POLICY "Admins can delete user permissions" ON user_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()  -- CORREÇÃO AQUI
      AND u.role = 'admin'
    )
  );

-- Política para permission_audit_log
DROP POLICY IF EXISTS "Admins can view audit logs" ON permission_audit_log;
CREATE POLICY "Admins can view audit logs" ON permission_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = auth.uid()  -- CORREÇÃO AQUI
      AND u.role = 'admin'
    )
  );

-- 3. Comentário de documentação
COMMENT ON FUNCTION get_user_combined_permissions(UUID) IS 
'Função corrigida em 2025-07-28: usa auth_id em vez de id para verificação de admin. 
Remove referências a colunas inexistentes na tabela permissoes (nivel_acesso, restricoes).
Combina permissões de role e específicas do usuário.';

-- 4. Testar a correção
SELECT 'Correção aplicada com sucesso! A função agora usa users.auth_id = auth.uid() para verificar admins.' as status;