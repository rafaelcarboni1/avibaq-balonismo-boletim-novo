-- Migração para criar tabela principal de voos
-- Criada em: 2025-01-11
-- Descrição: Tabela principal para gerenciar voos de balão

-- Criar enums para a tabela de voos
CREATE TYPE periodo_voo AS ENUM ('manha', 'tarde');
CREATE TYPE status_voo_registro AS ENUM ('rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido', 'finalizado', 'cancelado');
CREATE TYPE motivo_cancelamento AS ENUM ('vento', 'chuva', 'teto_baixo', 'problema_tecnico', 'passageiros_ausentes', 'outro');

-- Criar tabela principal de voos
CREATE TABLE voos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados básicos do voo
  data_voo DATE NOT NULL,
  periodo periodo_voo NOT NULL,
  horario_previsto TIME,
  local_decolagem_previsto TEXT,
  
  -- Responsáveis pelo voo
  piloto_id UUID NOT NULL REFERENCES membros(id),
  agencia_id UUID REFERENCES membros(id), -- NULL se piloto individual
  
  -- Status e controle
  status status_voo_registro DEFAULT 'rascunho',
  
  -- Dados de planejamento (Dia-1)
  adultos_previstos INTEGER DEFAULT 0,
  criancas_previstas INTEGER DEFAULT 0,
  observacoes_planejamento TEXT,
  
  -- Dados pós-voo
  adultos_transportados INTEGER,
  criancas_transportadas INTEGER,
  local_pouso TEXT,
  duracao_minutos INTEGER,
  altitude_maxima INTEGER, -- em pés
  observacoes_pos_voo TEXT,
  
  -- Dados de cancelamento
  motivo_cancelamento motivo_cancelamento,
  observacoes_cancelamento TEXT,
  cancelado_em TIMESTAMP WITH TIME ZONE,
  cancelado_por UUID REFERENCES users(id),
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  -- Não pode haver dois voos no mesmo período/data/piloto
  UNIQUE(data_voo, periodo, piloto_id),
  
  -- Piloto deve ser do tipo 'piloto'
  CONSTRAINT check_piloto_tipo CHECK (
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = piloto_id AND tipo = 'piloto'
    )
  ),
  
  -- Se agência for especificada, deve ser do tipo 'agencia'
  CONSTRAINT check_agencia_tipo CHECK (
    agencia_id IS NULL OR EXISTS (
      SELECT 1 FROM membros 
      WHERE id = agencia_id AND tipo = 'agencia'
    )
  ),
  
  -- Se agência for especificada, deve ter vínculo aceito com o piloto
  CONSTRAINT check_vinculo_agencia_piloto CHECK (
    agencia_id IS NULL OR EXISTS (
      SELECT 1 FROM vinculos_agencia_piloto 
      WHERE agencia_id = voos.agencia_id 
      AND piloto_id = voos.piloto_id 
      AND status = 'aceito'
    )
  ),
  
  -- Data do voo não pode ser no passado (exceto para voos já finalizados)
  CONSTRAINT check_data_voo CHECK (
    data_voo >= CURRENT_DATE - INTERVAL '7 days' -- Permite 7 dias no passado para finalização
  ),
  
  -- Validações de números
  CONSTRAINT check_adultos_previstos CHECK (adultos_previstos >= 0),
  CONSTRAINT check_criancas_previstas CHECK (criancas_previstas >= 0),
  CONSTRAINT check_adultos_transportados CHECK (adultos_transportados IS NULL OR adultos_transportados >= 0),
  CONSTRAINT check_criancas_transportadas CHECK (criancas_transportadas IS NULL OR criancas_transportadas >= 0),
  CONSTRAINT check_duracao_minutos CHECK (duracao_minutos IS NULL OR duracao_minutos > 0),
  CONSTRAINT check_altitude_maxima CHECK (altitude_maxima IS NULL OR altitude_maxima > 0)
);

-- Habilitar RLS na tabela voos
ALTER TABLE voos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para voos

-- Pilotos podem ver seus próprios voos
CREATE POLICY "Pilotos podem ver seus voos" ON voos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = voos.piloto_id 
      AND u.id = auth.uid()
      AND m.tipo = 'piloto'
    )
  );

-- Agências podem ver voos onde estão envolvidas
CREATE POLICY "Agências podem ver seus voos" ON voos
  FOR SELECT USING (
    agencia_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = voos.agencia_id 
      AND u.id = auth.uid()
      AND m.tipo = 'agencia'
    )
  );

-- Admins podem ver todos os voos
CREATE POLICY "Admins podem ver todos os voos" ON voos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'meteo', 'tesouraria')
    )
  );

-- Pilotos podem criar voos
CREATE POLICY "Pilotos podem criar voos" ON voos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = voos.piloto_id 
      AND u.id = auth.uid()
      AND m.tipo = 'piloto'
      AND m.status = 'ativo'
    )
  );

