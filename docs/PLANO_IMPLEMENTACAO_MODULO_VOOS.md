# Plano de Implementação - Módulo de Registro de Voos AVIBAQ

## 📋 Visão Geral

Este documento apresenta o plano detalhado para implementação do módulo de registro de voos no sistema AVIBAQ, integrando perfeitamente com a arquitetura existente e seguindo os padrões Magic UI já estabelecidos.

## 🏗️ Análise da Arquitetura Atual

### Sistema Existente
- **Stack**: Next.js 14 + TypeScript + Supabase + Tailwind CSS
- **Autenticação**: Sistema dual (Supabase Auth + tabela `users` customizada)
- **Estrutura de membros**: Pilotos e agências com sistema de mensalidades
- **UI/UX**: Magic UI implementado com componentes animados e responsivos
- **PWA**: Infraestrutura Next.js pronta para PWA

### Pontos de Integração Identificados
1. **Sistema de Membros**: Tabela `membros` com pilotos e agências ativos
2. **Sistema de Usuários**: Tabela `users` para autenticação e roles
3. **Sistema de Permissões**: RLS implementado para segurança
4. **Magic UI**: Componentes padronizados para dashboards
5. **Storage**: Supabase Storage para arquivos

## 🗄️ Schema de Banco de Dados

### 1. Tabela: `baloes`
```sql
CREATE TABLE baloes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefixo TEXT NOT NULL UNIQUE, -- PP-XXX
  volume_m3 INTEGER NOT NULL,
  nome_batismo TEXT,
  proprietario_id UUID NOT NULL REFERENCES membros(id),
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_baloes_proprietario ON baloes(proprietario_id);
CREATE INDEX idx_baloes_ativo ON baloes(ativo);
```

### 2. Tabela: `vinculos_agencia_piloto`
```sql
CREATE TYPE vinculo_status AS ENUM ('pendente', 'aceito', 'recusado');

CREATE TABLE vinculos_agencia_piloto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agencia_id UUID NOT NULL REFERENCES membros(id),
  piloto_id UUID NOT NULL REFERENCES membros(id),
  status vinculo_status DEFAULT 'pendente',
  convite_enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  respondido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(agencia_id, piloto_id)
);

CREATE INDEX idx_vinculos_agencia ON vinculos_agencia_piloto(agencia_id);
CREATE INDEX idx_vinculos_piloto ON vinculos_agencia_piloto(piloto_id);
CREATE INDEX idx_vinculos_status ON vinculos_agencia_piloto(status);
```

### 3. Tabela: `voos`
```sql
CREATE TYPE periodo_voo AS ENUM ('manha', 'tarde');
CREATE TYPE status_voo AS ENUM ('rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido', 'finalizado', 'cancelado');
CREATE TYPE motivo_cancelamento AS ENUM ('vento', 'chuva', 'teto_baixo', 'problema_tecnico', 'passageiros_ausentes', 'outro');

CREATE TABLE voos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Dados básicos
  data_voo DATE NOT NULL,
  periodo periodo_voo NOT NULL,
  horario_previsto TIME,
  local_decolagem_previsto TEXT,
  
  -- Responsáveis
  piloto_id UUID NOT NULL REFERENCES membros(id),
  agencia_id UUID REFERENCES membros(id), -- NULL se piloto individual
  
  -- Status e dados planejados
  status status_voo DEFAULT 'rascunho',
  adultos_previstos INTEGER DEFAULT 0,
  criancas_previstas INTEGER DEFAULT 0,
  
  -- Dados pós-voo
  adultos_transportados INTEGER,
  criancas_transportadas INTEGER,
  local_pouso TEXT,
  duracao_minutos INTEGER,
  altitude_maxima INTEGER,
  observacoes_pos_voo TEXT,
  
  -- Cancelamento
  motivo_cancelamento motivo_cancelamento,
  observacoes_cancelamento TEXT,
  cancelado_em TIMESTAMP WITH TIME ZONE,
  cancelado_por UUID REFERENCES users(id),
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraint: não pode haver dois voos no mesmo período/data/piloto
  UNIQUE(data_voo, periodo, piloto_id)
);

CREATE INDEX idx_voos_data ON voos(data_voo);
CREATE INDEX idx_voos_piloto ON voos(piloto_id);
CREATE INDEX idx_voos_agencia ON voos(agencia_id);
CREATE INDEX idx_voos_status ON voos(status);
```

