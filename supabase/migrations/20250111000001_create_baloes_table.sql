-- Migração para criar tabela de balões
-- Criada em: 2025-01-11
-- Descrição: Tabela para gerenciar balões de pilotos e agências

-- Criar tabela de balões
CREATE TABLE baloes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefixo TEXT NOT NULL UNIQUE, -- Formato: PP-XXX
  volume_m3 INTEGER NOT NULL,
  nome_batismo TEXT, -- Nome opcional do balão
  proprietario_id UUID NOT NULL REFERENCES membros(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela balões
ALTER TABLE baloes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para balões
CREATE POLICY "Proprietários podem ver seus balões" ON baloes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = baloes.proprietario_id 
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Admins podem ver todos os balões" ON baloes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'meteo', 'tesouraria')
    )
  );

CREATE POLICY "Proprietários podem criar balões" ON baloes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = baloes.proprietario_id 
      AND u.id = auth.uid()
      AND m.status = 'ativo'
    )
  );

CREATE POLICY "Proprietários podem atualizar seus balões" ON baloes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = baloes.proprietario_id 
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Proprietários podem deletar seus balões" ON baloes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM membros m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = baloes.proprietario_id 
      AND u.id = auth.uid()
    )
  );

-- Criar índices para performance
CREATE INDEX idx_baloes_proprietario ON baloes(proprietario_id);
CREATE INDEX idx_baloes_ativo ON baloes(ativo);
CREATE INDEX idx_baloes_prefixo ON baloes(prefixo);
CREATE INDEX idx_baloes_created_at ON baloes(created_at);

-- Função para validar prefixo de balão (formato PP-XXX)
CREATE OR REPLACE FUNCTION validar_prefixo_balao(prefixo TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Valida formato PP-XXX onde PP são letras e XXX são letras/números
  RETURN prefixo ~ '^[A-Z]{2}-[A-Z0-9]{3}$';
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar prefixo antes de inserir/atualizar
CREATE OR REPLACE FUNCTION trigger_validar_prefixo_balao()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT validar_prefixo_balao(NEW.prefixo) THEN
    RAISE EXCEPTION 'Prefixo deve seguir o formato PP-XXX (ex: PT-ABC)';
  END IF;
  
  -- Atualizar timestamp de updated_at
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_baloes_validar_prefixo
  BEFORE INSERT OR UPDATE ON baloes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validar_prefixo_balao();

-- Comentários na tabela
COMMENT ON TABLE baloes IS 'Tabela para gerenciar balões de pilotos e agências';
COMMENT ON COLUMN baloes.prefixo IS 'Prefixo do balão no formato PP-XXX';
COMMENT ON COLUMN baloes.volume_m3 IS 'Volume do balão em metros cúbicos';
COMMENT ON COLUMN baloes.nome_batismo IS 'Nome de batismo opcional do balão';
COMMENT ON COLUMN baloes.proprietario_id IS 'ID do membro proprietário (piloto ou agência)';