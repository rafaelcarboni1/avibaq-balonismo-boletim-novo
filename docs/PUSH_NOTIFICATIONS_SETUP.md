# Sistema de Push Notifications - AVIBAQ

## Configuração das Variáveis de Ambiente

Para que o sistema de notificações push funcione corretamente, você precisa configurar as seguintes variáveis de ambiente no arquivo `.env.local`:

### VAPID Keys (Obrigatório)

As VAPID keys são necessárias para autenticar as notificações push. Você pode gerá-las usando a biblioteca `web-push`:

```bash
# Instalar web-push globalmente
npm install -g web-push

# Gerar VAPID keys
web-push generate-vapid-keys
```

Isso irá gerar um par de chaves público/privado. Adicione-as ao `.env.local`:

```env
# VAPID Keys para Web Push
VAPID_PUBLIC_KEY=BGo0RVH-UKLJEDJYjsTVUnvRrm19m5dBbzAucLxkTy9EQV4YI1yAsz1MxH8z1mtxXIPfMEmTOdzN8m4m4uFz80Y
VAPID_PRIVATE_KEY=T8mWtUwYLDL6tL8KpsuOUuA6KP90YbXwE7bG9Z9A_6o
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGo0RVH-UKLJEDJYjsTVUnvRrm19m5dBbzAucLxkTy9EQV4YI1yAsz1MxH8z1mtxXIPfMEmTOdzN8m4m4uFz80Y
```

### Variáveis de Banco de Dados (Já existentes)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...  # Necessário para as APIs push
```

## Configuração do Banco de Dados

Execute a migração do sistema de push notifications:

```bash
npx supabase db push
```

Isso criará as seguintes tabelas:
- `push_subscriptions` - Armazena as subscriptions dos usuários
- `push_notifications` - Templates e configurações das notificações  
- `push_delivery_logs` - Logs detalhados de entrega
- `push_scheduled_jobs` - Gerenciamento de jobs agendados

## Configuração do Service Worker

O Service Worker já está configurado em `public/sw.js` com os listeners necessários para:
- Receber notificações push
- Gerenciar cliques em notificações
- Tracking de interações

## Como Testar

### 1. Teste Local

1. Configure as VAPID keys no `.env.local`
2. Execute `npm run dev`
3. Acesse um dashboard (piloto ou agência)
4. Ative as notificações push
5. Vá para `/admin/push-center` (como admin)
6. Envie uma notificação teste

### 2. Verificação de Funcionamento

- ✅ Service Worker deve estar registrado
- ✅ Permissão de notificação deve ser solicitada
- ✅ Subscription deve ser salva no banco
- ✅ Admin deve conseguir enviar notificações
- ✅ Notificações devem aparecer mesmo com app fechado

## Troubleshooting

### Service Worker não registra
- Verifique se está usando HTTPS (ou localhost)
- Abra DevTools > Application > Service Workers

### Notificações não aparecem
- Verifique as permissões do navegador
- Confirme que as VAPID keys estão corretas
- Verifique os logs do servidor

### Erro de VAPID keys
```
Error: No valid VAPID keys found
```
- Gere novas VAPID keys com `web-push generate-vapid-keys`
- Certifique-se que ambas as variáveis estão definidas

### RLS Policy Errors
- Confirme que `SUPABASE_SERVICE_ROLE_KEY` está configurada
- As APIs push usam service role para contornar RLS

## Recursos Implementados

### ✅ Funcionalidades Completas
- [x] Subscription management (subscribe/unsubscribe)
- [x] Envio imediato de notificações
- [x] Interface admin com editor e preview
- [x] Service Worker com handlers completos
- [x] Tracking de cliques e entregas
- [x] Múltiples públicos-alvo (todos, pilotos, agências)
- [x] Preview Android/iOS
- [x] Integração nos dashboards

### 🚧 Em Desenvolvimento
- [ ] Sistema de agendamento
- [ ] Notificações recorrentes  
- [ ] Histórico de envios
- [ ] Estatísticas de engajamento

## Segurança

- ✅ Apenas admins podem enviar notificações
- ✅ RLS policies protegem dados sensíveis
- ✅ Service role usado apenas em APIs servidor
- ✅ VAPID keys validam origem das notificações
- ✅ Opt-out disponível para todos usuários

## Performance

- Envios em lotes de 10 para evitar rate limiting
- Cache de 15 minutos para reduzir chamadas desnecessárias
- Cleanup automático de subscriptions expiradas
- Logs estruturados para monitoramento

---

## Exemplo de .env.local completo

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://elcbodhxzvoqpzamgown.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Push Notifications
VAPID_PUBLIC_KEY=BF4j5N3X8kY9zA2B3c...
VAPID_PRIVATE_KEY=aGVsbG8gd29ybGQ...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BF4j5N3X8kY9zA2B3c...

# Email (já existente)
RESEND_API_KEY=re_...
```

Lembre-se de **NUNCA** commitar o arquivo `.env.local` ao repositório!