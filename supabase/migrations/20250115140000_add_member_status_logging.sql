-- Migração para adicionar logs específicos de status de membros e vínculos
-- Data: 2025-01-15
-- Objetivo: Rastrear verificações de status de membros e vínculos agência-piloto

-- Função para verificar e logar status de membro
CREATE OR REPLACE FUNCTION check_and_log_member_status(
  p_user_id UUID,
  p_operation TEXT DEFAULT 'check_member_status'
)
RETURNS TABLE(
  member_exists BOOLEAN,
  member_type membro_tipo,
  member_status TEXT,
  member_id UUID
) AS $$
DECLARE
  v_member_record RECORD;
  v_log_data JSONB;
BEGIN
  -- Buscar dados do membro
  SELECT m.id, m.tipo, m.status, m.user_id
  INTO v_member_record
  FROM membros m
  WHERE m.user_id = p_user_id;
  
  -- Preparar dados para log
  v_log_data := jsonb_build_object(
    'user_id', p_user_id,
    'member_found', v_member_record IS NOT NULL,
    'member_data', CASE 
      WHEN v_member_record IS NOT NULL THEN
        jsonb_build_object(
          'id', v_member_record.id,
          'tipo', v_member_record.tipo,
          'status', v_member_record.status
        )
      ELSE NULL
    END
  );
  
  -- Registrar log
  PERFORM log_rls_debug(
    p_operation,
    'membros',
    p_user_id,
    v_log_data,
    CASE WHEN v_member_record IS NULL THEN 'Membro não encontrado' ELSE NULL END
  );
  
  -- Retornar resultado
  RETURN QUERY SELECT
    v_member_record IS NOT NULL,
    COALESCE(v_member_record.tipo, NULL),
    COALESCE(v_member_record.status, 'not_found'),
    COALESCE(v_member_record.id, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar e logar vínculo agência-piloto
CREATE OR REPLACE FUNCTION check_and_log_agencia_piloto_vinculo(
  p_agencia_id UUID,
  p_piloto_id UUID,
  p_operation TEXT DEFAULT 'check_agencia_piloto_vinculo'
)
RETURNS TABLE(
  vinculo_exists BOOLEAN,
  vinculo_ativo BOOLEAN,
  vinculo_id UUID
) AS $$
DECLARE
  v_vinculo_record RECORD;
  v_log_data JSONB;
BEGIN
  -- Buscar vínculo
  SELECT v.id, v.status, v.agencia_id, v.piloto_id
  INTO v_vinculo_record
  FROM agencia_piloto_vinculos v
  WHERE v.agencia_id = p_agencia_id 
    AND v.piloto_id = p_piloto_id;
  
  -- Preparar dados para log
  v_log_data := jsonb_build_object(
    'agencia_id', p_agencia_id,
    'piloto_id', p_piloto_id,
    'vinculo_found', v_vinculo_record IS NOT NULL,
    'vinculo_data', CASE 
      WHEN v_vinculo_record IS NOT NULL THEN
        jsonb_build_object(
          'id', v_vinculo_record.id,
          'status', v_vinculo_record.status,
          'is_active', v_vinculo_record.status = 'ativo'
        )
      ELSE NULL
    END
  );
  
  -- Registrar log
  PERFORM log_rls_debug(
    p_operation,
    'agencia_piloto_vinculos',
    auth.uid(),
    v_log_data,
    CASE 
      WHEN v_vinculo_record IS NULL THEN 'Vínculo não encontrado'
      WHEN v_vinculo_record.status != 'ativo' THEN 'Vínculo inativo: ' || v_vinculo_record.status
      ELSE NULL
    END
  );
  
  -- Retornar resultado
  RETURN QUERY SELECT
    v_vinculo_record IS NOT NULL,
    COALESCE(v_vinculo_record.status = 'ativo', false),
    COALESCE(v_vinculo_record.id, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar permissões completas de criação de voo
CREATE OR REPLACE FUNCTION check_and_log_voo_creation_permissions(
  p_user_id UUID,
  p_piloto_id UUID DEFAULT NULL,
  p_agencia_id UUID DEFAULT NULL
)
RETURNS TABLE(
  can_create_voo BOOLEAN,
  permission_type TEXT,
  error_reason TEXT
) AS $$
DECLARE
  v_member_data RECORD;
  v_vinculo_data RECORD;
  v_can_create BOOLEAN := false;
  v_permission_type TEXT := 'none';
  v_error_reason TEXT := NULL;
  v_log_data JSONB;
BEGIN
  -- Verificar status do membro
  SELECT * INTO v_member_data
  FROM check_and_log_member_status(p_user_id, 'voo_creation_member_check');
  
  IF NOT v_member_data.member_exists THEN
    v_error_reason := 'Usuário não é membro ativo';
  ELSIF v_member_data.member_status != 'ativo' THEN
    v_error_reason := 'Membro com status inativo: ' || v_member_data.member_status;
  ELSIF v_member_data.member_type = 'piloto' THEN
    -- Piloto pode criar voos diretamente
    IF p_piloto_id IS NULL OR p_piloto_id = v_member_data.member_id THEN
      v_can_create := true;
      v_permission_type := 'piloto_direto';
    ELSE
      v_error_reason := 'Piloto tentando criar voo para outro piloto';
    END IF;
  ELSIF v_member_data.member_type = 'agencia' THEN
    -- Agência precisa ter vínculo ativo com o piloto
    IF p_piloto_id IS NULL THEN
      v_error_reason := 'Agência deve especificar piloto_id';
    ELSE
      SELECT * INTO v_vinculo_data
      FROM check_and_log_agencia_piloto_vinculo(
        v_member_data.member_id, 
        p_piloto_id, 
        'voo_creation_vinculo_check'
      );
      
      IF v_vinculo_data.vinculo_exists AND v_vinculo_data.vinculo_ativo THEN
        v_can_create := true;
        v_permission_type := 'agencia_com_vinculo';
      ELSE
        v_error_reason := 'Agência sem vínculo ativo com o piloto';
      END IF;
    END IF;
  END IF;
  
  -- Preparar dados completos para log
  v_log_data := jsonb_build_object(
    'user_id', p_user_id,
    'piloto_id', p_piloto_id,
    'agencia_id', p_agencia_id,
    'member_data', row_to_json(v_member_data),
    'vinculo_data', row_to_json(v_vinculo_data),
    'can_create', v_can_create,
    'permission_type', v_permission_type,
    'error_reason', v_error_reason
  );
  
  -- Registrar log final
  PERFORM log_rls_debug(
    'voo_creation_permission_check',
    'voos',
    p_user_id,
    v_log_data,
    v_error_reason
  );
  
  -- Retornar resultado
  RETURN QUERY SELECT
    v_can_create,
    v_permission_type,
    v_error_reason;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para logar tentativas de inserção em voos com verificação completa
CREATE OR REPLACE FUNCTION trigger_log_voos_insert_detailed()
RETURNS TRIGGER AS $$
DECLARE
  v_permission_check RECORD;
BEGIN
  -- Verificar permissões completas
  SELECT * INTO v_permission_check
  FROM check_and_log_voo_creation_permissions(
    auth.uid(),
    NEW.piloto_id,
    NEW.agencia_id
  );
  
  -- Log adicional da tentativa de inserção
  PERFORM log_rls_debug(
    'voos_insert_attempt',
    'voos',
    auth.uid(),
    jsonb_build_object(
      'voo_data', row_to_json(NEW),
      'permission_check_result', row_to_json(v_permission_check),
      'auth_uid', auth.uid(),
      'session_user', session_user,
      'current_user', current_user
    ),
    CASE WHEN NOT v_permission_check.can_create_voo THEN v_permission_check.error_reason ELSE NULL END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Substituir o trigger anterior
DROP TRIGGER IF EXISTS trigger_log_voos_insert ON voos;
CREATE TRIGGER trigger_log_voos_insert_detailed
  BEFORE INSERT ON voos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_voos_insert_detailed();

-- Conceder permissões para as novas funções
GRANT EXECUTE ON FUNCTION check_and_log_member_status(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_and_log_agencia_piloto_vinculo(UUID, UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_and_log_voo_creation_permissions(UUID, UUID, UUID) TO authenticated, anon;

-- Comentários para documentação
COMMENT ON FUNCTION check_and_log_member_status IS 'Verifica status de membro e registra log detalhado';
COMMENT ON FUNCTION check_and_log_agencia_piloto_vinculo IS 'Verifica vínculo agência-piloto e registra log detalhado';
COMMENT ON FUNCTION check_and_log_voo_creation_permissions IS 'Verifica permissões completas para criação de voo com logs detalhados';