# SUPABASE DATABASE ARCHITECTURE - AVIBAQ

**Data da última atualização:** 31 de julho de 2025  
**Versão:** 1.0  
**Projeto:** AVIBAQ (Associação de Pilotos e Empresas de Balonismo)

---

## Visão Geral

Este documento fornece uma análise completa e detalhada da arquitetura do banco de dados do projeto AVIBAQ implementada no Supabase. O sistema é projetado para gerenciar operações de balonismo, incluindo voos, checklists de segurança, membros, balões e um sistema robusto de sincronização offline.

## ⚠️ ALERTAS CRÍTICOS DE SEGURANÇA

### **RISCO CRÍTICO IDENTIFICADO**
- **Tabelas `voos` e `permissoes` têm RLS DESABILITADO**
- **Qualquer pessoa com chave API anônima pode CRUD essas tabelas**
- **AÇÃO NECESSÁRIA:** Habilitar RLS e criar políticas de segurança imediatamente

---

## 1. ESTRUTURA DE TABELAS

### 1.1 Tabelas Principais

#### **`users`**
- **Função:** Perfil público dos usuários, estende `auth.users`
- **Relacionamentos:** 
  - Vinculada à `auth.users` via `id`
  - Relaciona com `baloes` (proprietário)
  - Relaciona com `voos` (piloto/agência)
- **Campos Principais:** nome, membro_tipo, status, user_role

#### **`membros`**
- **Função:** Informações detalhadas sobre membros (pilotos e agências)
- **Status:** `pendente`, `ativo`, `recusado`
- **Tipos:** `piloto`, `agencia`
- **RLS:** Apenas admins podem gerenciar, inscrição pública permitida

#### **`baloes`**
- **Função:** Gerenciamento de balões
- **Campos:** prefixo, modelo, proprietário
- **RLS:** Proprietários gerenciam seus balões, agências veem de pilotos contratados
- **Índices:** `idx_baloes_ativo`, chave estrangeira para proprietário

#### **`voos`**
- **Função:** Registro principal de voos
- **Status:** `rascunho`, `planejado`, `checklist_bloco1`, `checklist_bloco2`, `checklist_concluido`, `finalizado`, `cancelado`
- **Períodos:** `manha`, `tarde`
- **⚠️ CRÍTICO:** RLS DESABILITADO - VULNERABILIDADE DE SEGURANÇA
- **Relacionamentos:** 
  - `voos_baloes` (muitos-para-muitos)
  - `checklist_itens` (um-para-muitos)
  - `voos_anexos` (um-para-muitos)

#### **`checklist_itens`**
- **Função:** Itens do checklist de segurança para cada voo
- **Blocos:** 3 blocos de checklist (bloco1, bloco2, bloco3)
- **RLS:** Usuários gerenciam checklists dos voos que têm acesso
- **Trigger:** Atualiza status do voo baseado no preenchimento

#### **`vinculos_agencia_piloto`**
- **Função:** Relacionamento entre agências e pilotos
- **Status:** `pendente`, `aceito`, `recusado`
- **RLS:** Agências e pilotos gerenciam próprios vínculos
- **Índice:** `unique_agencia_piloto` (previne duplicatas)

### 1.2 Tabelas de Sistema

#### **`dados_offline`**
- **Função:** Fila de sincronização para funcionalidade offline
- **Tipos:** `voo`, `checklist`, `anexo`, `balao`, `vinculo`
- **Status Sync:** `pendente`, `sincronizando`, `sincronizado`, `erro`, `conflito`
- **Índices:** Otimizados para processamento da fila

#### **Push Notifications (Sistema Completo)**
- `push_notifications`: Notificações enviadas
- `push_subscriptions`: Inscrições dos usuários
- `push_delivery_logs`: Logs de entrega
- `push_scheduled_jobs`: Jobs agendados

#### **Sistema de Permissões**
- `permissoes`: Permissões por role ⚠️ **RLS DESABILITADO**
- `user_permissions`: Permissões específicas por usuário
- `permission_audit_log`: Log de auditoria de mudanças

#### **Outras Tabelas**
- `boletins`: Boletins informativos (público para leitura)
- `assinantes`: Newsletter e notificações
- `logs_atividade`: Logs do sistema (apenas admins)
- `paginas_cms`: Conteúdo gerenciável

### 1.3 Views (Visões)

- `v_user_permissions_summary`: Resumo de permissões
- `vw_anexos_estatisticas`: Estatísticas de anexos
- `vw_checklist_progresso`: Progresso dos checklists
- `vw_problemas_sincronizacao`: Problemas de sync
- `vw_stats_sincronizacao`: Estatísticas de sincronização
- `vw_voos_anexos`: Voos com anexos
- `vw_voos_com_baloes`: Voos com informações de balões

---

## 2. POLÍTICAS RLS (Row Level Security)

### 2.1 Políticas Ativas

#### **Segurança por Tabela:**

