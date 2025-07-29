-- DEBUG: Executar no Dashboard do Supabase para diagnosticar o problema
-- URL: https://supabase.com/dashboard/project/elcbodhxzvoqpzamgown/sql

-- 1. Função para verificar o que está acontecendo com a autenticação
CREATE OR REPLACE FUNCTION debug_admin_access()
RETURNS TABLE(
  current_auth_uid UUID,
  current_user_id UUID,
  current_user_email TEXT,
  current_user_role TEXT,
  is_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as current_auth_uid,
    u.id as current_user_id,
    u.email as current_user_email,
    u.role as current_user_role,
    (u.role = 'admin') as is_admin
  FROM users u
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Executar debug para ver os valores atuais
SELECT * FROM debug_admin_access();

-- 3. Versão simplificada da função get_user_combined_permissions SEM verificação de admin
-- (temporária para permitir debug)
CREATE OR REPLACE FUNCTION get_user_combined_permissions_debug(p_user_id UUID)
RETURNS TABLE(
  recurso TEXT,
  acao TEXT,
  permitido BOOLEAN,
  fonte TEXT,
  nivel_acesso TEXT,
  restricoes JSONB,
  debug_info TEXT
) AS $$
DECLARE
  current_uid UUID;
  current_role TEXT;
  is_admin_check BOOLEAN;
BEGIN
  -- Capturar informações de debug
  current_uid := auth.uid();
  
  SELECT u.role INTO current_role
  FROM users u 
  WHERE u.id = current_uid;
  
  is_admin_check := (current_role = 'admin');

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
      NULL::JSONB as restricoes,
      format('auth_uid: %s, current_role: %s, is_admin: %s', current_uid, current_role, is_admin_check) as debug_info
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
      up.restricoes,
      format('auth_uid: %s, current_role: %s, is_admin: %s', current_uid, current_role, is_admin_check) as debug_info
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
    COALESCE(dp.restricoes, rp.restricoes) as restricoes,
    COALESCE(rp.debug_info, dp.debug_info) as debug_info
  FROM role_permissions rp
  FULL OUTER JOIN direct_permissions dp 
    ON rp.recurso = dp.recurso AND rp.acao = dp.acao
  WHERE COALESCE(rp.recurso, dp.recurso) IS NOT NULL 
    AND COALESCE(rp.acao, dp.acao) IS NOT NULL
  ORDER BY COALESCE(rp.recurso, dp.recurso), COALESCE(rp.acao, dp.acao), dp.permitido DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verificar todos os usuários admin na tabela
SELECT id, email, nome, role, auth_id 
FROM users 
WHERE role = 'admin';

-- 5. Versão corrigida da função principal (usar depois do debug)
CREATE OR REPLACE FUNCTION get_user_combined_permissions_fixed(p_user_id UUID)
RETURNS TABLE(
  recurso TEXT,
  acao TEXT,
  permitido BOOLEAN,
  fonte TEXT,
  nivel_acesso TEXT,
  restricoes JSONB
) AS $$
DECLARE
  current_user_role TEXT;
  is_authorized BOOLEAN := false;
BEGIN
  -- Verificação mais robusta de autorização
  SELECT u.role INTO current_user_role
  FROM users u 
  WHERE u.id = auth.uid();
  
  -- Autorizar se: é admin OU está consultando suas próprias permissões
  is_authorized := (current_user_role = 'admin') OR (auth.uid() = p_user_id);
  
  IF NOT is_authorized THEN
    RAISE EXCEPTION 'Acesso negado. Usuário atual: role=%, auth_uid=%, target_user=%. Apenas admins podem consultar permissões de outros usuários', 
      current_user_role, auth.uid(), p_user_id;
  END IF;

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