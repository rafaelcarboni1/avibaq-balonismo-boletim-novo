# Sistema AVIBAQ - Descrição para ANAC
## Associação de Pilotos e Empresas de Balonismo

### 📄 Documento Informativo
**Destinatário:** Agência Nacional de Aviação Civil (ANAC)  
**Remetente:** AVIBAQ - Associação de Pilotos e Empresas de Balonismo  
**Data:** 31 de julho de 2025  
**Versão:** 1.0

---

## 1. APRESENTAÇÃO DA ASSOCIAÇÃO

A **AVIBAQ (Associação de Pilotos e Empresas de Balonismo)** é uma entidade sem fins lucrativos sediada em Praia Grande/SC, que representa e organiza a comunidade de balonismo da região. Nossa associação congrega pilotos certificados, empresas operadoras e entusiastas do balonismo, promovendo a segurança, a qualidade técnica e o desenvolvimento sustentável da atividade.

## 2. O SISTEMA DIGITAL AVIBAQ

### 2.1. Conceito e Propósito

O **Sistema AVIBAQ** é uma plataforma digital desenvolvida especificamente para atender às necessidades operacionais e de segurança da aviação de balão. O sistema centraliza informações meteorológicas especializadas, gerencia operações de voo e facilita a comunicação entre todos os agentes do setor.

### 2.2. Objetivos Principais

- **Promover a Segurança Operacional:** Fornecimento de informações meteorológicas especializadas para balonismo
- **Centralizar Informações:** Hub único de dados para pilotos, empresas e autoridades
- **Automatizar Processos:** Redução de trabalho manual e aumento da eficiência
- **Facilitar Compliance:** Ferramentas para atendimento às regulamentações vigentes
- **Fortalecer a Comunidade:** Comunicação eficiente entre todos os stakeholders

## 3. FUNCIONALIDADES IMPLEMENTADAS

### 3.1. Sistema de Boletins Meteorológicos ✅ FINALIZADO

**Funcionalidade Principal:** Boletins meteorológicos diários especializados em condições de voo para balões.

**Características:**
- **Periodicidade:** Boletins diários para períodos manhã e tarde
- **Sistema de Alertas:** Bandeiras coloridas (Verde, Amarela, Vermelha) indicando condições de voo
- **Conteúdo Multimídia:** Anexos de fotos das condições climáticas e gravações de áudio com detalhes técnicos
- **Distribuição Automatizada:** Envio automático por e-mail às 22h para toda a comunidade
- **Histórico Completo:** Arquivo de todos os boletins para consulta e análise de tendências
- **Acesso Público:** Disponibilização das informações para toda a comunidade interessada

**Benefício para a Segurança:** Informações meteorológicas especializadas reduzem significativamente os riscos operacionais do balonismo.

### 3.2. Gestão de Associados ✅ FINALIZADO

**Funcionalidade:** Sistema completo de cadastro e gestão de membros da associação.

**Tipos de Usuários:**
- **Pilotos:** Portadores de certificações RBAC103 e/ou RBAC91
- **Agências/Empresas:** Operadoras de turismo em balão devidamente constituídas

**Características:**
- **Cadastro Detalhado:** Informações pessoais, certificações, documentos comprobatórios
- **Controle de Status:** Membros pendentes, ativos ou inativos
- **Gestão Financeira:** Controle de pagamentos de inscrições e mensalidades
- **Upload de Documentos:** Comprovantes de certificações e demais documentações
- **Dashboard Administrativo:** Visão gerencial completa dos associados

### 3.3. Módulo de Operações de Voo ✅ 91% FINALIZADO

**Funcionalidade:** Sistema completo para planejamento, execução e documentação de voos.

#### 3.3.1. Planejamento de Voos
- **Agendamento Detalhado:** Data, horário, local de decolagem e pouso previstos
- **Gestão de Equipamentos:** Registro e controle de balões utilizados
- **Previsão de Passageiros:** Planejamento de capacidade
- **Relacionamento Agência-Piloto:** Vinculação de pilotos a voos de agências

#### 3.3.2. Checklists de Segurança (Sistema AVIBAQ de 3 Blocos)
**Bloco 1 - Pré-voo:**
- Verificação de documentação da aeronave
- Validação de licenças e certificações
- Inspeção de equipamentos (envelope, cesto, queimador)
- Análise de condições meteorológicas
- Briefing de segurança com passageiros

**Bloco 2 - Durante o Voo:**
- Confirmação de decolagem segura
- Controle de altitude e navegação
- Manutenção de comunicação com solo
- Monitoramento contínuo de segurança
- Execução de pouso seguro

**Bloco 3 - Pós-voo:**
- Recolhimento adequado de equipamentos
- Limpeza e organização da área
- Documentação de ocorrências (se houver)
- Registro final de dados do voo

#### 3.3.3. Gestão de Equipamentos
- **Registro de Balões:** Cadastro completo com especificações técnicas
- **Histórico de Manutenção:** Controle de revisões e reparos
- **Documentação:** Certificados de aeronavegabilidade e seguros
- **Rastreamento de Uso:** Horas de voo por equipamento

#### 3.3.4. Pós-voo e Documentação
- **Registro de Dados Reais:** Horários, altitudes, condições encontradas
- **Upload de Documentos:** Fotos, track logs GPS, regulamentos assinados
- **Geração de Relatórios:** PDF automático com todos os dados do voo
- **Arquivo Permanente:** Histórico completo para auditorias e análises

### 3.4. Sistema de Notificações Push ✅ FINALIZADO

**Funcionalidade:** Comunicação instantânea com toda a comunidade.

