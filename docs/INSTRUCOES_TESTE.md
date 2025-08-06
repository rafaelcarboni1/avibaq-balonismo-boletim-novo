# Instruções para Teste do Módulo de Voos

## ✅ Status da Implementação

**Fases Concluídas:**
- ✅ Fase 1: Estrutura de banco de dados e migrações
- ✅ Fase 2: Páginas de gerenciamento de balões
- ✅ Fase 3: Sistema de convites agência-piloto
- ✅ Fase 4: Páginas de planejamento de voos
- ✅ Fase 5: Sistema de checklist em 3 blocos
- ✅ Fase 6: Formulário pós-voo com anexos
- ✅ Login e Dashboard para pilotos e agências

**Pendente:**
- 🔄 Fase 7: PWA e funcionamento offline
- 🔄 Fases 8-11: Funcionalidades avançadas

## 🔧 Configuração do Ambiente de Teste

### 1. Aplicar Migrações de Banco

Execute as migrações no Supabase:

```bash
# Aplicar todas as migrações do módulo de voos
npx supabase db reset
# OU aplicar apenas as novas migrações
npx supabase db push
```

### 2. Criar Usuários de Teste

⚠️ **IMPORTANTE**: Os usuários de teste devem ser criados manualmente no dashboard do Supabase.

**Acesse:** [Dashboard do Supabase] → Authentication → Users → Add User

**Usuários para criar:**

**Pilotos:**
- Email: `joao.piloto@avibaq.test` | Senha: `teste123`
- Email: `maria.piloto@avibaq.test` | Senha: `teste123`  
- Email: `pedro.piloto@avibaq.test` | Senha: `teste123`

**Agências:**
- Email: `contato@voosmagicos.test` | Senha: `teste123`
- Email: `admin@balaoaventura.test` | Senha: `teste123`

### 3. Executar Aplicação

```bash
npm run dev
# OU
yarn dev
```

## 🧪 Cenários de Teste

### Acesso às Áreas de Login

1. **Página Inicial** → http://localhost:3000
   - Verificar links "Login Piloto" e "Login Agência"

2. **Login Piloto** → http://localhost:3000/piloto/login
   - Testar com: `joao.piloto@avibaq.test` / `teste123`

3. **Login Agência** → http://localhost:3000/agencia/login
   - Testar com: `contato@voosmagicos.test` / `teste123`

### Funcionalidades do Piloto

**Dashboard do Piloto:**
- ✅ Estatísticas: balões ativos, voos do ano/mês, convites pendentes
- ✅ Próximo voo com ações contextuais (iniciar checklist, continuar, finalizar)
- ✅ Histórico de voos recentes
- ✅ Links para funcionalidades principais

**Gerenciamento de Balões:**
- ✅ Listar balões do piloto (`/piloto/meus-baloes`)
- ✅ Cadastrar novo balão
- ✅ Editar balões existentes
- ✅ Validação de prefixo (formato PT-XXX)

**Planejamento de Voos:**
- ✅ Criar novo voo (`/piloto/planejamento`)
- ✅ Seleção de data, período, local
- ✅ Definição de passageiros
- ✅ Seleção de balões para o voo

**Sistema de Checklist:**
- ✅ Checklist em 3 blocos (`/piloto/checklist/[id]`)
- ✅ Navegação entre blocos
- ✅ Marcação de itens obrigatórios
- ✅ Campo para observações em itens não marcados
- ✅ Validação de conclusão de blocos

**Pós-Voo:**
- ✅ Formulário de finalização (`/piloto/pos-voo/[id]`)
- ✅ Dados reais do voo (passageiros, duração, altitude)
- ✅ Upload de anexos (fotos, logs, documentos)
- ✅ Observações finais

**Convites de Agências:**
- ✅ Listar convites pendentes (`/piloto/convites`)
- ✅ Aceitar/rejeitar convites
- ✅ Visualizar detalhes da agência

### Funcionalidades da Agência

**Dashboard da Agência:**
- ✅ Estatísticas: total pilotos, pilotos ativos, voos
- ✅ Status da equipe
- ✅ Próximo voo agendado
- ✅ Histórico de voos da agência

**Gerenciamento de Pilotos:**
- ✅ Listar pilotos vinculados (`/agencia/pilotos`)
- ✅ Enviar convites para novos pilotos
- ✅ Gerenciar status dos vínculos
- ✅ Visualizar frota de balões dos pilotos

**Planejamento para Pilotos:**
- ✅ Criar voos para pilotos da equipe (`/agencia/planejamento`)
- ✅ Seleção de piloto e balões disponíveis
- ✅ Definição completa do voo

## 📊 Dados de Teste Disponíveis

### Membros
- **3 Pilotos**: João Silva, Maria Santos, Pedro Costa
- **2 Agências**: Voos Mágicos Ltda, Balão Aventura S.A.

### Balões
- **7 Balões** distribuídos entre pilotos e agências
- Prefixos válidos: PT-ABC, PT-DEF, PT-GHI, etc.

### Voos
- **Voos Passados**: Finalizados com dados completos
- **Voo de Hoje**: Em progresso (checklist bloco 2)
- **Voos Futuros**: Planejados para próximos dias

### Vínculos
- Agência "Voos Mágicos" → Pilotos João e Maria (aceitos)
- Agência "Balão Aventura" → Piloto Pedro (aceito) + João (pendente)

## 🔍 Pontos Importantes para Testar

### Segurança e Validações
1. **Controle de Acesso**: Piloto não deve acessar área de agência e vice-versa
2. **Validação de Dados**: Prefixos de balões, datas de voos, etc.
3. **Consistência**: Dados entre voos, balões e passageiros

### Fluxo Completo de Voo
1. **Planejamento** → **Checklist** → **Execução** → **Finalização**
2. Testar transições de status: rascunho → planejado → checklist → finalizado
3. Verificar upload e download de anexos

### Interface e Usabilidade
1. **Responsividade**: Testar em desktop e mobile
2. **Magic UI**: Verificar animações e componentes
3. **Navegação**: Links funcionando corretamente
4. **Feedback**: Mensagens de erro e sucesso

### Performance
1. **Carregamento**: Dashboards com múltiplas consultas
2. **Upload**: Anexos de diferentes tamanhos
3. **Filtros**: Busca e ordenação de dados

## 🐛 Problemas Conhecidos

1. **Middleware de Autenticação**: Pode necessitar ajustes nos cookies do Supabase
2. **Upload de Arquivos**: Verificar configuração do storage bucket
3. **Time Zone**: Datas podem variar conforme fuso horário local

## 📝 Próximas Implementações

Após validação das funcionalidades atuais:
- **Fase 7**: PWA com funcionamento offline
- **Fase 8**: Sistema de notificações
- **Fase 9**: Relatórios avançados
- **Fase 10**: Integração com APIs externas
- **Fase 11**: Testes automatizados

## 🆘 Suporte

Para problemas ou dúvidas sobre o teste:
1. Verificar logs no console do navegador
2. Checar logs do Supabase no dashboard
3. Revisar estrutura do banco de dados
4. Confirmar se todas as migrações foram aplicadas