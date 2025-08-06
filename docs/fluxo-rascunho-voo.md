# Fluxo de Voos: Rascunho → Checklist → Finalização

## Objetivo do Fluxo

O módulo de voos AVIBAQ implementa um fluxo completo de operação que garante a segurança e conformidade com os padrões da associação. O fluxo principal segue a sequência:

**Planejamento** → **Checklist 3 Blocos** → **Pós-Voo** → **Finalização**

## Estados Possíveis do Voo

### 1. **rascunho** (Cinza)
- Voo criado pelo wizard de planejamento
- Dados básicos preenchidos, balões selecionados
- Aguardando início do checklist de segurança
- **Ações disponíveis**: Editar planejamento, Iniciar checklist, Cancelar

### 2. **planejado** (Azul)
- Planejamento confirmado e validado
- Pronto para executar checklist de segurança
- **Ações disponíveis**: Iniciar checklist, Editar, Cancelar

### 3. **checklist_bloco1** (Amarelo)
- Checklist de segurança em andamento - Bloco 1/3
- Itens de segurança pré-voo sendo verificados
- **Ações disponíveis**: Continuar checklist, Cancelar

### 4. **checklist_bloco2** (Amarelo)
- Checklist de segurança em andamento - Bloco 2/3
- Verificações durante preparação do voo
- **Ações disponíveis**: Continuar checklist, Cancelar

### 5. **checklist_concluido** (Verde)
- Todos os 3 blocos do checklist aprovados
- Voo autorizado para execução
- **Ações disponíveis**: Finalizar voo, Cancelar

### 6. **finalizado** (Verde Escuro)
- Voo executado e documentação pós-voo completa
- Dados finais inseridos (passageiros reais, duração, etc.)
- **Status final** - Não pode ser alterado

### 7. **cancelado** (Vermelho)
- Voo cancelado por motivo específico
- Requer justificativa obrigatória
- **Status final** - Não pode ser alterado

## Onde o Voo Aparece em Cada Etapa

### **Tela: Planejamento de Voo** (`/piloto/planejamento`)
- **Status criado**: `rascunho`
- **Após criação**: Redireciona para dashboard
- **Dados salvos**: Data, período, local, balões, passageiros previstos

### **Tela: Dashboard do Piloto** (`/piloto/dashboard`)

#### **Seção "Voos em Andamento"** (NOVO - A IMPLEMENTAR)
- **Mostra voos com status**: `rascunho`, `planejado`, `checklist_bloco1`, `checklist_bloco2`, `checklist_concluido`
- **Cards por status**:
  - **Rascunho**: Botão "Iniciar Checklist"
  - **Planejado**: Botão "Iniciar Checklist"
  - **Checklist 1/2**: Botão "Continuar Checklist"
  - **Checklist OK**: Botão "Finalizar Voo"

#### **Seção "Próximo Voo"**
- **Mostra**: Próximo voo por data (qualquer status ativo)
- **Botões condicionais** por status do voo

#### **Seção "Voos Recentes"**
- **Mostra apenas**: Voos `finalizado` ou `cancelado`
- **Sem ações** - apenas histórico

### **Tela: Checklist de Segurança** (`/piloto/checklist/[id]`)
- **Acessível quando**: Status `rascunho`, `planejado`, `checklist_bloco1`, `checklist_bloco2`
- **Altera status para**: `checklist_bloco1` → `checklist_bloco2` → `checklist_concluido`
- **Função**: Executar os 3 blocos de segurança AVIBAQ

### **Tela: Pós-Voo** (`/piloto/pos-voo/[id]`)
- **Acessível quando**: Status `checklist_concluido`
- **Altera status para**: `finalizado`
- **Função**: Documentar dados reais do voo executado

### **Dashboard da Agência** (`/agencia/dashboard`)
- **Similar ao piloto**: Seção "Voos em Andamento" para equipe
- **Visão agregada**: Voos de todos os pilotos vinculados

## Campos Exibidos por Etapa

### **Planejamento (rascunho)**
- Data e período do voo
- Horário previsto e local de decolagem
- Balões selecionados e distribuição de passageiros
- Observações do planejamento
- **Editáveis**: Todos os campos

### **Checklist (em andamento)**
- Dados básicos do planejamento (somente leitura)
- Progresso do checklist (1/3, 2/3, concluído)
- Itens do checklist por bloco
- Justificativas para itens não conformes
- **Editáveis**: Apenas itens do checklist