**Características:**
- **Notificações Imediatas:** Alertas meteorológicos urgentes
- **Lembretes Automáticos:** Voos agendados, renovações de documentos
- **Segmentação:** Mensagens específicas por tipo de usuário
- **Centro de Controle:** Interface administrativa para gestão de notificações

### 3.5. Progressive Web App (PWA) ✅ FINALIZADO

**Funcionalidade:** Aplicativo mobile nativo com funcionalidades offline.

**Características:**
- **Instalação Nativa:** Ícone na tela inicial do dispositivo
- **Funcionamento Offline:** Acesso a dados mesmo sem internet
- **Sincronização Automática:** Dados salvos localmente sincronizam quando conectado
- **Otimização Mobile:** Interface adaptada para uso em campo

## 4. TECNOLOGIA E SEGURANÇA

### 4.1. Stack Tecnológico
- **Frontend:** Next.js 14, React 18, TypeScript
- **Backend:** Supabase (PostgreSQL) com Row Level Security
- **Hospedagem:** Vercel com certificado SSL
- **E-mail:** Sistema Resend para comunicações automatizadas

### 4.2. Segurança e Conformidade
- **Criptografia:** Toda comunicação via HTTPS
- **Isolamento de Dados:** Row Level Security no banco de dados
- **Auditoria:** Logs completos de todas as ações
- **LGPD:** Conformidade com a Lei Geral de Proteção de Dados
- **Backup Automático:** Sistema de backup contínuo dos dados

### 4.3. Controle de Acesso
- **Perfis Diferenciados:** Admin, Meteorologista, Tesouraria, Piloto, Agência
- **Permissões Granulares:** Acesso específico por funcionalidade
- **Autenticação Segura:** Sistema de login com criptografia de senhas

## 5. BENEFÍCIOS PARA A AVIAÇÃO CIVIL

### 5.1. Segurança Operacional
- **Informações Especializadas:** Meteorologia específica para balonismo
- **Checklists Padronizados:** Procedimentos de segurança uniformes
- **Rastreamento de Operações:** Histórico completo de todos os voos
- **Documentação Automática:** Registros detalhados para análises de segurança

### 5.2. Organização do Setor
- **Cadastro Centralizado:** Base de dados unificada de pilotos e empresas
- **Controle de Certificações:** Validação de licenças e habilitações
- **Transparência:** Informações acessíveis para fiscalização
- **Padronização:** Procedimentos uniformes em toda a região

### 5.3. Compliance Regulatório
- **Facilita Fiscalização:** Dados organizados e acessíveis
- **Histórico Completo:** Rastreabilidade de todas as operações
- **Documentação Padronizada:** Relatórios em formato uniforme
- **Acesso Transparente:** Disponibilidade de informações para autoridades

## 6. ESTATÍSTICAS ATUAIS

### 6.1. Comunidade Ativa
- **~100 usuários ativos:** Pilotos e agências cadastrados
- **~500 assinantes:** Comunidade que recebe boletins meteorológicos
- **~50 voos/mês:** Operações regulares registradas no sistema
- **99.9% disponibilidade:** Sistema operacional contínuo

### 6.2. Operações Documentadas
- **Boletins Diários:** 365 boletins meteorológicos por ano
- **Checklists Aplicados:** 100% dos voos com procedimentos de segurança
- **Horas de Voo Registradas:** Controle completo de operações
- **Documentos Arquivados:** Histórico permanente para auditoria

## 7. COMPROMISSO COM A SEGURANÇA

### 7.1. Missão de Segurança
O Sistema AVIBAQ foi desenvolvido com foco principal na **promoção da segurança operacional** do balonismo. Cada funcionalidade implementada visa reduzir riscos e aumentar a qualidade das operações.

### 7.2. Conformidade Normativa
- **Atendimento ao RBAC:** Procedimentos alinhados com regulamentações vigentes
- **Documentação Completa:** Registros que facilitam auditorias e fiscalizações
- **Transparência Total:** Informações acessíveis para verificação
- **Melhoria Contínua:** Sistema em constante evolução com base em feedback

## 8. CONTATO E INFORMAÇÕES ADICIONAIS

### 8.1. Acesso ao Sistema
- **URL:** https://avibaq.org
- **Demonstração:** Disponível mediante solicitação
- **Documentação Técnica:** Completa e disponível

### 8.2. Responsáveis
- **Presidência AVIBAQ:** [Inserir dados do presidente]
- **Responsável Técnico:** [Inserir dados do desenvolvedor]
- **Contato Institucional:** contato@avibaq.org

### 8.3. Disponibilidade para ANAC
Estamos à inteira disposição da ANAC para:
- **Apresentações Técnicas:** Demonstração completa do sistema
- **Acesso de Fiscalização:** Credenciais especiais para auditoria
- **Relatórios Personalizados:** Dados específicos conforme necessidade
- **Colaboração Regulatória:** Adequações conforme orientações

## 9. CONSIDERAÇÕES FINAIS

O **Sistema AVIBAQ** representa um marco na digitalização responsável do balonismo brasileiro. Nossa plataforma não apenas moderniza as operações, mas fortalece significativamente os aspectos de segurança, organização e compliance do setor.

Desenvolvido com foco específico nas necessidades da aviação de balão e em total alinhamento com as regulamentações da aviação civil, o sistema serve como modelo de como a tecnologia pode ser aplicada para elevar os padrões de segurança e organização do setor aeronáutico.

Reiteramos nosso compromisso com a excelência operacional e nossa disponibilidade para colaborar com a ANAC em todas as iniciativas que visem o fortalecimento da segurança e qualidade da aviação civil brasileira.

---

**AVIBAQ - Associação de Pilotos e Empresas de Balonismo**  
*Praia Grande/SC*  
*Sistema desenvolvido em 2024-2025*  
*Versão do documento: 1.0*