### 4. Tabela: `voos_baloes`
```sql
CREATE TABLE voos_baloes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voo_id UUID NOT NULL REFERENCES voos(id) ON DELETE CASCADE,
  balao_id UUID NOT NULL REFERENCES baloes(id),
  adultos_previstos INTEGER DEFAULT 0,
  criancas_previstas INTEGER DEFAULT 0,
  adultos_transportados INTEGER,
  criancas_transportadas INTEGER,
  
  UNIQUE(voo_id, balao_id)
);

CREATE INDEX idx_voos_baloes_voo ON voos_baloes(voo_id);
CREATE INDEX idx_voos_baloes_balao ON voos_baloes(balao_id);
```

### 5. Tabela: `checklist_itens`
```sql
CREATE TYPE bloco_checklist AS ENUM ('bloco1', 'bloco2', 'bloco3');

CREATE TABLE checklist_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voo_id UUID NOT NULL REFERENCES voos(id) ON DELETE CASCADE,
  bloco bloco_checklist NOT NULL,
  item_numero INTEGER NOT NULL,
  item_descricao TEXT NOT NULL,
  marcado BOOLEAN DEFAULT false,
  motivo_nao_marcado TEXT, -- obrigatório se marcado = false
  preenchido_em TIMESTAMP WITH TIME ZONE,
  preenchido_por UUID REFERENCES users(id),
  
  UNIQUE(voo_id, bloco, item_numero)
);

CREATE INDEX idx_checklist_voo ON checklist_itens(voo_id);
CREATE INDEX idx_checklist_bloco ON checklist_itens(bloco);
```

### 6. Tabela: `voos_anexos`
```sql
CREATE TYPE tipo_anexo AS ENUM ('track_log', 'foto_voo', 'regulamento_assinado');

CREATE TABLE voos_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voo_id UUID NOT NULL REFERENCES voos(id) ON DELETE CASCADE,
  tipo tipo_anexo NOT NULL,
  nome_arquivo TEXT NOT NULL,
  url_storage TEXT NOT NULL,
  tamanho_bytes INTEGER,
  mime_type TEXT,
  uploaded_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_por UUID REFERENCES users(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anexos_voo ON voos_anexos(voo_id);
CREATE INDEX idx_anexos_tipo ON voos_anexos(tipo);
```

### 7. Tabela: `dados_offline`
```sql
CREATE TABLE dados_offline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tipo_dados TEXT NOT NULL, -- 'voo', 'checklist', 'anexo'
  dados_json JSONB NOT NULL,
  sincronizado BOOLEAN DEFAULT false,
  tentativas_sync INTEGER DEFAULT 0,
  ultimo_erro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sincronizado_em TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_offline_user ON dados_offline(user_id);
CREATE INDEX idx_offline_sincronizado ON dados_offline(sincronizado);
```

## 📱 Estrutura de Páginas e Componentes

### Rotas Principais
```
/piloto/
├── dashboard.tsx           # Dashboard do piloto
├── meus-baloes.tsx        # Gestão de balões
├── planejamento.tsx       # Criar/editar voos
├── checklist/[id].tsx     # Wizard de checklist
├── pos-voo/[id].tsx       # Formulário pós-voo
└── historico.tsx          # Histórico de voos

/agencia/
├── dashboard.tsx           # Dashboard da agência
├── frota.tsx              # Gestão da frota
├── pilotos.tsx            # Gestão de vínculos
├── planejamento.tsx       # Planejamento de voos
└── historico.tsx          # Histórico de voos

/admin/
├── voos/
│   ├── index.tsx          # Lista todos os voos
│   ├── relatorios.tsx     # Relatórios e estatísticas
│   └── configuracao.tsx   # Config de permissões extras
```

### Componentes Magic UI para Voos
```typescript
// src/components/magicui/voos/
├── VooCard.tsx              # Card de voo com status
├── BalaoCard.tsx            # Card de balão
├── ChecklistWizard.tsx      # Wizard dos 3 blocos
├── VooTimeline.tsx          # Timeline do status do voo
├── BalaoSelector.tsx        # Seletor animado de balões
├── PilotoInviteCard.tsx     # Card para convites
├── VooCalendar.tsx          # Calendário de voos
├── OfflineIndicator.tsx     # Indicador de modo offline
└── VooStatsCard.tsx         # Cards de estatísticas
```

### PWA e Offline
```typescript
// src/lib/offline/
├── sync-manager.ts          # Gerenciador de sincronização
├── offline-storage.ts       # LocalStorage/IndexedDB
├── sw-utils.ts             # Service Worker utilities
└── sync-strategies.ts       # Estratégias de sync
```

## 🚀 Plano de Implementação por Fases

