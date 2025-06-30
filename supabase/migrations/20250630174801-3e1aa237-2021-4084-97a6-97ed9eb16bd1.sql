
-- Criar enum para as bandeiras meteorológicas
CREATE TYPE bandeira_tipo AS ENUM ('verde', 'amarela', 'vermelha');

-- Criar enum para períodos do dia
CREATE TYPE periodo_tipo AS ENUM ('manha', 'tarde');

-- Criar enum para status de voo
CREATE TYPE status_voo AS ENUM ('liberado', 'em_avaliacao', 'cancelado');

-- Criar enum para perfis de usuário
CREATE TYPE perfil_usuario AS ENUM ('administrador', 'editor');

-- Tabela de usuários administrativos
CREATE TABLE usuarios_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  perfil perfil_usuario NOT NULL DEFAULT 'editor',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de boletins meteorológicos
CREATE TABLE boletins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  periodo periodo_tipo NOT NULL,
  bandeira bandeira_tipo NOT NULL,
  status_voo status_voo NOT NULL,
  titulo_curto TEXT NOT NULL,
  motivo TEXT NOT NULL,
  audio_url TEXT,
  fotos TEXT[], -- Array de URLs das fotos
  publicado BOOLEAN DEFAULT false,
  publicado_em TIMESTAMP WITH TIME ZONE,
  publicado_por UUID REFERENCES usuarios_admin(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(data, periodo)
);

-- Tabela de assinantes do boletim
CREATE TABLE assinantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  eh_piloto BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  confirmado BOOLEAN DEFAULT false,
  token_confirmacao TEXT UNIQUE,
  token_descadastro TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de páginas CMS
CREATE TABLE paginas_cms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES usuarios_admin(id)
);

-- Tabela de logs de atividades
CREATE TABLE logs_atividade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios_admin(id),
  acao TEXT NOT NULL,
  detalhes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS nas tabelas
ALTER TABLE usuarios_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE paginas_cms ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_atividade ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários admin (apenas usuários autenticados podem ver)
CREATE POLICY "Usuários admin podem ver outros usuários" ON usuarios_admin
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários admin podem ser atualizados por si mesmos" ON usuarios_admin
  FOR UPDATE USING (auth.uid()::TEXT = id::TEXT);

-- Políticas RLS para boletins (públicos para leitura, admin para escrita)
CREATE POLICY "Boletins são públicos para leitura" ON boletins
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem criar boletins" ON boletins
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem atualizar boletins" ON boletins
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem deletar boletins" ON boletins
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Políticas RLS para assinantes (admins podem ver todos, usuários apenas se confirmam)
CREATE POLICY "Admins podem ver todos os assinantes" ON assinantes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Qualquer um pode se inscrever" ON assinantes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Assinantes podem atualizar seus próprios dados" ON assinantes
  FOR UPDATE USING (true);

-- Políticas RLS para páginas CMS
CREATE POLICY "Páginas CMS são públicas para leitura" ON paginas_cms
  FOR SELECT USING (true);

CREATE POLICY "Apenas admins podem modificar páginas CMS" ON paginas_cms
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas RLS para logs
CREATE POLICY "Apenas admins podem ver logs" ON logs_atividade
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sistema pode inserir logs" ON logs_atividade
  FOR INSERT WITH CHECK (true);

-- Inserir usuário administrador inicial
INSERT INTO usuarios_admin (email, senha_hash, nome, perfil) VALUES 
('super@avibaq.org', crypt('Avibaq123!', gen_salt('bf')), 'Super Administrador', 'administrador');

-- Inserir páginas CMS iniciais
INSERT INTO paginas_cms (slug, titulo, conteudo) VALUES 
('quem-somos', 'Quem Somos', '<h2>AVIBAQ - Associação de Pilotos e Empresas de Balonismo</h2><p>A AVIBAQ é uma associação dedicada à promoção da segurança e excelência no balonismo brasileiro...</p>'),
('estatuto', 'Estatuto', '<h2>Estatuto da AVIBAQ</h2><p>Documento em construção...</p>'),
('empresas-filiadas', 'Empresas Filiadas', '<h2>Empresas Filiadas</h2><p>Lista de empresas associadas em construção...</p>'),
('contatos', 'Contatos', '<h2>Contatos</h2><p>Entre em contato conosco...</p>'),
('politica-privacidade', 'Política de Privacidade', '<h2>Política de Privacidade</h2><p>Respeitamos sua privacidade...</p>'),
('acessibilidade', 'Acessibilidade', '<h2>Acessibilidade</h2><p>Compromisso com a acessibilidade digital...</p>');

-- Criar índices para performance
CREATE INDEX idx_boletins_data_periodo ON boletins(data, periodo);
CREATE INDEX idx_boletins_publicado ON boletins(publicado);
CREATE INDEX idx_assinantes_email ON assinantes(email);
CREATE INDEX idx_assinantes_ativo ON assinantes(ativo);
CREATE INDEX idx_logs_usuario_data ON logs_atividade(usuario_id, created_at);

-- Habilitar extensão para criptografia de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;
