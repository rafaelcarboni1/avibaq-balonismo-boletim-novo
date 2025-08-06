-- Migração para criar tabela de anexos de voos
-- Criada em: 2025-01-11
-- Descrição: Sistema de anexos para voos (track-logs, fotos, regulamentos)

-- Criar enum para tipos de anexos
CREATE TYPE tipo_anexo AS ENUM ('track_log', 'foto_voo', 'regulamento_assinado');

-- Criar tabela de anexos de voos
CREATE TABLE voos_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voo_id UUID NOT NULL REFERENCES voos(id) ON DELETE CASCADE,
  tipo tipo_anexo NOT NULL,
  nome_arquivo TEXT NOT NULL,
  nome_original TEXT NOT NULL, -- Nome original do arquivo enviado
  url_storage TEXT NOT NULL, -- Caminho no Supabase Storage
  tamanho_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_por UUID REFERENCES users(id),
  
  -- Metadata específica do arquivo
  metadata JSONB DEFAULT '{}', -- Para armazenar informações extras (resolução, duração, etc.)
  
  -- Controle de visibilidade
  publico BOOLEAN DEFAULT false, -- Se o anexo pode ser visto publicamente
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  -- Validar tamanho do arquivo (máximo 50MB)
  CONSTRAINT check_tamanho_arquivo CHECK (tamanho_bytes > 0 AND tamanho_bytes <= 52428800), -- 50MB
  
  -- Validar nome do arquivo
  CONSTRAINT check_nome_arquivo CHECK (length(nome_arquivo) > 0 AND length(nome_arquivo) <= 255),
  
  -- Validar URL de storage
  CONSTRAINT check_url_storage CHECK (url_storage LIKE 'voos-anexos/%')
);

-- Habilitar RLS na tabela voos_anexos
ALTER TABLE voos_anexos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para voos_anexos
-- Herdam as permissões da tabela voos

-- Usuários que podem ver o voo podem ver anexos
CREATE POLICY "Usuários que veem voo podem ver anexos" ON voos_anexos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = voos_anexos.voo_id
      -- As policies da tabela voos já validam o acesso
    )
  );

-- Usuários que podem atualizar o voo podem gerenciar anexos
CREATE POLICY "Usuários que editam voo podem gerenciar anexos" ON voos_anexos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM voos v
      WHERE v.id = voos_anexos.voo_id
      -- As policies da tabela voos já validam o acesso
    )
  );

-- Anexos públicos podem ser vistos por todos
CREATE POLICY "Anexos públicos são visíveis para todos" ON voos_anexos
  FOR SELECT USING (publico = true);

-- Criar índices para performance
CREATE INDEX idx_anexos_voo ON voos_anexos(voo_id);
CREATE INDEX idx_anexos_tipo ON voos_anexos(tipo);
CREATE INDEX idx_anexos_uploaded_em ON voos_anexos(uploaded_em);
CREATE INDEX idx_anexos_publico ON voos_anexos(publico);
CREATE INDEX idx_anexos_voo_tipo ON voos_anexos(voo_id, tipo);

