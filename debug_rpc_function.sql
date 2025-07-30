-- CRIAR FUNÇÃO RPC PARA DEBUG (Execute no Dashboard)
-- Esta função vai permitir testar RLS com auth.uid() real

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
        'tipo', m.tipo
      )
      FROM membros m 
      WHERE m.user_id = auth.uid() 
      AND m.status = 'ativo'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRIAR FUNÇÃO PARA TESTAR POLÍTICA RLS
CREATE OR REPLACE FUNCTION test_balao_policy()
RETURNS json AS $$
DECLARE
  member_id uuid;
  policy_result boolean;
BEGIN
  -- Buscar ID do membro atual
  SELECT m.id INTO member_id
  FROM membros m 
  WHERE m.user_id = auth.uid() 
  AND m.status = 'ativo' 
  AND m.tipo = 'piloto';
  
  -- Testar política
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
    'auth_uid', auth.uid(),
    'policy_allows', policy_result,
    'member_found', CASE WHEN member_id IS NOT NULL THEN true ELSE false END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;