-- Agências podem criar voos para pilotos vinculados
CREATE POLICY "Agências podem criar voos para pilotos vinculados" ON voos
  FOR INSERT WITH CHECK (
    agencia_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      JOIN vinculos_agencia_piloto v ON v.agencia_id = m.id
      WHERE m.id = voos.agencia_id 
      AND u.id = auth.uid()
      AND m.tipo = 'agencia'
      AND m.status = 'ativo'
      AND v.piloto_id = voos.piloto_id
      AND v.status = 'aceito'
    )
  );

-- Pilotos podem atualizar seus voos
CREATE POLICY "Pilotos podem atualizar seus voos" ON voos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = voos.piloto_id 
      AND u.id = auth.uid()
      AND m.tipo = 'piloto'
    )
  );

-- Agências podem atualizar voos onde estão envolvidas
CREATE POLICY "Agências podem atualizar seus voos" ON voos
  FOR UPDATE USING (
    agencia_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = voos.agencia_id 
      AND u.id = auth.uid()
      AND m.tipo = 'agencia'
    )
  );

-- Apenas admins podem deletar voos
CREATE POLICY "Apenas admins podem deletar voos" ON voos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin')
    )
  );

-- Criar índices para performance
CREATE INDEX idx_voos_data ON voos(data_voo);
CREATE INDEX idx_voos_piloto ON voos(piloto_id);
CREATE INDEX idx_voos_agencia ON voos(agencia_id);
CREATE INDEX idx_voos_status ON voos(status);
CREATE INDEX idx_voos_periodo ON voos(periodo);
CREATE INDEX idx_voos_created_at ON voos(created_at);
CREATE INDEX idx_voos_data_periodo_piloto ON voos(data_voo, periodo, piloto_id);

-- Função para atualizar timestamp e validar transições de status
CREATE OR REPLACE FUNCTION trigger_voos_update_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar timestamp
  NEW.updated_at = NOW();
  
  -- Validar transições de status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Não pode voltar de finalizado para outros status
    IF OLD.status = 'finalizado' AND NEW.status != 'finalizado' THEN
      RAISE EXCEPTION 'Não é possível alterar status de voo já finalizado';
    END IF;
    
    -- Não pode voltar de cancelado para outros status
    IF OLD.status = 'cancelado' AND NEW.status != 'cancelado' THEN
      RAISE EXCEPTION 'Não é possível alterar status de voo cancelado';
    END IF;
    
    -- Se cancelando, deve ter motivo
    IF NEW.status = 'cancelado' AND NEW.motivo_cancelamento IS NULL THEN
      RAISE EXCEPTION 'Motivo de cancelamento é obrigatório';
    END IF;
    
    -- Se cancelando, registrar timestamp e usuário
    IF NEW.status = 'cancelado' THEN
      NEW.cancelado_em = NOW();
      NEW.cancelado_por = auth.uid();
    END IF;
  END IF;
  
  -- Validar que voo no passado só pode ser finalizado ou cancelado
  IF NEW.data_voo < CURRENT_DATE AND NEW.status NOT IN ('finalizado', 'cancelado') THEN
    RAISE EXCEPTION 'Voos no passado só podem estar finalizados ou cancelados';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_voos_update_validation
  BEFORE UPDATE ON voos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_voos_update_validation();

-- Função para validar dados na inserção
CREATE OR REPLACE FUNCTION trigger_voos_insert_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir created_by se não informado
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  
  -- Validar que piloto está ativo e em dia
  IF NOT EXISTS (
    SELECT 1 FROM membros 
    WHERE id = NEW.piloto_id 
    AND tipo = 'piloto' 
    AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Piloto deve estar ativo para criar voos';
  END IF;
  
  -- Se agência especificada, validar que está ativa
  IF NEW.agencia_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM membros 
    WHERE id = NEW.agencia_id 
    AND tipo = 'agencia' 
    AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Agência deve estar ativa para criar voos';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_voos_insert_validation
  BEFORE INSERT ON voos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_voos_insert_validation();

-- Comentários na tabela
COMMENT ON TABLE voos IS 'Tabela principal para registro e controle de voos de balão';
COMMENT ON COLUMN voos.data_voo IS 'Data do voo planejado';
COMMENT ON COLUMN voos.periodo IS 'Período do voo: manhã ou tarde';
COMMENT ON COLUMN voos.piloto_id IS 'ID do piloto responsável pelo voo';
COMMENT ON COLUMN voos.agencia_id IS 'ID da agência (NULL se piloto individual)';
COMMENT ON COLUMN voos.status IS 'Status atual do voo no processo de execução';
COMMENT ON COLUMN voos.adultos_previstos IS 'Número de adultos planejados para o voo';
COMMENT ON COLUMN voos.criancas_previstas IS 'Número de crianças planejadas para o voo';