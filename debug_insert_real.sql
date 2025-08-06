-- DEBUG DETALHADO - COMPARAR DEBUG RPC vs INSERT REAL
-- Execute no Dashboard do Supabase

-- 1. CRIAR FUNÇÃO PARA TESTAR INSERT REAL
CREATE OR REPLACE FUNCTION test_insert_real(
  test_prefixo text,
  test_volume integer,
  test_nome text,
  test_obs text
)
RETURNS json AS $$
DECLARE
  member_id uuid;
  insert_result record;
  error_message text;
BEGIN
  -- Buscar membro atual
  SELECT m.id INTO member_id
  FROM membros m 
  WHERE (
    (m.user_id = auth.uid()) OR 
    (m.user_id IS NULL AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  AND m.status = 'ativo' 
  AND m.tipo = 'piloto'
  LIMIT 1;
  
  -- Tentar INSERT real
  BEGIN
    INSERT INTO baloes (
      prefixo,
      volume_m3,
      nome_batismo,
      observacoes,
      proprietario_id,
      ativo
    ) VALUES (
      test_prefixo,
      test_volume,
      test_nome,
      test_obs,
      member_id,
      true
    ) RETURNING * INTO insert_result;
    
    -- Se chegou aqui, deu certo
    RETURN json_build_object(
      'success', true,
      'member_id', member_id,
      'inserted_id', insert_result.id,
      'auth_uid', auth.uid()
    );
    
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
    
    RETURN json_build_object(
      'success', false,
      'error_message', error_message,
      'member_id', member_id,
      'auth_uid', auth.uid(),
      'sqlstate', SQLSTATE
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CRIAR FUNÇÃO PARA MOSTRAR TODAS AS POLÍTICAS
CREATE OR REPLACE FUNCTION debug_all_policies()
RETURNS json AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'policy_name', policyname,
        'command', cmd,
        'permissive', permissive,
        'roles', roles,
        'qual', qual,
        'with_check', with_check
      )
    )
    FROM pg_policies 
    WHERE tablename = 'baloes'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;