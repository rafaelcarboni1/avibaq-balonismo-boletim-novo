-- Migração para criar tabela de relação voos-balões
-- Criada em: 2025-01-11
-- Descrição: Tabela para relacionar voos com múltiplos balões e passageiros por balão

-- Criar tabela de voos-balões (relação N:N)
CREATE TABLE voos_baloes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voo_id UUID NOT NULL REFERENCES voos(id) ON DELETE CASCADE,
  balao_id UUID NOT NULL REFERENCES baloes(id),
  
  -- Dados de planejamento por balão
  adultos_previstos INTEGER DEFAULT 0,
  criancas_previstas INTEGER DEFAULT 0,
  
  -- Dados reais pós-voo por balão
  adultos_transportados INTEGER,
  criancas_transportadas INTEGER,
  
  -- Observações específicas do balão neste voo
  observacoes TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  -- Não pode ter o mesmo balão duas vezes no mesmo voo
  UNIQUE(voo_id, balao_id),
  
  -- Validações de números
  CONSTRAINT check_adultos_previstos_balao CHECK (adultos_previstos >= 0),
  CONSTRAINT check_criancas_previstas_balao CHECK (criancas_previstas >= 0),
  CONSTRAINT check_adultos_transportados_balao CHECK (adultos_transportados IS NULL OR adultos_transportados >= 0),
  CONSTRAINT check_criancas_transportadas_balao CHECK (criancas_transportadas IS NULL OR criancas_transportadas >= 0)
);

-- Habilitar RLS na tabela voos_baloes
ALTER TABLE voos_baloes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para voos_baloes
-- Herdam as permissões da tabela voos

-- Usuários que podem ver o voo podem ver seus balões
CREATE POLICY "Usuários que veem voo podem ver balões" ON voos_baloes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = voos_baloes.voo_id
      -- As policies da tabela voos já validam o acesso
    )
  );

-- Usuários que podem atualizar o voo podem atualizar balões
CREATE POLICY "Usuários que editam voo podem editar balões" ON voos_baloes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = voos_baloes.voo_id
      -- As policies da tabela voos já validam o acesso
    )
  );

-- Validação adicional: balão deve pertencer ao piloto ou agência do voo
CREATE POLICY "Balão deve pertencer ao responsável do voo" ON voos_baloes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM voos v
      JOIN baloes b ON b.id = voos_baloes.balao_id
      WHERE v.id = voos_baloes.voo_id
      AND (
        -- Balão pertence ao piloto
        b.proprietario_id = v.piloto_id
        OR 
        -- Balão pertence à agência (se houver)
        (v.agencia_id IS NOT NULL AND b.proprietario_id = v.agencia_id)
      )
    )
  );

-- Criar índices para performance
CREATE INDEX idx_voos_baloes_voo ON voos_baloes(voo_id);
CREATE INDEX idx_voos_baloes_balao ON voos_baloes(balao_id);
CREATE INDEX idx_voos_baloes_created_at ON voos_baloes(created_at);

-- Função para atualizar timestamp e validar dados
CREATE OR REPLACE FUNCTION trigger_voos_baloes_update_validation()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar timestamp
  NEW.updated_at = NOW();
  
  -- Validar que balão existe e está ativo
  IF NOT EXISTS (
    SELECT 1 FROM baloes 
    WHERE id = NEW.balao_id AND ativo = true
  ) THEN
    RAISE EXCEPTION 'Balão deve estar ativo para ser usado em voos';
  END IF;
  
  -- Validar que balão pertence ao piloto ou agência do voo
  IF NOT EXISTS (
    SELECT 1 FROM voos v
    JOIN baloes b ON b.id = NEW.balao_id
    WHERE v.id = NEW.voo_id
    AND (
      b.proprietario_id = v.piloto_id
      OR (v.agencia_id IS NOT NULL AND b.proprietario_id = v.agencia_id)
    )
  ) THEN
    RAISE EXCEPTION 'Balão deve pertencer ao piloto ou agência responsável pelo voo';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_voos_baloes_update_validation
  BEFORE INSERT OR UPDATE ON voos_baloes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_voos_baloes_update_validation();