**✅ PROTEGIDAS (RLS Ativo):**
- `assinantes`: Admins veem todos, usuários gerenciam próprias inscrições
- `baloes`: Proprietários CRUD próprios, agências veem de pilotos contratados
- `boletins`: Público para leitura, admins para CRUD
- `checklist_itens`: Usuários gerenciam checklists de voos autorizados
- `dados_offline`: Usuários gerenciam apenas próprios dados
- `logs_atividade`: Apenas admins
- `membros`: Apenas admins gerenciam, inscrição pública
- `users`: Usuários veem/atualizam próprios perfis
- `vinculos_agencia_piloto`: Partes gerenciam próprios vínculos
- `voos_anexos`: Ligado às permissões de voo
- `voos_baloes`: Ligado às permissões de voo

**❌ VULNERÁVEIS (RLS Desabilitado):**
- `voos`: **CRÍTICO** - Acesso público total
- `permissoes`: **CRÍTICO** - Sistema de permissões exposto

### 2.2 Padrões de Segurança

#### **Hierarquia de Acesso:**
1. **Admins:** Acesso total a tudo
2. **Proprietários:** CRUD nos próprios recursos
3. **Agências:** Acesso a pilotos contratados
4. **Pilotos:** Acesso a próprios voos e dados
5. **Público:** Leitura de boletins e inscrições

---

## 3. FUNÇÕES E TRIGGERS

### 3.1 Funções de Validação
- `validar_dados_voo`: Valida dados antes de inserir/atualizar voos
- `validar_prefixo_balao`: Garante formato correto do prefixo de balão
- `validar_tipos_membros_vinculos`: Valida vínculos agência-piloto

### 3.2 Funções de Trigger
- `trigger_criar_checklist_automatico`: Cria checklist padrão para novos voos
- `trigger_anexos_cleanup_storage`: Limpa arquivos quando anexos são deletados

### 3.3 Funções de Permissão (DEFINER - Segurança Crítica)
- `get_user_combined_permissions`: Obtém permissões combinadas do usuário
- `user_has_permission`: Verifica permissão específica
- `handle_new_user`: Cria perfil em `users` para novos usuários do `auth.users`

### 3.4 Funções de Sincronização Offline
- `marcar_sincronizado`: Marca dados como sincronizados
- `resolver_conflito`: Resolve conflitos de sincronização
- `processar_fila_sincronizacao`: Processa fila de dados offline

### 3.5 Funções de Debug
- `debug_admin_check`: Debug de verificações de admin
- `debug_pilot_access`: Debug de acesso de piloto

### 3.6 Triggers Principais

#### **Triggers de Negócio:**
- `trigger_voos_criar_checklist`: Auto-criação de checklist
- `trigger_checklist_update_status_voo`: Atualiza status do voo
- `trigger_validar_balao`: Validação de dados de balão

#### **Triggers de Sistema:**
- `update_*_updated_at`: Atualização automática de timestamps
- `user_permissions_audit`: Log de auditoria de permissões
- `trigger_anexos_cleanup_storage`: Limpeza de arquivos

---

## 4. TIPOS CUSTOMIZADOS (ENUMs)

### 4.1 Status e Estados
- `status_voo`: `liberado`, `em_avaliacao`, `cancelado`
- `voo_status`: `rascunho`, `planejado`, `checklist_bloco1`, `checklist_bloco2`, `checklist_concluido`, `finalizado`, `cancelado`
- `membro_status`: `pendente`, `ativo`, `recusado`
- `vinculo_status`: `pendente`, `aceito`, `recusado`
- `status_sync`: `pendente`, `sincronizando`, `sincronizado`, `erro`, `conflito`

### 4.2 Tipos e Classifications
- `bandeira_tipo`: `verde`, `amarela`, `vermelha`
- `periodo_tipo`, `voo_periodo`: `manha`, `tarde`
- `membro_tipo`: `piloto`, `agencia`
- `user_role`: `admin`, `meteo`, `tesouraria`, `leitura`, `piloto`, `agencia`
- `tipo_dados_offline`: `voo`, `checklist`, `anexo`, `balao`, `vinculo`
- `tipo_anexo`: `track_log`, `foto_voo`, `regulamento_assinado`

### 4.3 Perfis
- `perfil_usuario`: `administrador`, `editor`
- `membro_pagto_inscricao`: `aguardando`, `ok`

---

## 5. ÍNDICES E OTIMIZAÇÕES

### 5.1 Índices de Performance
- **Chaves Estrangeiras:** Todos os relacionamentos têm índices
- **Status e Filtros:** `idx_baloes_ativo`, `idx_membros_status`, `idx_voos_status`
- **Sincronização:** `idx_dados_offline_pendentes`, `idx_dados_offline_user_status`

### 5.2 Índices de Unicidade
- `unique_agencia_piloto`: Previne vínculos duplicados
- `unique_voo_balao`: Previne associações duplicadas voo-balão
- `unique_voo_bloco_item`: Garante unicidade nos itens de checklist
- `voos_data_voo_periodo_piloto_id_key`: Previne voos duplos do mesmo piloto

