# 🔍 Análise Completa do Banco de Dados Supabase

Este script permite fazer uma análise completa e detalhada do banco de dados Supabase usando conexão direta PostgreSQL.

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 14 ou superior)
2. **Biblioteca pg** para PostgreSQL:
   ```bash
   npm install pg
   ```
3. **Senha do banco de dados** Supabase

## 🔑 Como Obter a Senha do Banco

### Opção 1: Supabase Dashboard
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `elcbodhxzvoqpzamgown`
3. Vá em **Settings** → **Database**
4. Na seção **Connection Info**, clique em **Connection pooling**
5. A senha estará visível ou você pode resetá-la

### Opção 2: Supabase CLI
```bash
# Instalar CLI se não tiver
npm install -g supabase

# Login
supabase login

# Obter informações do projeto
supabase projects list
supabase db show --project-ref elcbodhxzvoqpzamgown
```

### Opção 3: Variáveis de Ambiente
A senha pode estar configurada em:
- Variáveis de ambiente do sistema
- Arquivo `.env` local (não commitado)
- Configurações do Vercel/deploy

## 🚀 Como Executar

### Passo 1: Configurar a Senha
Edite o arquivo `scripts/analyze-database-direct.js` e substitua `[YOUR-PASSWORD]` pela senha real:

```javascript
const connectionString = 'postgresql://postgres:SUA_SENHA_AQUI@db.elcbodhxzvoqpzamgown.supabase.co:5432/postgres';
```

### Passo 2: Instalar Dependências
```bash
cd /Users/rafaelcarboni/Documents/AVIBAQ\ -\ 1.0/avibaq-balonismo-boletim
npm install pg
```

### Passo 3: Executar Análise
```bash
node scripts/analyze-database-direct.js
```

## 📊 O Que o Script Analisa

### 🏗️ Estrutura do Banco
- ✅ Informações básicas (versão, usuário, etc.)
- ✅ Lista completa de tabelas
- ✅ Colunas com tipos, constraints e comentários
- ✅ Chaves primárias e estrangeiras
- ✅ Índices e suas propriedades
- ✅ Contagem de registros por tabela

### ⚙️ Funcionalidades Avançadas
- ✅ Funções e procedures personalizadas
- ✅ Triggers e suas configurações
- ✅ Políticas RLS (Row Level Security)
- ✅ Extensões PostgreSQL instaladas

### 📄 Relatórios Gerados

1. **JSON Completo**: `.trae/documents/analise-completa-banco-supabase.json`
   - Dados estruturados para processamento
   - Todas as informações coletadas
   - Formato ideal para integração

2. **Relatório Markdown**: `.trae/documents/relatorio-banco-supabase-completo.md`
   - Formato legível e organizado
   - Tabelas formatadas
   - Documentação completa

## 🔧 Solução de Problemas

### Erro de Conexão
```
Error: connect ECONNREFUSED
```
**Soluções:**
- Verifique se a senha está correta
- Confirme se o projeto Supabase está ativo
- Teste a conexão pelo Dashboard primeiro

### Erro de Autenticação
```
Error: password authentication failed
```
**Soluções:**
- Regenere a senha no Dashboard
- Verifique se está usando a senha correta (não a service key)
- Confirme o usuário (deve ser `postgres`)

### Erro de SSL
```
Error: self signed certificate
```
**Solução:**
O script já está configurado com `ssl: { rejectUnauthorized: false }`

### Timeout de Conexão
```
Error: timeout expired
```
**Soluções:**
- Verifique sua conexão com internet
- Tente novamente em alguns minutos
- Verifique se não há firewall bloqueando

## 🎯 Vantagens desta Abordagem

### ✅ Acesso Direto
- Bypassa problemas do MCP Supabase
- Conexão nativa PostgreSQL
- Acesso completo a metadados

### ✅ Análise Completa
- Todas as tabelas e relacionamentos
- Políticas de segurança (RLS)
- Triggers e funções personalizadas
- Estatísticas de dados

### ✅ Relatórios Detalhados
- JSON para processamento automático
- Markdown para documentação
- Informações técnicas e de negócio

## 🔄 Próximos Passos

Após executar a análise:

1. **Revisar Relatórios**
   - Abrir `.trae/documents/relatorio-banco-supabase-completo.md`
   - Verificar estrutura e relacionamentos

2. **Integração com Código**
   - Comparar com tipos TypeScript em `src/integrations/supabase/`
   - Validar hooks e queries existentes

3. **Documentação**
   - Atualizar documentação do projeto
   - Compartilhar insights com a equipe

## 🔒 Segurança

⚠️ **IMPORTANTE**: 
- Nunca commite a senha no código
- Use variáveis de ambiente em produção
- Mantenha credenciais seguras
- Remova a senha do script após uso

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de erro detalhados
2. Teste conexão pelo Supabase Dashboard
3. Confirme configurações de rede/firewall
4. Consulte documentação oficial do Supabase

---

**Criado em:** $(date)
**Projeto:** AVIBAQ - Sistema de Boletim de Balonismo
**Banco:** elcbodhxzvoqpzamgown.supabase.co