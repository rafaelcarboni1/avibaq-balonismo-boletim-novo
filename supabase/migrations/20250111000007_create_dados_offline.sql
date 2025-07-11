-- Migração para criar tabela de dados offline (PWA)
-- Criada em: 2025-01-11
-- Descrição: Sistema de sincronização para funcionalidade offline PWA

-- Criar enum para tipos de dados offline
CREATE TYPE tipo_dados_offline AS ENUM ('voo', 'checklist', 'anexo', 'balao', 'vinculo');

-- Criar enum para status de sincronização
CREATE TYPE status_sync AS ENUM ('pendente', 'sincronizando', 'sincronizado', 'erro', 'conflito');

-- Criar tabela de dados offline
CREATE TABLE dados_offline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tipo e identificação dos dados
  tipo_dados tipo_dados_offline NOT NULL,
  dados_json JSONB NOT NULL,
  operacao TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  
  -- Controle de sincronização
  status status_sync DEFAULT 'pendente',
  tentativas_sync INTEGER DEFAULT 0,
  max_tentativas INTEGER DEFAULT 5,
  ultimo_erro TEXT,
  erro_detalhado JSONB,
  
  -- Identificador temporário offline (UUID gerado no cliente)
  temp_id UUID NOT NULL,
  
  -- Identificador real após sincronização
  real_id UUID,
  
  -- Informações de conflito
  conflito_detectado BOOLEAN DEFAULT false,
  dados_servidor JSONB, -- Dados que estavam no servidor em caso de conflito
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sincronizado_em TIMESTAMP WITH TIME ZONE,
  ultima_tentativa TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  -- Dados JSON não podem estar vazios
  CONSTRAINT check_dados_json_validos CHECK (jsonb_typeof(dados_json) = 'object'),
  
  -- Operação deve ser válida
  CONSTRAINT check_operacao_valida CHECK (operacao IN ('CREATE', 'UPDATE', 'DELETE')),
  
  -- Se sincronizado, deve ter real_id
  CONSTRAINT check_sincronizado_tem_real_id CHECK (
    status != 'sincronizado' OR real_id IS NOT NULL
  ),
  
  -- Tentativas não podem exceder o máximo
  CONSTRAINT check_tentativas_validas CHECK (tentativas_sync <= max_tentativas)
);

-- Habilitar RLS na tabela dados_offline
ALTER TABLE dados_offline ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para dados_offline
-- Usuários só podem ver seus próprios dados offline
CREATE POLICY "Usuários veem apenas seus dados offline" ON dados_offline
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuários podem inserir seus dados offline" ON dados_offline
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seus dados offline" ON dados_offline
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar seus dados offline" ON dados_offline
  FOR DELETE USING (user_id = auth.uid());

-- Admins podem ver todos os dados offline (para debugging)
CREATE POLICY "Admins podem ver todos os dados offline" ON dados_offline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Criar índices para performance
CREATE INDEX idx_dados_offline_user ON dados_offline(user_id);
CREATE INDEX idx_dados_offline_status ON dados_offline(status);
CREATE INDEX idx_dados_offline_tipo ON dados_offline(tipo_dados);
CREATE INDEX idx_dados_offline_temp_id ON dados_offline(temp_id);
CREATE INDEX idx_dados_offline_real_id ON dados_offline(real_id);
CREATE INDEX idx_dados_offline_created_at ON dados_offline(created_at);
CREATE INDEX idx_dados_offline_user_status ON dados_offline(user_id, status);
CREATE INDEX idx_dados_offline_pendentes ON dados_offline(user_id, status) WHERE status = 'pendente';