### Fase 0: Levantamento e Preparação ✅
- [x] Análise da arquitetura atual
- [x] Documentação do plano de implementação
- [x] Definição do schema de banco

### Fase 1: Scripts SQL e Migrações ✅
**Duração estimada: 2-3 dias**
- [x] Criar migrações SQL para todas as tabelas
- [x] Implementar seeds com dados de teste
- [x] Configurar RLS policies
- [x] Testes de integridade do banco

**Entregáveis:**
- Migrações SQL versionadas
- Policies de segurança configuradas
- Dados de teste inseridos

### Fase 2: Menu "Meus Balões" ✅
**Duração estimada: 3-4 dias**
- [x] Página de gestão de balões para pilotos
- [x] CRUD completo com validações
- [x] Componente `BalaoCard` com Magic UI
- [x] Integração com sistema de membros

**Entregáveis:**
- `/piloto/meus-baloes.tsx`
- `/agencia/frota.tsx`
- Componente `BalaoCard`

### Fase 3: Fluxo de Convite/Aceite de Pilotos ✅
**Duração estimada: 4-5 dias**
- [x] Sistema de convites agência → piloto
- [x] Dashboard de vínculos pendentes
- [x] Páginas para gestão e resposta de convites
- [x] Componente `PilotoInviteCard`

**Entregáveis:**
- `/agencia/pilotos.tsx`
- `/piloto/convites.tsx`
- Sistema completo de vínculos

### Fase 4: Formulário Dia-1 (Planejamento) ✅
**Duração estimada: 5-6 dias**
- [x] Formulário de criação de voo
- [x] Seletor múltiplo de balões
- [x] Validações de business rules
- [x] Preview do planejamento

**Entregáveis:**
- `/piloto/planejamento.tsx` ✅
- `/agencia/planejamento.tsx` ✅
- Componente `BalaoSelector` ✅
- Validações de negócio ✅

### Fase 5: Wizard dos Três Blocos de Checklist ✅
**Duração estimada: 6-7 dias**
- [x] Wizard com 3 etapas (blocos)
- [x] Validação obrigatória de motivos
- [x] Persistência automática
- [x] UI/UX otimizada para mobile

**Entregáveis:**
- `/piloto/checklist/[id].tsx` ✅
- Componente `ChecklistWizard` ✅
- Sistema de validação avançado ✅

### Fase 6: Formulário Pós-voo + Anexos ✅
**Duração estimada: 4-5 dias**
- [x] Formulário de dados pós-voo
- [x] Upload de track-logs, fotos, PDFs
- [x] Integração com Supabase Storage
- [x] Preview de anexos

**Entregáveis:**
- `/piloto/pos-voo/[id].tsx` ✅
- Sistema de upload robusto ✅
- Gestão de anexos ✅

### Fase 7: Modo PWA Off-line e Sincronização ✅
**Duração estimada: 7-8 dias**
- [x] Service Worker customizado
- [x] Estratégias de cache
- [x] Sincronização automática
- [x] Indicadores de status offline

**Entregáveis:**
- PWA funcional offline ✅
- Service Worker configurado ✅
- Sistema de sincronização ✅
- `OfflineIndicator` component ✅

### Fase 8: Dashboards KPI ✅
**Duração estimada: 4-5 dias**
- [x] Dashboard do piloto com estatísticas
- [x] Dashboard da agência
- [x] Gráficos animados com Magic UI
- [x] KPIs em tempo real

**Entregáveis:**
- Dashboards completos ✅
- Componentes `VooStatsCard` ✅
- Gráficos interativos ✅

### Fase 9: E-mail Diário às 19h
**Duração estimada: 3-4 dias**
- [ ] Cron job para lembretes (ver outra opcao gratuita sem ser a vercel para esses envios)
- [ ] Templates de e-mail responsivos
- [ ] Sistema de opt-out
- [ ] Logs de envio

**Entregáveis:**
- API route para cron job
- Templates de e-mail
- Sistema de notificações

### Fase 10: Permissões Extras no Admin ✅
**Duração estimada: 2-3 dias**
- [x] Interface de gestão de permissões
- [x] Sistema de roles granular
- [x] Auditoria de mudanças

**Entregáveis:**
- `/admin/permissoes.tsx` ✅
- Sistema de permissões avançado ✅

### Fase 11: Magic UI nos Painéis Administrativos ✅
**Duração estimada: 3-4 dias**
- [x] Aplicar Magic UI aos novos painéis
- [x] Harmonizar com design existente
- [x] Otimizações de performance

**Entregáveis:**
- Interface administrativa completa ✅
- Consistência visual total ✅

## 💡 Considerações Técnicas

