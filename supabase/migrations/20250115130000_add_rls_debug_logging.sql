-- Migração para adicionar sistema de logging de RLS para debug
-- Data: 2025-01-15
-- Propósito: Diagnosticar problemas de criação de voos

-- Tabela para armazenar logs de debug de RLS
CREATE TABLE IF NOT EXISTS rls_debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE, SELECT
  user_id UUID,
  user_email TEXT,
  policy_name TEXT,
  policy_result BOOLEAN,
  context_data JSONB,
  error_message TEXT,
  session_info JSONB
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rls_debug_logs_created_at ON rls_debug_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rls_debug_logs_table_operation ON rls_debug_logs(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_rls_debug_logs_user_id ON rls_debug_logs(user_id);

-- Função para log de debug de RLS
CREATE OR REPLACE FUNCTION log_rls_debug(
  p_table_name TEXT,
  p_operation TEXT,
  p_policy_name TEXT DEFAULT NULL,
  p_policy_result BOOLEAN DEFAULT NULL,
  p_context_data JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  session_data JSONB;
BEGIN
  -- Obter informações do usuário atual
  BEGIN
    SELECT auth.uid() INTO current_user_id;
    SELECT auth.email() INTO current_user_email;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
    current_user_email := NULL;
  END;

  -- Preparar dados da sessão
  session_data := jsonb_build_object(
    'current_setting_role', current_setting('role', true),
    'current_user', current_user,
    'session_user', session_user,
    'current_timestamp', NOW()
  );

  -- Inserir log (usando SECURITY DEFINER para bypass RLS)
  INSERT INTO rls_debug_logs (
    table_name,
    operation,
    user_id,
    user_email,
    policy_name,
    policy_result,
    context_data,
    error_message,
    session_info
  ) VALUES (
    p_table_name,
    p_operation,
    current_user_id,
    current_user_email,
    p_policy_name,
    p_policy_result,
    p_context_data,
    p_error_message,
    session_data
  );
EXCEPTION WHEN OTHERS THEN
  -- Não falhar se o log não funcionar
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é membro ativo (com logging)
CREATE OR REPLACE FUNCTION is_user_member_owner_with_log(
  p_member_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  member_record RECORD;
  result BOOLEAN := FALSE;
BEGIN
  -- Obter usuário atual
  current_user_id := auth.uid();
  current_user_email := auth.email();
  
  -- Log início da verificação
  PERFORM log_rls_debug(
    'membros',
    'OWNERSHIP_CHECK',
    'is_user_member_owner_with_log',
    NULL,
    jsonb_build_object(
      'checking_member_id', p_member_id,
      'current_user_id', current_user_id,
      'current_user_email', current_user_email
    )
  );

  -- Buscar membro por user_id
  SELECT * INTO member_record
  FROM membros
  WHERE id = p_member_id
    AND (user_id = current_user_id OR email = current_user_email)
    AND status = 'ativo';

  IF FOUND THEN
    result := TRUE;
    -- Log sucesso
    PERFORM log_rls_debug(
      'membros',
      'OWNERSHIP_CHECK',
      'is_user_member_owner_with_log',
      TRUE,
      jsonb_build_object(
        'member_found', TRUE,
        'member_id', member_record.id,
        'member_nome', member_record.nome,
        'member_tipo', member_record.tipo,
        'member_status', member_record.status,
        'matched_by', CASE 
          WHEN member_record.user_id = current_user_id THEN 'user_id'
          WHEN member_record.email = current_user_email THEN 'email'
          ELSE 'unknown'
        END
      )
    );
  ELSE
    -- Log falha
    PERFORM log_rls_debug(
      'membros',
      'OWNERSHIP_CHECK',
      'is_user_member_owner_with_log',
      FALSE,
      jsonb_build_object(
        'member_found', FALSE,
        'searched_member_id', p_member_id
      )
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar vínculo agência-piloto (com logging)
CREATE OR REPLACE FUNCTION check_agencia_piloto_vinculo_with_log(
  p_agencia_id UUID,
  p_piloto_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  vinculo_record RECORD;
  result BOOLEAN := FALSE;
BEGIN
  -- Log início da verificação
  PERFORM log_rls_debug(
    'vinculos_agencia_piloto',
    'VINCULO_CHECK',
    'check_agencia_piloto_vinculo_with_log',
    NULL,
    jsonb_build_object(
      'agencia_id', p_agencia_id,
      'piloto_id', p_piloto_id
    )
  );

  -- Buscar vínculo ativo
  SELECT * INTO vinculo_record
  FROM vinculos_agencia_piloto
  WHERE agencia_id = p_agencia_id
    AND piloto_id = p_piloto_id
    AND status = 'aceito';

  IF FOUND THEN
    result := TRUE;
    -- Log sucesso
    PERFORM log_rls_debug(
      'vinculos_agencia_piloto',
      'VINCULO_CHECK',
      'check_agencia_piloto_vinculo_with_log',
      TRUE,
      jsonb_build_object(
        'vinculo_found', TRUE,
        'vinculo_id', vinculo_record.id,
        'vinculo_status', vinculo_record.status,
        'vinculo_created_at', vinculo_record.created_at
      )
    );
  ELSE
    -- Log falha
    PERFORM log_rls_debug(
      'vinculos_agencia_piloto',
      'VINCULO_CHECK',
      'check_agencia_piloto_vinculo_with_log',
      FALSE,
      jsonb_build_object(
        'vinculo_found', FALSE
      )
    );
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para log automático de tentativas de INSERT em voos
CREATE OR REPLACE FUNCTION log_voos_insert_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Log da tentativa de inserção
  PERFORM log_rls_debug(
    'voos',
    'INSERT_ATTEMPT',
    'voos_insert_trigger',
    NULL,
    jsonb_build_object(
      'new_voo_data', row_to_json(NEW),
      'piloto_id', NEW.piloto_id,
      'agencia_id', NEW.agencia_id,
      'data_voo', NEW.data_voo,
      'periodo', NEW.periodo,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger BEFORE INSERT para capturar tentativas
DROP TRIGGER IF EXISTS trigger_log_voos_insert ON voos;
CREATE TRIGGER trigger_log_voos_insert
  BEFORE INSERT ON voos
  FOR EACH ROW
  EXECUTE FUNCTION log_voos_insert_attempt();

-- Função para limpar logs antigos (manter apenas últimos 7 dias)
CREATE OR REPLACE FUNCTION cleanup_rls_debug_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rls_debug_logs
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para facilitar consulta dos logs
CREATE OR REPLACE VIEW vw_rls_debug_recent AS
SELECT 
  id,
  created_at,
  table_name,
  operation,
  user_email,
  policy_name,
  policy_result,
  context_data,
  error_message,
  session_info
FROM rls_debug_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Permissões para a tabela de logs (apenas leitura para usuários autenticados)
ALTER TABLE rls_debug_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura dos próprios logs
CREATE POLICY "Usuários podem ver próprios logs RLS" ON rls_debug_logs
  FOR SELECT USING (
    user_id = auth.uid() OR 
    user_email = auth.email()
  );

-- Política para permitir que qualquer usuário autenticado veja logs (para debug)
-- Em produção, isso deve ser restrito apenas aos próprios logs do usuário
CREATE POLICY "Usuários autenticados podem ver logs RLS" ON rls_debug_logs
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Comentários
COMMENT ON TABLE rls_debug_logs IS 'Logs de debug para políticas RLS - usado para diagnosticar problemas de acesso';
COMMENT ON FUNCTION log_rls_debug IS 'Função para registrar eventos de debug de RLS';
COMMENT ON FUNCTION is_user_member_owner_with_log IS 'Versão com logging da função de verificação de propriedade de membro';
COMMENT ON FUNCTION check_agencia_piloto_vinculo_with_log IS 'Função para verificar vínculo agência-piloto com logging';
COMMENT ON VIEW vw_rls_debug_recent IS 'View dos logs de RLS das últimas 24 horas';