-- Função para validar tipos de arquivo por categoria
CREATE OR REPLACE FUNCTION validar_tipo_arquivo(p_tipo tipo_anexo, p_mime_type TEXT, p_nome_arquivo TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  CASE p_tipo
    WHEN 'track_log' THEN
      -- Track-logs: PDF, GPX, KML, JSON
      RETURN p_mime_type IN (
        'application/pdf',
        'application/gpx+xml',
        'application/vnd.google-earth.kml+xml',
        'application/json',
        'text/xml'
      ) OR p_nome_arquivo ~* '\.(pdf|gpx|kml|json)$';
      
    WHEN 'foto_voo' THEN
      -- Fotos: JPEG, PNG, WebP
      RETURN p_mime_type IN (
        'image/jpeg',
        'image/png',
        'image/webp'
      ) OR p_nome_arquivo ~* '\.(jpg|jpeg|png|webp)$';
      
    WHEN 'regulamento_assinado' THEN
      -- Regulamentos: PDF, JPEG, PNG
      RETURN p_mime_type IN (
        'application/pdf',
        'image/jpeg',
        'image/png'
      ) OR p_nome_arquivo ~* '\.(pdf|jpg|jpeg|png)$';
      
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar nome único do arquivo
CREATE OR REPLACE FUNCTION gerar_nome_arquivo_unico(p_voo_id UUID, p_tipo tipo_anexo, p_extensao TEXT)
RETURNS TEXT AS $$
DECLARE
  timestamp_str TEXT;
  random_str TEXT;
BEGIN
  timestamp_str := to_char(NOW(), 'YYYYMMDD_HH24MISS');
  random_str := substr(gen_random_uuid()::TEXT, 1, 8);
  
  RETURN format('voos-anexos/%s/%s/%s_%s_%s.%s', 
    p_voo_id, 
    p_tipo, 
    timestamp_str,
    random_str,
    p_tipo,
    p_extensao
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger para validação de arquivos
CREATE OR REPLACE FUNCTION trigger_anexos_validation()
RETURNS TRIGGER AS $$
DECLARE
  extensao TEXT;
BEGIN
  -- Extrair extensão do nome original
  extensao := lower(split_part(NEW.nome_original, '.', array_length(string_to_array(NEW.nome_original, '.'), 1)));
  
  -- Validar tipo de arquivo
  IF NOT validar_tipo_arquivo(NEW.tipo, NEW.mime_type, NEW.nome_original) THEN
    RAISE EXCEPTION 'Tipo de arquivo % não permitido para categoria %', NEW.mime_type, NEW.tipo;
  END IF;
  
  -- Validar tamanhos específicos por tipo
  CASE NEW.tipo
    WHEN 'foto_voo' THEN
      -- Fotos: máximo 5MB
      IF NEW.tamanho_bytes > 5242880 THEN
        RAISE EXCEPTION 'Fotos não podem exceder 5MB';
      END IF;
      
    WHEN 'track_log' THEN
      -- Track-logs: máximo 10MB
      IF NEW.tamanho_bytes > 10485760 THEN
        RAISE EXCEPTION 'Track-logs não podem exceder 10MB';
      END IF;
      
    WHEN 'regulamento_assinado' THEN
      -- Regulamentos: máximo 20MB
      IF NEW.tamanho_bytes > 20971520 THEN
        RAISE EXCEPTION 'Regulamentos não podem exceder 20MB';
      END IF;
  END CASE;
  
  -- Gerar nome único se não fornecido
  IF NEW.nome_arquivo IS NULL OR NEW.nome_arquivo = '' THEN
    NEW.nome_arquivo := gerar_nome_arquivo_unico(NEW.voo_id, NEW.tipo, extensao);
  END IF;
  
  -- Definir uploaded_por se não informado
  IF NEW.uploaded_por IS NULL THEN
    NEW.uploaded_por := auth.uid();
  END IF;
  
  -- Atualizar timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_anexos_validation
  BEFORE INSERT OR UPDATE ON voos_anexos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_anexos_validation();

-- Função para limpar storage quando anexo é deletado
CREATE OR REPLACE FUNCTION trigger_anexos_cleanup_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- TODO: Implementar limpeza do Supabase Storage via Edge Function
  -- Por enquanto, apenas log da operação
  INSERT INTO logs_atividade (usuario_id, acao, detalhes) VALUES (
    auth.uid(),
    'anexo_deletado',
    jsonb_build_object(
      'voo_id', OLD.voo_id,
      'tipo', OLD.tipo,
      'nome_arquivo', OLD.nome_arquivo,
      'url_storage', OLD.url_storage
    )
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_anexos_cleanup_storage
  AFTER DELETE ON voos_anexos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_anexos_cleanup_storage();

-- Função para contar anexos por tipo e voo
CREATE OR REPLACE FUNCTION contar_anexos_voo(p_voo_id UUID, p_tipo tipo_anexo DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
  IF p_tipo IS NULL THEN
    RETURN (SELECT COUNT(*) FROM voos_anexos WHERE voo_id = p_voo_id);
  ELSE
    RETURN (SELECT COUNT(*) FROM voos_anexos WHERE voo_id = p_voo_id AND tipo = p_tipo);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para obter URL assinada do anexo (para download seguro)
CREATE OR REPLACE FUNCTION obter_url_anexo_assinada(p_anexo_id UUID, p_duracao_segundos INTEGER DEFAULT 3600)
RETURNS TEXT AS $$
DECLARE
  storage_path TEXT;
BEGIN
  SELECT url_storage INTO storage_path 
  FROM voos_anexos 
  WHERE id = p_anexo_id;
  
  IF storage_path IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- TODO: Implementar geração de URL assinada via Edge Function
  -- Por enquanto, retorna o caminho do storage
  RETURN storage_path;
END;
$$ LANGUAGE plpgsql;

-- View para facilitar consultas de anexos com informações do voo
CREATE VIEW vw_voos_anexos AS
SELECT 
  va.id as anexo_id,
  va.voo_id,
  v.data_voo,
  v.periodo,
  v.status as voo_status,
  mp.nome_completo as piloto_nome,
  ma.nome_completo as agencia_nome,
  va.tipo,
  va.nome_arquivo,
  va.nome_original,
  va.url_storage,
  va.tamanho_bytes,
  va.mime_type,
  va.publico,
  va.uploaded_em,
  uu.nome as uploaded_por_nome,
  va.metadata,
  -- Informações úteis
  pg_size_pretty(va.tamanho_bytes) as tamanho_formatado,
  CASE va.tipo
    WHEN 'track_log' THEN 'Track-log de navegação'
    WHEN 'foto_voo' THEN 'Foto do voo'
    WHEN 'regulamento_assinado' THEN 'Regulamento assinado'
  END as tipo_descricao
FROM voos_anexos va
JOIN voos v ON v.id = va.voo_id
JOIN membros mp ON mp.id = v.piloto_id
LEFT JOIN membros ma ON ma.id = v.agencia_id
LEFT JOIN users uu ON uu.id = va.uploaded_por
ORDER BY va.uploaded_em DESC;

-- View para estatísticas de anexos
CREATE VIEW vw_anexos_estatisticas AS
SELECT 
  v.id as voo_id,
  v.data_voo,
  v.periodo,
  v.status,
  COUNT(va.id) as total_anexos,
  COUNT(CASE WHEN va.tipo = 'track_log' THEN 1 END) as track_logs,
  COUNT(CASE WHEN va.tipo = 'foto_voo' THEN 1 END) as fotos,
  COUNT(CASE WHEN va.tipo = 'regulamento_assinado' THEN 1 END) as regulamentos,
  SUM(va.tamanho_bytes) as tamanho_total_bytes,
  pg_size_pretty(SUM(va.tamanho_bytes)) as tamanho_total_formatado
FROM voos v
LEFT JOIN voos_anexos va ON va.voo_id = v.id
GROUP BY v.id, v.data_voo, v.periodo, v.status
ORDER BY v.data_voo DESC, v.periodo;

-- Comentários na tabela
COMMENT ON TABLE voos_anexos IS 'Anexos dos voos: track-logs, fotos e regulamentos assinados';
COMMENT ON COLUMN voos_anexos.voo_id IS 'ID do voo relacionado';
COMMENT ON COLUMN voos_anexos.tipo IS 'Tipo do anexo: track_log, foto_voo ou regulamento_assinado';
COMMENT ON COLUMN voos_anexos.nome_arquivo IS 'Nome único do arquivo no storage';
COMMENT ON COLUMN voos_anexos.nome_original IS 'Nome original do arquivo enviado pelo usuário';
COMMENT ON COLUMN voos_anexos.url_storage IS 'Caminho completo no Supabase Storage';
COMMENT ON COLUMN voos_anexos.publico IS 'Se o anexo pode ser acessado publicamente';
COMMENT ON VIEW vw_voos_anexos IS 'View para consultas facilitadas de anexos com dados do voo';
COMMENT ON VIEW vw_anexos_estatisticas IS 'View para estatísticas de anexos por voo';