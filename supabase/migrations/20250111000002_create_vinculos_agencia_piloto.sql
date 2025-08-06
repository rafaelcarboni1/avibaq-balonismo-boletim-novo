-- Migração para criar tabela de vínculos agência-piloto
-- Criada em: 2025-01-11
-- Descrição: Sistema de convites e vínculos entre agências e pilotos

-- Criar enum para status do vínculo
CREATE TYPE vinculo_status AS ENUM ('pendente', 'aceito', 'recusado');

-- Criar tabela de vínculos agência-piloto
CREATE TABLE vinculos_agencia_piloto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  piloto_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  status vinculo_status DEFAULT 'pendente',
  convite_enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  respondido_em TIMESTAMP WITH TIME ZONE,
  observacoes TEXT, -- Mensagem do convite ou motivo da recusa
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Não pode haver vínculo duplicado
  UNIQUE(agencia_id, piloto_id),
  
  -- Constraint: agência deve ser do tipo 'agencia'
  CONSTRAINT check_agencia_tipo CHECK (
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = agencia_id AND tipo = 'agencia'
    )
  ),
  
  -- Constraint: piloto deve ser do tipo 'piloto'
  CONSTRAINT check_piloto_tipo CHECK (
    EXISTS (
      SELECT 1 FROM membros 
      WHERE id = piloto_id AND tipo = 'piloto'
    )
  ),
  
  -- Constraint: não pode vincular a si mesmo
  CONSTRAINT check_nao_auto_vinculo CHECK (agencia_id != piloto_id)
);

-- Habilitar RLS na tabela vínculos
ALTER TABLE vinculos_agencia_piloto ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para vínculos

-- Agências podem ver seus vínculos
CREATE POLICY "Agências podem ver seus vínculos" ON vinculos_agencia_piloto
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = vinculos_agencia_piloto.agencia_id 
      AND u.id = auth.uid()
      AND m.tipo = 'agencia'
    )
  );

-- Pilotos podem ver vínculos direcionados a eles
CREATE POLICY "Pilotos podem ver vínculos direcionados a eles" ON vinculos_agencia_piloto
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = vinculos_agencia_piloto.piloto_id 
      AND u.id = auth.uid()
      AND m.tipo = 'piloto'
    )
  );

-- Admins podem ver todos os vínculos
CREATE POLICY "Admins podem ver todos os vínculos" ON vinculos_agencia_piloto
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'meteo', 'tesouraria')
    )
  );

-- Agências podem criar vínculos (enviar convites)
CREATE POLICY "Agências podem criar vínculos" ON vinculos_agencia_piloto
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = vinculos_agencia_piloto.agencia_id 
      AND u.id = auth.uid()
      AND m.tipo = 'agencia'
      AND m.status = 'ativo'
    )
  );

-- Pilotos podem atualizar vínculos direcionados a eles (aceitar/recusar)
CREATE POLICY "Pilotos podem responder convites" ON vinculos_agencia_piloto
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = vinculos_agencia_piloto.piloto_id 
      AND u.id = auth.uid()
      AND m.tipo = 'piloto'
    )
  );

-- Agências podem atualizar seus vínculos (cancelar convites pendentes)
CREATE POLICY "Agências podem atualizar seus vínculos" ON vinculos_agencia_piloto
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = vinculos_agencia_piloto.agencia_id 
      AND u.id = auth.uid()
      AND m.tipo = 'agencia'
    )
  );

-- Agências podem deletar vínculos pendentes
CREATE POLICY "Agências podem deletar vínculos pendentes" ON vinculos_agencia_piloto
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = vinculos_agencia_piloto.agencia_id 
      AND u.id = auth.uid()
      AND m.tipo = 'agencia'
    )
    AND status = 'pendente'
  );

-- Criar índices para performance
CREATE INDEX idx_vinculos_agencia ON vinculos_agencia_piloto(agencia_id);
CREATE INDEX idx_vinculos_piloto ON vinculos_agencia_piloto(piloto_id);
CREATE INDEX idx_vinculos_status ON vinculos_agencia_piloto(status);
CREATE INDEX idx_vinculos_convite_enviado ON vinculos_agencia_piloto(convite_enviado_em);

-- Função para atualizar timestamp quando responder convite
CREATE OR REPLACE FUNCTION trigger_vinculos_update_respondido()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status mudou de 'pendente' para 'aceito' ou 'recusado'
  IF OLD.status = 'pendente' AND NEW.status IN ('aceito', 'recusado') THEN
    NEW.respondido_em = NOW();
  END IF;
  
  -- Sempre atualizar updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vinculos_update_respondido
  BEFORE UPDATE ON vinculos_agencia_piloto
  FOR EACH ROW
  EXECUTE FUNCTION trigger_vinculos_update_respondido();

-- Função para validar que apenas pilotos e agências ativas podem ter vínculos
CREATE OR REPLACE FUNCTION trigger_vinculos_validar_membros()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar agência
  IF NOT EXISTS (
    SELECT 1 FROM membros 
    WHERE id = NEW.agencia_id 
    AND tipo = 'agencia' 
    AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Agência deve estar ativa para criar vínculos';
  END IF;
  
  -- Validar piloto
  IF NOT EXISTS (
    SELECT 1 FROM membros 
    WHERE id = NEW.piloto_id 
    AND tipo = 'piloto' 
    AND status = 'ativo'
  ) THEN
    RAISE EXCEPTION 'Piloto deve estar ativo para participar de vínculos';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vinculos_validar_membros
  BEFORE INSERT ON vinculos_agencia_piloto
  FOR EACH ROW
  EXECUTE FUNCTION trigger_vinculos_validar_membros();

-- Comentários na tabela
COMMENT ON TABLE vinculos_agencia_piloto IS 'Sistema de convites e vínculos entre agências e pilotos';
COMMENT ON COLUMN vinculos_agencia_piloto.agencia_id IS 'ID da agência que enviou o convite';
COMMENT ON COLUMN vinculos_agencia_piloto.piloto_id IS 'ID do piloto convidado';
COMMENT ON COLUMN vinculos_agencia_piloto.status IS 'Status do vínculo: pendente, aceito ou recusado';
COMMENT ON COLUMN vinculos_agencia_piloto.observacoes IS 'Mensagem do convite ou motivo da resposta';