-- Função para processar fila de sincronização
CREATE OR REPLACE FUNCTION processar_fila_sincronizacao(p_user_id UUID, p_limite INTEGER DEFAULT 10)
RETURNS TABLE(
  item_id UUID,
  tipo_dados tipo_dados_offline,
  operacao TEXT,
  dados_json JSONB,
  temp_id UUID
) AS $$
BEGIN
  -- Marcar itens como 'sincronizando' e retornar para processamento
  RETURN QUERY
  UPDATE dados_offline 
  SET 
    status = 'sincronizando',
    ultima_tentativa = NOW(),
    tentativas_sync = tentativas_sync + 1
  WHERE id IN (
    SELECT do.id 
    FROM dados_offline do
    WHERE do.user_id = p_user_id 
    AND do.status = 'pendente'
    AND do.tentativas_sync < do.max_tentativas
    ORDER BY do.created_at ASC
    LIMIT p_limite
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id, dados_offline.tipo_dados, dados_offline.operacao, dados_offline.dados_json, dados_offline.temp_id;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar item como sincronizado
CREATE OR REPLACE FUNCTION marcar_sincronizado(p_item_id UUID, p_real_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dados_offline 
  SET 
    status = 'sincronizado',
    real_id = p_real_id,
    sincronizado_em = NOW(),
    ultimo_erro = NULL,
    erro_detalhado = NULL
  WHERE id = p_item_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para marcar item com erro
CREATE OR REPLACE FUNCTION marcar_erro_sincronizacao(
  p_item_id UUID, 
  p_erro TEXT, 
  p_erro_detalhado JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  tentativas_atuais INTEGER;
  max_tent INTEGER;
BEGIN
  -- Obter tentativas atuais
  SELECT tentativas_sync, max_tentativas 
  INTO tentativas_atuais, max_tent
  FROM dados_offline 
  WHERE id = p_item_id AND user_id = auth.uid();
  
  -- Atualizar com erro
  UPDATE dados_offline 
  SET 
    status = CASE 
      WHEN tentativas_atuais >= max_tent THEN 'erro'::status_sync
      ELSE 'pendente'::status_sync
    END,
    ultimo_erro = p_erro,
    erro_detalhado = p_erro_detalhado
  WHERE id = p_item_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para detectar e marcar conflitos
CREATE OR REPLACE FUNCTION marcar_conflito(
  p_item_id UUID, 
  p_dados_servidor JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE dados_offline 
  SET 
    status = 'conflito',
    conflito_detectado = true,
    dados_servidor = p_dados_servidor,
    ultimo_erro = 'Conflito de dados detectado - dados foram modificados no servidor'
  WHERE id = p_item_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para resolver conflito (escolher versão do cliente ou servidor)
CREATE OR REPLACE FUNCTION resolver_conflito(
  p_item_id UUID, 
  p_usar_servidor BOOLEAN DEFAULT false
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_usar_servidor THEN
    -- Usar dados do servidor - marcar como sincronizado
    UPDATE dados_offline 
    SET 
      status = 'sincronizado',
      dados_json = dados_servidor,
      conflito_detectado = false,
      sincronizado_em = NOW()
    WHERE id = p_item_id AND user_id = auth.uid();
  ELSE
    -- Usar dados do cliente - voltar para pendente
    UPDATE dados_offline 
    SET 
      status = 'pendente',
      conflito_detectado = false,
      dados_servidor = NULL,
      tentativas_sync = 0
    WHERE id = p_item_id AND user_id = auth.uid();
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar dados sincronizados antigos
CREATE OR REPLACE FUNCTION limpar_dados_sincronizados(p_dias_retencao INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  registros_removidos INTEGER;
BEGIN
  DELETE FROM dados_offline 
  WHERE status = 'sincronizado'
  AND sincronizado_em < NOW() - INTERVAL '1 day' * p_dias_retencao;
  
  GET DIAGNOSTICS registros_removidos = ROW_COUNT;
  RETURN registros_removidos;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar dados antes de inserir
CREATE OR REPLACE FUNCTION trigger_dados_offline_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar estrutura básica dos dados JSON baseado no tipo
  CASE NEW.tipo_dados
    WHEN 'voo' THEN
      IF NOT (NEW.dados_json ? 'data_voo' AND NEW.dados_json ? 'periodo') THEN
        RAISE EXCEPTION 'Dados de voo devem conter data_voo e periodo';
      END IF;
      
    WHEN 'checklist' THEN
      IF NOT (NEW.dados_json ? 'voo_id' AND NEW.dados_json ? 'bloco') THEN
        RAISE EXCEPTION 'Dados de checklist devem conter voo_id e bloco';
      END IF;
      
    WHEN 'anexo' THEN
      IF NOT (NEW.dados_json ? 'voo_id' AND NEW.dados_json ? 'tipo') THEN
        RAISE EXCEPTION 'Dados de anexo devem conter voo_id e tipo';
      END IF;
      
    WHEN 'balao' THEN
      IF NOT (NEW.dados_json ? 'prefixo' AND NEW.dados_json ? 'volume_m3') THEN
        RAISE EXCEPTION 'Dados de balão devem conter prefixo e volume_m3';
      END IF;
      
    WHEN 'vinculo' THEN
      IF NOT (NEW.dados_json ? 'agencia_id' AND NEW.dados_json ? 'piloto_id') THEN
        RAISE EXCEPTION 'Dados de vínculo devem conter agencia_id e piloto_id';
      END IF;
  END CASE;
  
  -- Garantir que temp_id está definido
  IF NEW.temp_id IS NULL THEN
    NEW.temp_id := gen_random_uuid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dados_offline_validation
  BEFORE INSERT ON dados_offline
  FOR EACH ROW
  EXECUTE FUNCTION trigger_dados_offline_validation();

-- View para estatísticas de sincronização
CREATE VIEW vw_stats_sincronizacao AS
SELECT 
  u.id as user_id,
  u.nome as usuario_nome,
  COUNT(*) as total_itens,
  COUNT(CASE WHEN do.status = 'pendente' THEN 1 END) as pendentes,
  COUNT(CASE WHEN do.status = 'sincronizando' THEN 1 END) as sincronizando,
  COUNT(CASE WHEN do.status = 'sincronizado' THEN 1 END) as sincronizados,
  COUNT(CASE WHEN do.status = 'erro' THEN 1 END) as com_erro,
  COUNT(CASE WHEN do.status = 'conflito' THEN 1 END) as conflitos,
  COUNT(CASE WHEN do.tipo_dados = 'voo' THEN 1 END) as voos,
  COUNT(CASE WHEN do.tipo_dados = 'checklist' THEN 1 END) as checklists,
  COUNT(CASE WHEN do.tipo_dados = 'anexo' THEN 1 END) as anexos,
  MIN(do.created_at) as primeiro_item,
  MAX(do.created_at) as ultimo_item
FROM users u
LEFT JOIN dados_offline do ON do.user_id = u.id
GROUP BY u.id, u.nome
ORDER BY total_itens DESC;

-- View para itens com problemas de sincronização
CREATE VIEW vw_problemas_sincronizacao AS
SELECT 
  do.id,
  u.nome as usuario_nome,
  do.tipo_dados,
  do.operacao,
  do.status,
  do.tentativas_sync,
  do.max_tentativas,
  do.ultimo_erro,
  do.created_at,
  do.ultima_tentativa,
  CASE 
    WHEN do.status = 'erro' THEN 'Falha após ' || do.max_tentativas || ' tentativas'
    WHEN do.status = 'conflito' THEN 'Conflito de dados detectado'
    WHEN do.tentativas_sync >= 3 THEN 'Múltiplas tentativas falharam'
    ELSE 'Outro problema'
  END as tipo_problema
FROM dados_offline do
JOIN users u ON u.id = do.user_id
WHERE do.status IN ('erro', 'conflito') 
   OR do.tentativas_sync >= 3
ORDER BY do.created_at DESC;

-- Comentários na tabela
COMMENT ON TABLE dados_offline IS 'Fila de sincronização para funcionalidade offline PWA';
COMMENT ON COLUMN dados_offline.user_id IS 'ID do usuário que criou o item offline';
COMMENT ON COLUMN dados_offline.tipo_dados IS 'Tipo de dados: voo, checklist, anexo, balao, vinculo';
COMMENT ON COLUMN dados_offline.dados_json IS 'Dados completos do item em formato JSON';
COMMENT ON COLUMN dados_offline.operacao IS 'Operação realizada: CREATE, UPDATE, DELETE';
COMMENT ON COLUMN dados_offline.temp_id IS 'ID temporário gerado no cliente (UUID)';
COMMENT ON COLUMN dados_offline.real_id IS 'ID real no servidor após sincronização';
COMMENT ON VIEW vw_stats_sincronizacao IS 'Estatísticas de sincronização por usuário';
COMMENT ON VIEW vw_problemas_sincronizacao IS 'Itens com problemas de sincronização';