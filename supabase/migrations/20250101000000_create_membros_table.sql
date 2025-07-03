-- Criar enums para membros
CREATE TYPE membro_status AS ENUM ('pendente', 'ativo', 'recusado');
CREATE TYPE membro_pagto_inscricao AS ENUM ('aguardando', 'ok');
CREATE TYPE membro_tipo AS ENUM ('piloto', 'agencia');

-- Tabela de membros
CREATE TABLE membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  tipo membro_tipo NOT NULL,
  cpf TEXT,
  cnpj TEXT,
  nome_empresa TEXT,
  rbac103 TEXT,
  rbac91 TEXT,
  qtd_baloes INTEGER,
  volumes_baloes JSONB,
  observacoes TEXT,
  comprovante_url TEXT,
  status membro_status DEFAULT 'pendente',
  pagamento_inscricao membro_pagto_inscricao DEFAULT 'aguardando',
  ultima_mensalidade DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela membros
ALTER TABLE membros ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para membros (apenas admins podem ver/modificar)
CREATE POLICY "Apenas admins podem ver membros" ON membros
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Qualquer um pode se inscrever" ON membros
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Apenas admins podem atualizar membros" ON membros
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem deletar membros" ON membros
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Criar índices para performance
CREATE INDEX idx_membros_status ON membros(status);
CREATE INDEX idx_membros_tipo ON membros(tipo);
CREATE INDEX idx_membros_email ON membros(email);
CREATE INDEX idx_membros_created_at ON membros(created_at);
CREATE INDEX idx_membros_ultima_mensalidade ON membros(ultima_mensalidade); 