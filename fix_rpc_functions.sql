-- CORREÇÃO URGENTE: Corrigir funções RPC para usar fallback por email
-- Execute no Dashboard do Supabase

-- 1. CORRIGIR FUNÇÃO debug_auth_uid com fallback por email
CREATE OR REPLACE FUNCTION debug_auth_uid()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'auth_uid', auth.uid(),
    'is_authenticated', CASE WHEN auth.uid() IS NOT NULL THEN true ELSE false END,
    'user_email', (SELECT email FROM auth.users WHERE id = auth.uid()),
    'member_data', (
      SELECT json_build_object(
        'id', m.id,
        'nome', m.nome_completo,
        'email', m.email,
        'user_id', m.user_id,
        'tipo', m.tipo,
        'found_by', CASE 
          WHEN m.user_id = auth.uid() THEN 'USER_ID'
          WHEN m.user_id IS NULL AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid()) THEN 'EMAIL_FALLBACK'
          ELSE 'UNKNOWN'
        END
      )
      FROM membros m 
      WHERE (
        (m.user_id = auth.uid()) OR 
        (m.user_id IS NULL AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      )
      AND m.status = 'ativo'
      LIMIT 1
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CORRIGIR FUNÇÃO test_balao_policy com fallback por email
CREATE OR REPLACE FUNCTION test_balao_policy()
RETURNS json AS $$
DECLARE
  member_id uuid;
  policy_result boolean;
  member_info record;
BEGIN
  -- Buscar ID do membro atual COM FALLBACK POR EMAIL
  SELECT m.id, m.nome_completo, m.user_id, m.email INTO member_info
  FROM membros m 
  WHERE (
    (m.user_id = auth.uid()) OR 
    (m.user_id IS NULL AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  AND m.status = 'ativo' 
  AND m.tipo = 'piloto'
  LIMIT 1;
  
  member_id := member_info.id;
  
  -- Testar política (mesma lógica das políticas RLS)
  SELECT EXISTS (
    SELECT 1 FROM membros m 
    JOIN auth.users u ON (
      (m.user_id = u.id AND u.id = auth.uid()) OR 
      (m.user_id IS NULL AND m.email = u.email AND u.id = auth.uid())
    )
    WHERE m.id = member_id 
    AND m.status = 'ativo'
  ) INTO policy_result;
  
  RETURN json_build_object(
    'member_id', member_id,
    'member_name', member_info.nome_completo,
    'member_user_id', member_info.user_id,
    'member_email', member_info.email,
    'auth_uid', auth.uid(),
    'policy_allows', policy_result,
    'member_found', CASE WHEN member_id IS NOT NULL THEN true ELSE false END,
    'search_method', CASE 
      WHEN member_info.user_id = auth.uid() THEN 'FOUND_BY_USER_ID'
      WHEN member_info.user_id IS NULL THEN 'FOUND_BY_EMAIL_FALLBACK'
      ELSE 'NOT_FOUND'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;