-- Função para atualizar totais do voo quando balões são modificados
CREATE OR REPLACE FUNCTION trigger_voos_baloes_update_totals()
RETURNS TRIGGER AS $$
DECLARE
  voo_id_affected UUID;
BEGIN
  -- Determinar o voo afetado
  IF TG_OP = 'DELETE' THEN
    voo_id_affected = OLD.voo_id;
  ELSE
    voo_id_affected = NEW.voo_id;
  END IF;
  
  -- Atualizar totais previstos do voo
  UPDATE voos SET
    adultos_previstos = COALESCE((
      SELECT SUM(adultos_previstos) 
      FROM voos_baloes 
      WHERE voo_id = voo_id_affected
    ), 0),
    criancas_previstas = COALESCE((
      SELECT SUM(criancas_previstas) 
      FROM voos_baloes 
      WHERE voo_id = voo_id_affected
    ), 0),
    updated_at = NOW()
  WHERE id = voo_id_affected;
  
  -- Se houver dados transportados, atualizar também
  UPDATE voos SET
    adultos_transportados = CASE 
      WHEN EXISTS (
        SELECT 1 FROM voos_baloes 
        WHERE voo_id = voo_id_affected 
        AND adultos_transportados IS NOT NULL
      ) THEN (
        SELECT SUM(COALESCE(adultos_transportados, 0)) 
        FROM voos_baloes 
        WHERE voo_id = voo_id_affected
      )
      ELSE NULL
    END,
    criancas_transportadas = CASE 
      WHEN EXISTS (
        SELECT 1 FROM voos_baloes 
        WHERE voo_id = voo_id_affected 
        AND criancas_transportadas IS NOT NULL
      ) THEN (
        SELECT SUM(COALESCE(criancas_transportadas, 0)) 
        FROM voos_baloes 
        WHERE voo_id = voo_id_affected
      )
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = voo_id_affected
  AND EXISTS (
    SELECT 1 FROM voos_baloes 
    WHERE voo_id = voo_id_affected 
    AND (adultos_transportados IS NOT NULL OR criancas_transportadas IS NOT NULL)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_voos_baloes_update_totals
  AFTER INSERT OR UPDATE OR DELETE ON voos_baloes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_voos_baloes_update_totals();

-- View para facilitar consultas de voos com balões
CREATE VIEW vw_voos_com_baloes AS
SELECT 
  v.id as voo_id,
  v.data_voo,
  v.periodo,
  v.status,
  v.piloto_id,
  mp.nome_completo as piloto_nome,
  v.agencia_id,
  ma.nome_completo as agencia_nome,
  v.adultos_previstos as total_adultos_previstos,
  v.criancas_previstas as total_criancas_previstas,
  v.adultos_transportados as total_adultos_transportados,
  v.criancas_transportadas as total_criancas_transportadas,
  vb.balao_id,
  b.prefixo as balao_prefixo,
  b.volume_m3 as balao_volume,
  b.nome_batismo as balao_nome,
  vb.adultos_previstos as balao_adultos_previstos,
  vb.criancas_previstas as balao_criancas_previstas,
  vb.adultos_transportados as balao_adultos_transportados,
  vb.criancas_transportadas as balao_criancas_transportadas,
  vb.observacoes as balao_observacoes
FROM voos v
JOIN membros mp ON mp.id = v.piloto_id
LEFT JOIN membros ma ON ma.id = v.agencia_id
LEFT JOIN voos_baloes vb ON vb.voo_id = v.id
LEFT JOIN baloes b ON b.id = vb.balao_id
ORDER BY v.data_voo DESC, v.periodo, b.prefixo;

-- Comentários na tabela
COMMENT ON TABLE voos_baloes IS 'Relação N:N entre voos e balões, com dados específicos por balão';
COMMENT ON COLUMN voos_baloes.voo_id IS 'ID do voo relacionado';
COMMENT ON COLUMN voos_baloes.balao_id IS 'ID do balão usado no voo';
COMMENT ON COLUMN voos_baloes.adultos_previstos IS 'Número de adultos planejados para este balão específico';
COMMENT ON COLUMN voos_baloes.criancas_previstas IS 'Número de crianças planejadas para este balão específico';
COMMENT ON VIEW vw_voos_com_baloes IS 'View para consultas facilitadas de voos com seus balões e responsáveis';