### Integração com Sistema Existente
1. **Reutilização de Componentes**: Aproveitar `EnhancedDashboardLayout`, `EnhancedKpiCard`, etc.
2. **Sistema de Autenticação**: Usar estrutura `users` + `membros` existente
3. **Validação de Mensalidades**: Integrar com helper `getAssociadosEmDia`
4. **Padrões de API**: Seguir estrutura `/pages/api/` existente

### PWA e Offline
1. **Service Worker**: Estratégia cache-first para assets, network-first para dados
2. **IndexedDB**: Armazenamento local robusto para dados offline
3. **Sync Manager**: Fila de sincronização com retry automático
4. **Conflict Resolution**: Estratégias para conflitos de dados

### Performance
1. **Lazy Loading**: Componentes carregados sob demanda
2. **Virtual Scrolling**: Para listas grandes de voos
3. **Image Optimization**: Next.js Image component para anexos
4. **Database Indexing**: Índices otimizados para queries frequentes

### Segurança
1. **RLS Policies**: Isolamento por membro/agência
2. **File Upload**: Validação rigorosa de tipos e tamanhos
3. **Rate Limiting**: Proteção contra abuso de APIs
4. **Data Sanitization**: Sanitização de inputs do usuário

## 📊 Estimativas de Tempo

| Fase | Descrição | Tempo Estimado | Complexidade | Status |
|------|-----------|----------------|--------------|---------|
| 0 | Levantamento | 1 dia | Baixa | ✅ |
| 1 | Scripts SQL | 2-3 dias | Média | ✅ |
| 2 | Meus Balões | 3-4 dias | Baixa | ✅ |
| 3 | Convites Pilotos | 4-5 dias | Média | ✅ |
| 4 | Planejamento | 5-6 dias | Alta | ✅ |
| 5 | Checklist Wizard | 6-7 dias | Alta | ✅ |
| 6 | Pós-voo + Anexos | 4-5 dias | Média | ✅ |
| 7 | PWA Offline | 7-8 dias | Alta | ✅ |
| 8 | Dashboards KPI | 4-5 dias | Média | ✅ |
| 9 | E-mail 19h | 3-4 dias | Baixa | ⏸️ |
| 10 | Permissões Admin | 2-3 dias | Baixa | ✅ |
| 11 | Magic UI Final | 3-4 dias | Baixa | ✅ |

**Total estimado: 44-58 dias de desenvolvimento**  
**Progresso atual: 10/11 fases concluídas (91% completo)**

## 🎯 Marcos Importantes

1. **MVP Básico** (Fases 1-4): Sistema básico de planejamento funcionando ✅
2. **Core Completo** (Fases 1-6): Fluxo completo de voo sem offline ✅
3. **PWA Release** (Fases 1-7): Sistema offline funcional ✅
4. **Production Ready** (Fases 1-11): Sistema completo para produção ✅ (exceto Fase 9)

## 🚨 Riscos e Mitigações

### Riscos Técnicos
- **Complexidade PWA**: Implementar gradualmente, começar com cache simples
- **Sincronização Offline**: Criar testes abrangentes para cenários de conflito
- **Performance Mobile**: Otimizar desde o início, testar em dispositivos reais

### Riscos de Negócio
- **Mudança de Requisitos**: Manter documentação atualizada, comunicação constante
- **Treinamento Usuários**: Criar documentação e tutoriais integrados
- **Migração de Dados**: Planejar migração gradual se houver dados legados

## 📋 Status Atual e Próximos Passos

### ✅ Fases Concluídas (10/11)
- **Fases 1-8**: Core completo do sistema incluindo PWA offline
- **Fase 10**: Permissões avançadas no admin
- **Fase 11**: Magic UI nos painéis administrativos

### ⏸️ Fase Pendente
- **Fase 9**: E-mail diário às 19h (deixada para implementação futura)

### 🎉 Sistema Production Ready
O sistema AVIBAQ está **91% completo** e pronto para produção com:
- ✅ PWA funcional com modo offline
- ✅ Dashboards avançados com KPIs
- ✅ Sistema de permissões granulares
- ✅ Interface administrativa moderna com Magic UI
- ✅ Todos os fluxos principais de voo implementados

### 📝 Documentação de Deploy
Para próximos passos de deploy em produção, consultar:
- Configurações de ambiente necessárias
- Setup de banco de dados em produção
- Configuração de domínio e SSL
- Testes finais de aceitação

---

*Documento criado em: Janeiro 2025*  
*Última atualização: Janeiro 2025*  
*Versão: 2.0*  
*Status: 91% implementado - Production Ready*