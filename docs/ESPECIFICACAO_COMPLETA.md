# Especificação Técnica Completa - Sistema AVIBAQ

## 1. Visão Geral do Projeto

O sistema AVIBAQ é uma aplicação web desenvolvida para a Associação de Pilotos e Empresas de Balonismo de Praia Grande/SC, com o objetivo de centralizar informações meteorológicas e facilitar a comunicação entre pilotos, empresas e a comunidade do balonismo.

### 1.1. Propósito
- Fornecer boletins meteorológicos diários com informações precisas sobre condições de voo
- Promover a segurança no balonismo através de informações meteorológicas confiáveis
- Facilitar o cadastro e gerenciamento de membros da associação
- Automatizar o envio de boletins por e-mail para assinantes

### 1.2. Principais Usuários
- **Pilotos de balão**: Consultam boletins para decidir sobre voos
- **Empresas de balonismo**: Utilizam informações para planejamento operacional
- **Assinantes**: Recebem boletins por e-mail automaticamente
- **Administradores**: Gerenciam boletins, usuários e configurações do sistema

---

## 2. Arquitetura e Stack Tecnológico

### 2.1. Frontend
- **Next.js 14**: Framework React com renderização server-side
- **React 18**: Biblioteca JavaScript para interfaces de usuário
- **TypeScript**: Tipagem estática para JavaScript
- **Tailwind CSS**: Framework CSS utilitário
- **Radix UI**: Componentes primitivos acessíveis
- **shadcn/ui**: Biblioteca de componentes baseada em Radix UI
- **Lucide React**: Ícones vetoriais
- **React Hook Form**: Gerenciamento de formulários
- **Zod**: Validação de schemas

### 2.2. Backend e Serviços
- **Supabase**: 
  - Banco de dados PostgreSQL hospedado
  - Autenticação e autorização
  - Storage para arquivos de mídia
  - Row Level Security (RLS) para segurança
- **Resend**: Serviço de envio de e-mails
- **Vercel**: Hospedagem e deploy contínuo
- **Cron Jobs**: Automatização de tarefas (envio de boletins)

### 2.3. Dependências Principais
```json
{
  "next": "^14.2.30",
  "react": "^18.3.1",
  "typescript": "^5.5.3",
  "@supabase/supabase-js": "^2.39.7",
  "@tanstack/react-query": "^5.56.2",
  "tailwindcss": "^3.4.11",
  "resend": "^4.6.0",
  "bcryptjs": "^3.0.2",
  "html2canvas": "^1.4.1",
  "jspdf": "^3.0.1"
}
```

---

## 3. Estrutura do Banco de Dados

### 3.1. Tabela: `membros`
```sql
CREATE TABLE membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  tipo membro_tipo NOT NULL, -- 'piloto' | 'agencia'
  cpf TEXT,
  cnpj TEXT,
  nome_empresa TEXT,
  rbac103 TEXT,
  rbac91 TEXT,
  qtd_baloes INTEGER,
  volumes_baloes JSONB,
  observacoes TEXT,
  comprovante_url TEXT,
  status membro_status DEFAULT 'pendente', -- 'pendente' | 'ativo' | 'recusado'
  pagamento_inscricao membro_pagto_inscricao DEFAULT 'aguardando', -- 'aguardando' | 'ok'
  ultima_mensalidade DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.2. Tabela: `boletins`
```sql
CREATE TABLE boletins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  periodo periodo_tipo NOT NULL, -- 'manha' | 'tarde'
  bandeira bandeira_tipo NOT NULL, -- 'verde' | 'amarela' | 'vermelha'
  status_voo status_voo NOT NULL, -- 'liberado' | 'em_avaliacao' | 'cancelado'
  titulo_curto TEXT NOT NULL,
  motivo TEXT NOT NULL,
  audio_url TEXT,
  fotos TEXT[], -- Array de URLs das fotos
  audios_urls TEXT[], -- Array de URLs dos áudios
  fotos_urls TEXT[], -- Array de URLs das fotos
  publicado BOOLEAN DEFAULT false,
  publicado_em TIMESTAMP WITH TIME ZONE,
  publicado_por UUID REFERENCES usuarios_admin(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(data, periodo)
);
```

### 3.3. Tabela: `usuarios_admin`
```sql
CREATE TABLE usuarios_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome TEXT NOT NULL,
  perfil perfil_usuario NOT NULL DEFAULT 'editor', -- 'administrador' | 'editor'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3.4. Tabela: `assinantes`
```sql
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
```