### **Pós-Voo (documentação)**
- Dados planejados vs realizados
- Passageiros reais transportados
- Duração efetiva e altitude máxima
- Local real de pouso
- Upload de documentos (fotos, tracks GPS, formulários)
- **Editáveis**: Apenas dados de execução

## Permissões de Edição

### **Piloto Individual**
- **Pode editar**: Seus próprios voos em qualquer status ativo
- **Pode cancelar**: Seus voos até status `checklist_concluido`
- **Não pode**: Alterar voos `finalizado` ou `cancelado`

### **Agência**
- **Pode editar**: Voos de pilotos vinculados
- **Pode cancelar**: Voos da equipe até `checklist_concluido`
- **Pode criar**: Voos para pilotos da equipe

### **Administrador**
- **Pode**: Visualizar todos os voos
- **Pode**: Cancelar qualquer voo
- **Pode**: Excluir voos (única exceção)

## Funcionamento Offline

### **Dados Sincronizados Offline**
- Lista de voos em andamento do piloto
- Dados de planejamento completos
- Itens do checklist de segurança
- Status atual de cada voo

### **Ações Offline Permitidas**
- **Visualizar**: Dados de voos salvos
- **Preencher**: Checklist de segurança
- **Salvar localmente**: Progresso do checklist

### **Sincronização Online**
- **Automática**: Quando conexão é restabelecida
- **Conflitos**: Timestamp mais recente prevalece
- **Notificação**: Confirmação de sincronização

### **Limitações Offline**
- **Não pode**: Criar novos voos (requer validação de disponibilidade)
- **Não pode**: Finalizar voos (requer upload de arquivos)
- **Não pode**: Cancelar voos (requer auditoria)

## Cores e Indicadores Visuais

### **Status do Voo**
- **Rascunho**: Fundo cinza claro `bg-gray-100`, texto cinza escuro `text-gray-800`
- **Planejado**: Fundo azul claro `bg-blue-100`, texto azul escuro `text-blue-800`
- **Checklist 1/3 e 2/3**: Fundo amarelo `bg-yellow-100`, texto amarelo escuro `text-yellow-800`
- **Checklist OK**: Fundo verde claro `bg-green-100`, texto verde escuro `text-green-800`
- **Finalizado**: Fundo verde esmeralda `bg-emerald-100`, texto esmeralda escuro `text-emerald-800`
- **Cancelado**: Fundo vermelho claro `bg-red-100`, texto vermelho escuro `text-red-800`

### **Indicadores de Ação**
- **Botão Primário**: Ação principal por status (Iniciar Checklist, Continuar, Finalizar)
- **Botão Secundário**: Ações alternativas (Editar, Cancelar)
- **Ícones**: Status específicos para cada etapa
- **Progresso**: Barra de progresso para checklist (33%, 67%, 100%)

### **Alertas e Avisos**
- **Voo no passado**: Destaque vermelho se data passou sem finalização
- **Checklist atrasado**: Alerta amarelo se próximo ao voo sem checklist
- **Capacidade excedida**: Aviso se passageiros > capacidade estimada dos balões

## Integrações do Sistema

### **Com Meteorologia**
- Voos planejados recebem boletim meteorológico automaticamente
- Alertas de condições adversas para voos em andamento

### **Com Gestão de Balões**
- Verificação automática de disponibilidade na data/período
- Validação de capacidade vs passageiros planejados
- Histórico de uso por balão

### **Com Compliance**
- Auditoria completa de todas as alterações de status
- Relatórios de segurança baseados no checklist
- Histórico de voos para certificações

### **Com Comunicação**
- Emails automáticos de lembrete (Fase 9 - pendente)
- Notificações de status para agências
- Alertas de voos em atraso

## Fluxo de Dados Técnico

### **Criação do Voo**
1. **Input**: Wizard de planejamento
2. **Validação**: Disponibilidade de piloto e balões
3. **Criação**: Registro na tabela `voos` com status `rascunho`
4. **Associação**: Links na tabela `voos_baloes`
5. **Redirecionamento**: Para dashboard com voo visível

### **Transição de Status**
1. **Trigger**: Ação do usuário (botão/formulário)
2. **Validação**: Regras de negócio por status
3. **Atualização**: Campo `status` na tabela `voos`
4. **Auditoria**: Log na tabela de alterações
5. **Notificação**: Feedback visual para usuário

### **Finalização**
1. **Upload**: Arquivos para Supabase Storage
2. **Dados**: Informações reais de execução
3. **Status**: Alteração para `finalizado`
4. **Lock**: Impedimento de alterações futuras
5. **Relatório**: Disponibilização para auditoria
