-- Migração para criar buckets de storage e configurar políticas
-- Criada em: 2025-01-11
-- Descrição: Buckets para anexos de voos e configurações de segurança

-- Criar bucket para anexos de voos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'voos-anexos',
    'voos-anexos',
    false, -- Não público por padrão
    52428800, -- 50MB
    ARRAY[
      'application/pdf',
      'application/gpx+xml',
      'application/vnd.google-earth.kml+xml',
      'application/json',
      'text/xml',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Políticas de storage para voos-anexos

-- Usuários podem fazer upload de arquivos para seus próprios voos
CREATE POLICY "Usuários podem fazer upload para seus voos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voos-anexos' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM voos v
      JOIN membros m ON (m.id = v.piloto_id OR m.id = v.agencia_id)
      JOIN users u ON u.id = m.user_id
      WHERE u.id = auth.uid()
      AND name LIKE 'voos-anexos/' || v.id::TEXT || '/%'
    )
  );

-- Usuários podem ver arquivos de seus próprios voos
CREATE POLICY "Usuários podem ver anexos de seus voos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'voos-anexos' AND
    (
      -- Admins podem ver tudo
      EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'meteo', 'tesouraria')
      ) OR
      -- Proprietários podem ver seus arquivos
      EXISTS (
        SELECT 1 FROM voos v
        JOIN membros m ON (m.id = v.piloto_id OR m.id = v.agencia_id)
        JOIN users u ON u.id = m.user_id
        WHERE u.id = auth.uid()
        AND name LIKE 'voos-anexos/' || v.id::TEXT || '/%'
      ) OR
      -- Arquivos marcados como públicos
      EXISTS (
        SELECT 1 FROM voos_anexos va
        WHERE va.url_storage = name
        AND va.publico = true
      )
    )
  );

-- Usuários podem atualizar arquivos de seus próprios voos
CREATE POLICY "Usuários podem atualizar anexos de seus voos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'voos-anexos' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM voos v
      JOIN membros m ON (m.id = v.piloto_id OR m.id = v.agencia_id)
      JOIN users u ON u.id = m.user_id
      WHERE u.id = auth.uid()
      AND name LIKE 'voos-anexos/' || v.id::TEXT || '/%'
    )
  );

-- Usuários podem deletar arquivos de seus próprios voos
CREATE POLICY "Usuários podem deletar anexos de seus voos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'voos-anexos' AND
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM voos v
      JOIN membros m ON (m.id = v.piloto_id OR m.id = v.agencia_id)
      JOIN users u ON u.id = m.user_id
      WHERE u.id = auth.uid()
      AND name LIKE 'voos-anexos/' || v.id::TEXT || '/%'
    )
  );

-- Admins podem fazer qualquer operação
CREATE POLICY "Admins podem gerenciar todos os anexos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'voos-anexos' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Função para organizar estrutura de pastas no storage
CREATE OR REPLACE FUNCTION organizar_path_anexo(
  p_voo_id UUID,
  p_tipo tipo_anexo,
  p_nome_arquivo TEXT
)
RETURNS TEXT AS $$
BEGIN
  -- Retorna: voos-anexos/{voo_id}/{tipo}/{nome_arquivo}
  RETURN format('voos-anexos/%s/%s/%s', p_voo_id, p_tipo, p_nome_arquivo);
END;
$$ LANGUAGE plpgsql;

-- Função para validar path do storage
CREATE OR REPLACE FUNCTION validar_path_storage(p_path TEXT, p_voo_id UUID, p_tipo tipo_anexo)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se o path segue o padrão esperado
  RETURN p_path ~ ('^voos-anexos/' || p_voo_id::TEXT || '/' || p_tipo::TEXT || '/[^/]+$');
END;
$$ LANGUAGE plpgsql;

-- Comentários sobre o storage
COMMENT ON FUNCTION organizar_path_anexo IS 'Gera path padronizado para anexos no storage';
COMMENT ON FUNCTION validar_path_storage IS 'Valida se path do storage segue padrão esperado';