### 3.5. Tabela: `logs_atividade`
```sql
CREATE TABLE logs_atividade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios_admin(id),
  acao TEXT NOT NULL,
  detalhes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. Estrutura de Pastas e Arquivos

```
avibaq-balonismo-boletim/
├── pages/                    # Páginas Next.js
│   ├── admin/               # Área administrativa
│   │   ├── boletins/        # Gerenciamento de boletins
│   │   ├── associados.tsx   # Gerenciamento de membros
│   │   ├── dashboard.tsx    # Dashboard principal
│   │   └── login.tsx        # Autenticação
│   ├── api/                 # API routes
│   │   ├── send-boletim.ts  # Endpoint para envio automático
│   │   └── join.ts          # Endpoint para cadastro
│   ├── index.tsx            # Página inicial
│   ├── historico.tsx        # Histórico de boletins
│   └── membros.tsx          # Lista de membros
├── src/
│   ├── components/          # Componentes React
│   │   ├── ui/             # Componentes de interface
│   │   ├── Layout/         # Componentes de layout
│   │   ├── BoletimCard.tsx # Card de boletim
│   │   ├── AssinantesForm.tsx # Formulário de cadastro
│   │   └── DashboardLayout.tsx # Layout do admin
│   ├── hooks/              # Custom hooks
│   │   ├── useUser.ts      # Hook de usuário
│   │   └── use-toast.ts    # Hook de toast
│   ├── integrations/       # Integrações externas
│   │   └── supabase/       # Configuração Supabase
│   ├── helpers/            # Funções auxiliares
│   │   ├── getDashboardStats.ts
│   │   └── getAssociadosEmDia.ts
│   └── lib/                # Bibliotecas e utilitários
│       ├── supabase.ts     # Cliente Supabase
│       └── utils.ts        # Funções utilitárias
├── supabase/               # Configuração do banco
│   ├── migrations/         # Migrações SQL
│   └── config.toml         # Configuração Supabase
├── public/                 # Arquivos estáticos
├── docs/                   # Documentação
├── package.json            # Dependências
├── vercel.json             # Configuração Vercel
└── tailwind.config.ts      # Configuração Tailwind
```

---

## 5. Funcionalidades Detalhadas

### 5.1. Sistema de Boletins Meteorológicos

#### 5.1.1. Visualização de Boletins
- **Página inicial**: Exibe o boletim mais relevante (futuro > hoje > passado)
- **Bandeiras visuais**: Verde (liberado), Amarela (em avaliação), Vermelha (cancelado)
- **Informações**: Data, período, status, motivo, áudios e fotos
- **Fuso horário**: Ajustado para América/São_Paulo

#### 5.1.2. Criação de Boletins (Admin)
- **Formulário completo**: Data, período, bandeira, motivo, título
- **Upload de mídia**: Suporte a múltiplos áudios (até 5, 10MB cada) e fotos (até 4, 1MB cada)
- **Gravação de áudio**: Funcionalidade integrada para gravação direta no navegador
- **Validação**: Não permite duplicatas (mesma data + período)
- **Logs**: Todas as ações são registradas na tabela de logs

#### 5.1.3. Envio Automático
- **Cron job**: Executa diariamente às 22h (horário de Brasília)
- **Lógica**: Busca boletins do dia seguinte e envia para assinantes ativos
- **Template**: E-mail HTML responsivo com imagens e áudios
- **Descadastro**: Link único por assinante para opt-out

### 5.2. Gestão de Membros

#### 5.2.1. Cadastro de Membros
- **Tipos**: Piloto ou Agência
- **Informações**: Nome, e-mail, telefone, CPF/CNPJ, certificações (RBAC103, RBAC91)
- **Status**: Pendente > Ativo/Recusado
- **Pagamento**: Controle de inscrição e mensalidades
- **Comprovantes**: Upload de documentos

#### 5.2.2. Dashboard Administrativo
- **KPIs**: Estatísticas de cadastros, pilotos, empresas
- **Alertas**: Boletins pendentes, cadastros para aprovação
- **Logs**: Histórico de atividades do sistema
- **Permissões**: Diferentes níveis de acesso (admin, meteo, tesouraria)

### 5.3. Sistema de Assinantes

#### 5.3.1. Cadastro Público
- **Formulário simples**: Nome, e-mail, tipo (piloto/não piloto)
- **Validação**: E-mail único, termos de uso
- **Confirmação**: Feedback visual de cadastro realizado
- **LGPD**: Aceite de termos e política de privacidade

#### 5.3.2. Gerenciamento
- **Token único**: Para descadastro seguro
- **Status**: Ativo/Inativo/Confirmado
- **Segmentação**: Por tipo de usuário (piloto/não piloto)

### 5.4. Autenticação e Segurança

#### 5.4.1. Sistema de Login
- **Supabase Auth**: Gerenciamento de sessões
- **Roles**: admin, meteo, tesouraria, editor
- **Proteção de rotas**: Middleware para áreas restritas
- **Senhas**: Hash com bcrypt, política de força

#### 5.4.2. Row Level Security (RLS)
- **Boletins**: Leitura pública, escrita apenas para autenticados
- **Membros**: Visibilidade apenas para admins
- **Assinantes**: Admins podem ver todos, usuários apenas próprios dados
- **Logs**: Visibilidade apenas para administradores

---

## 6. Integração com Serviços Externos

### 6.1. Supabase
- **Banco de dados**: PostgreSQL hospedado
- **Storage**: Arquivos de mídia (áudios e fotos)
- **Edge Functions**: Processamento server-side
- **Realtime**: Atualizações em tempo real (não implementado)

### 6.2. Resend
- **E-mail transacional**: Envio automático de boletins
- **Templates**: HTML responsivo
- **Tracking**: Entrega e abertura de e-mails
- **Domínio**: E-mails enviados de @avibaq.org

### 6.3. Vercel
- **Hospedagem**: Deploy automático via GitHub
- **Cron jobs**: Execução de tarefas agendadas
- **Edge functions**: Processamento distribuído
- **Analytics**: Métricas de performance

---

## 7. Configuração e Deploy

### 7.1. Variáveis de Ambiente
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend
RESEND_API_KEY=your_resend_api_key

# URLs
NEXT_PUBLIC_SITE_URL=https://avibaq.org
```

