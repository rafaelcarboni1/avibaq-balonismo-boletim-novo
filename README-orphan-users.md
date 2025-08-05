# Scripts de Correção e Monitoramento de Usuários Órfãos

Este conjunto de scripts foi criado para resolver e prevenir o problema de usuários órfãos no sistema AVIBAQ - usuários que existem em `auth.users` mas não têm registro correspondente em `public.users`.

## Problema Identificado

O problema ocorria quando usuários se cadastravam via `/associar-se` e, por alguma falha no processo, eram criados no sistema de autenticação do Supabase (`auth.users`) mas não tinham o registro correspondente criado na tabela `public.users`. Isso causava erros de foreign key constraint em outras partes do sistema.

## Scripts Disponíveis

### 1. `fix-orphan-users.js` - Correção de Usuários Órfãos

**Propósito**: Identifica e corrige usuários órfãos existentes no sistema.

**Como usar**:
```bash
node fix-orphan-users.js
```

**O que faz**:
- Identifica usuários que existem em `auth.users` mas não em `public.users`
- Cria registros correspondentes em `public.users` para esses usuários
- Define role baseado no email (admin, piloto, agencia)
- Define status ativo baseado na última atividade
- Gera relatório detalhado da correção
- Testa se as constraints de foreign key estão funcionando

**Saída**:
- Relatório em `orphan-users-report.json`
- Logs detalhados no console

### 2. `monitor-orphan-users.js` - Monitoramento Contínuo

**Propósito**: Monitora continuamente o sistema para detectar e corrigir automaticamente novos usuários órfãos.

**Comandos disponíveis**:

#### Verificação única:
```bash
node monitor-orphan-users.js check
```

#### Monitoramento contínuo:
```bash
node monitor-orphan-users.js start
```

#### Ver estatísticas:
```bash
node monitor-orphan-users.js stats
```

**Recursos do Monitor**:
- Verificação automática a cada 30 minutos
- Auto-correção para até 5 usuários órfãos por vez
- Alertas para situações críticas (muitos usuários órfãos)
- Logs detalhados em `orphan-users-monitor.log`
- Relatórios diários em `orphan-users-daily-report.json`
- Graceful shutdown com Ctrl+C

### 3. Scripts SQL de Apoio

#### `fix_orphan_auth_users.sql`
Script SQL original para correção manual via Supabase Dashboard.

#### `verificar_usuarios_orfaos.sql`
Script para verificação e análise de usuários órfãos.

#### `analisar_cadastros_associar_se.sql`
Script para análise detalhada do fluxo de cadastro via `/associar-se`.

#### `correcao_preventiva_usuarios_orfaos.sql`
Script SQL para correção preventiva de inconsistências.

## Configuração

### Pré-requisitos

1. Node.js instalado
2. Dependência do Supabase:
   ```bash
   npm install @supabase/supabase-js
   ```

### Credenciais

Os scripts usam as credenciais do projeto Supabase configuradas diretamente no código. Para segurança em produção, considere usar variáveis de ambiente:

```javascript
const SUPABASE_URL = process.env.SUPABASE_URL || 'sua-url-aqui';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sua-chave-aqui';
```

## Monitoramento em Produção

### Executar como Serviço

Para executar o monitor continuamente em produção, você pode:

1. **Usar PM2** (recomendado):
   ```bash
   npm install -g pm2
   pm2 start monitor-orphan-users.js --name "orphan-monitor" -- start
   pm2 save
   pm2 startup
   ```

2. **Usar systemd** (Linux):
   Criar arquivo `/etc/systemd/system/orphan-monitor.service`

3. **Usar Docker**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY . .
   RUN npm install
   CMD ["node", "monitor-orphan-users.js", "start"]
   ```

### Configuração de Alertas

O monitor pode ser configurado para enviar alertas via:
- Email (implementar função `sendAlert`)
- Webhook para Slack/Discord
- Integração com sistemas de monitoramento (Datadog, New Relic, etc.)

## Logs e Relatórios

### Arquivos Gerados

- `orphan-users-report.json` - Relatório da última correção
- `orphan-users-monitor.log` - Log contínuo do monitor
- `orphan-users-daily-report.json` - Relatório diário de estatísticas
- `alert-[timestamp].json` - Relatórios de alertas críticos

### Rotação de Logs

Para produção, configure rotação de logs:
```bash
# Adicionar ao crontab
0 0 * * * /usr/sbin/logrotate /path/to/logrotate.conf
```

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão com Supabase**:
   - Verificar URL e chaves de API
   - Verificar conectividade de rede

2. **Erro de permissões**:
   - Verificar se a service_role_key está correta
   - Verificar RLS policies no Supabase

3. **Muitos usuários órfãos**:
   - Investigar problema no fluxo de cadastro
   - Executar correção manual com `fix-orphan-users.js`

### Debug

Para debug detalhado, adicione logs extras:
```javascript
console.log('Debug info:', { authUsers, publicUsers, orphanUsers });
```

## Manutenção

### Verificações Regulares

1. **Diárias**: Verificar logs de erro
2. **Semanais**: Analisar relatórios de estatísticas
3. **Mensais**: Revisar e otimizar configurações

### Atualizações

Ao atualizar os scripts:
1. Testar em ambiente de desenvolvimento
2. Fazer backup dos logs existentes
3. Atualizar gradualmente em produção

## Segurança

### Boas Práticas

1. **Nunca** commitar chaves de API no código
2. Usar variáveis de ambiente para credenciais
3. Restringir acesso aos logs (podem conter emails)
4. Monitorar uso da service_role_key
5. Implementar rate limiting se necessário

### Auditoria

Todos os scripts geram logs detalhados para auditoria:
- Quais usuários foram corrigidos
- Quando as correções foram feitas
- Quem executou os scripts (via logs do sistema)

## Contato

Para dúvidas ou problemas com estes scripts, consulte:
1. Logs detalhados nos arquivos gerados
2. Documentação do Supabase
3. Equipe de desenvolvimento do AVIBAQ

---

**Última atualização**: 2025-01-25
**Versão**: 1.0
**Autor**: Sistema AVIBAQ - Correção de Usuários Órfãos