---

## 6. ARQUITETURA DE AUTENTICAÇÃO

### 6.1 Sistema Híbrido
- **`auth.users`**: Fonte da verdade para identidade (Supabase Auth)
- **`public.users`**: Perfil enriquecido com dados da aplicação
- **`handle_new_user()`**: Sincronização automática entre tabelas

### 6.2 Sistema de Roles
- **Roles Primários:** Definidos em `user_role` enum
- **Permissões por Role:** Tabela `permissoes` (⚠️ RLS desabilitado)
- **Permissões Individuais:** Tabela `user_permissions`
- **Auditoria:** `permission_audit_log` rastreia mudanças

---

## 7. EXTENSÕES DO POSTGRESQL

### 7.1 Extensões Ativas
- **`plpgsql`**: Linguagem procedural (triggers e funções)
- **`uuid-ossp`**: Geração de UUIDs para chaves primárias
- **`pg_graphql`**: Suporte a GraphQL API
- **`pgcrypto`**: Funções criptográficas
- **`pg_stat_statements`**: Análise de performance de queries

---

## 8. ARQUITETURA OFFLINE-FIRST

### 8.1 Sistema de Sincronização
- **Tabela:** `dados_offline` como fila de sincronização
- **Tipos de Operação:** CREATE, UPDATE, DELETE
- **Resolução de Conflitos:** Função `resolver_conflito()`
- **Status Tracking:** Estados de `pendente` a `sincronizado`

### 8.2 Fluxo de Sincronização
1. **Offline:** Operações armazenadas em `dados_offline`
2. **Online:** `processar_fila_sincronizacao()` processa fila
3. **Conflitos:** `resolver_conflito()` aplica estratégias de resolução
4. **Limpeza:** `marcar_sincronizado()` remove dados processados

---

## 9. MONITORAMENTO E TROUBLESHOOTING

### 9.1 Views de Diagnóstico
- `vw_problemas_sincronizacao`: Identifica problemas de sync
- `vw_stats_sincronizacao`: Estatísticas de performance
- `v_user_permissions_summary`: Debug de permissões

### 9.2 Funções de Debug
- `debug_admin_check()`: Verifica acesso de admin
- `debug_pilot_access()`: Verifica acesso de piloto

### 9.3 Logs e Auditoria
- `logs_atividade`: Log geral do sistema
- `permission_audit_log`: Auditoria de permissões
- `push_delivery_logs`: Logs de notificações

---

## 10. AÇÕES CRÍTICAS NECESSÁRIAS

### 10.1 Correções de Segurança (URGENTE)

```sql
-- HABILITAR RLS NAS TABELAS VULNERÁVEIS
ALTER TABLE voos ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes ENABLE ROW LEVEL SECURITY;

-- CRIAR POLÍTICAS BÁSICAS (EXEMPLO)
CREATE POLICY "Usuarios podem ver voos autorizados" ON voos
  FOR SELECT USING (
    piloto_id = auth.uid() OR 
    agencia_id = auth.uid() OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### 10.2 Monitoramento Contínuo
- Monitorar `pg_stat_statements` para performance
- Revisar logs de `permission_audit_log` regularmente
- Acompanhar estatísticas de sincronização offline

### 10.3 Documentação Viva
- **Este documento deve ser atualizado a cada mudança no schema**
- **Todas as alterações em funções/triggers devem ser documentadas**
- **Políticas RLS devem ser testadas após mudanças**

---

## 11. COMANDOS ÚTEIS PARA DESENVOLVIMENTO

### 11.1 Debug de Permissões
```sql
-- Verificar permissões de um usuário
SELECT * FROM get_user_combined_permissions('uuid-do-usuario');

-- Debug de acesso de piloto
SELECT debug_pilot_access('uuid-do-piloto', 'uuid-do-voo');
```

### 11.2 Sincronização Offline
```sql
-- Ver problemas de sincronização
SELECT * FROM vw_problemas_sincronizacao;

-- Processar fila manualmente
SELECT processar_fila_sincronizacao();
```

### 11.3 Estatísticas
```sql
-- Estatísticas de anexos
SELECT * FROM vw_anexos_estatisticas;

-- Progresso de checklists
SELECT * FROM vw_checklist_progresso WHERE voo_id = 'uuid-do-voo';
```

---

**⚠️ LEMBRETE:** Sempre testar mudanças em ambiente de desenvolvimento antes de aplicar em produção. O sistema de RLS e permissões é complexo e crítico para a segurança da aplicação.

**📝 PRÓXIMA REVISÃO:** Este documento deve ser revisado sempre que houver mudanças significativas no schema do banco de dados.

---

**Última atualização:** 31/07/2025 por Claude Code  
**Próxima revisão:** Após próximas mudanças no schema