### 7.2. Scripts de Desenvolvimento
```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Iniciar produção
npm run start

# Lint
npm run lint
```

### 7.3. Deploy
- **Vercel**: Deploy automático via GitHub
- **Domínio**: avibaq.org
- **SSL**: Certificado automático via Let's Encrypt
- **CDN**: Distribuição global de conteúdo

---

## 8. Monitoramento e Logs

### 8.1. Logs de Atividade
- **Criação de boletins**: Usuário, data, detalhes
- **Alterações de membros**: Aprovações, rejeições
- **Logins**: Tentativas de acesso
- **Envios de e-mail**: Status e timestamps

### 8.2. Métricas
- **Vercel Analytics**: Performance e uso
- **Supabase Dashboard**: Queries e conexões
- **Resend Dashboard**: Taxa de entrega de e-mails

---

## 9. Segurança e Compliance

### 9.1. LGPD
- **Coleta mínima**: Apenas dados necessários
- **Finalidade específica**: Boletins meteorológicos
- **Consentimento**: Aceite explícito nos formulários
- **Direitos**: Acesso, correção, exclusão
- **Retenção**: Política de armazenamento definida

### 9.2. Segurança Técnica
- **HTTPS**: Toda comunicação criptografada
- **Sanitização**: Inputs validados e sanitizados
- **RLS**: Isolamento de dados por nível de acesso
- **Tokens**: Senhas e tokens com hash seguro
- **CORS**: Configuração restritiva de domínios

---

## 10. Futuras Melhorias

### 10.1. Funcionalidades Planejadas
- **Notificações push**: Alertas em tempo real
- **API pública**: Integração com terceiros
- **Mobile app**: Aplicativo nativo
- **Histórico avançado**: Análise de tendências meteorológicas
- **Integração meteorológica**: APIs de clima automatizadas

### 10.2. Melhorias Técnicas
- **Testes automatizados**: Jest, Cypress
- **CI/CD**: Pipeline de deploy mais robusto
- **Monitoring**: Alertas proativos
- **Performance**: Otimizações de carregamento
- **Acessibilidade**: Conformidade WCAG

---

## 11. Contatos e Manutenção

### 11.1. Equipe Técnica
- **Desenvolvedor Principal**: [Nome do desenvolvedor]
- **Administrador de Sistema**: [Nome do admin]
- **Suporte**: contato@avibaq.org

### 11.2. Cronograma de Manutenção
- **Backups**: Automáticos via Supabase
- **Atualizações**: Mensais para dependências
- **Monitoramento**: 24/7 via Vercel
- **Suporte**: Horário comercial

---

*Documento atualizado em: Janeiro 2025*
*Versão: 1.0*