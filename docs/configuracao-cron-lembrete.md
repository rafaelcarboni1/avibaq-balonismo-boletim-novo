# Configuração do Cron Job para Lembrete Diário

## Descrição

O sistema de lembrete diário envia e-mails automáticos às 19h (horário de Brasília) para pilotos e agências que têm voos programados para o dia seguinte.

## Arquivos Relacionados

- `pages/api/cron/lembrete-voos.ts` - Endpoint principal do cron job
- `pages/api/send-email.ts` - Serviço de envio de e-mail usando Resend
- `docs/configuracao-cron-lembrete.md` - Este arquivo de documentação

## Configuração por Plataforma

### Vercel (Recomendado)

1. **Vercel Cron Jobs** (Plano Pro ou superior):
   ```json
   // vercel.json
   {
     "crons": [
       {
         "path": "/api/cron/lembrete-voos",
         "schedule": "0 22 * * *"
       }
     ]
   }
   ```
   
   **Nota:** O horário é em UTC. 22:00 UTC = 19:00 BRT (Brasília)

2. **Webhook externo** (Alternativa para plano gratuito):
   - Use um serviço como UptimeRobot, Cronitor ou similar
   - Configure para fazer POST para: `https://seu-dominio.com/api/cron/lembrete-voos`
   - Horário: 19:00 BRT (22:00 UTC)

### Netlify

1. **Netlify Functions + Scheduled Functions**:
   ```javascript
   // netlify/functions/lembrete-voos.js
   exports.handler = async (event, context) => {
     // Código do lembrete aqui
   };
   ```

2. **Webhook externo**:
   - Configure webhook para: `https://seu-dominio.netlify.app/.netlify/functions/lembrete-voos`

### Servidor Próprio (Linux)

1. **Crontab**:
   ```bash
   # Editar crontab
   crontab -e
   
   # Adicionar linha (19h BRT todos os dias)
   0 19 * * * curl -X POST https://seu-dominio.com/api/cron/lembrete-voos
   ```

2. **Systemd Timer** (alternativa moderna):
   ```ini
   # /etc/systemd/system/lembrete-voos.service
   [Unit]
   Description=Lembrete de voos AVIBAQ
   
   [Service]
   Type=oneshot
   ExecStart=/usr/bin/curl -X POST https://seu-dominio.com/api/cron/lembrete-voos
   
   # /etc/systemd/system/lembrete-voos.timer
   [Unit]
   Description=Executar lembrete de voos às 19h
   
   [Timer]
   OnCalendar=19:00
   Persistent=true
   
   [Install]
   WantedBy=timers.target
   ```

### Serviços de Cron Externos

1. **EasyCron** (https://www.easycron.com/):
   - URL: `https://seu-dominio.com/api/cron/lembrete-voos`
   - Método: POST
   - Agendamento: `0 19 * * *`

2. **Cronitor** (https://cronitor.io/):
   - Similar à configuração do EasyCron

3. **UptimeRobot** (https://uptimerobot.com/):
   - Configure como "Keyword Monitor"
   - URL: `https://seu-dominio.com/api/cron/lembrete-voos`
   - Método: POST
   - Intervalo: Diário às 19h

## Variáveis de Ambiente Necessárias

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

## Teste Manual

Para testar o funcionamento do sistema, você pode fazer uma requisição POST manual:

```bash
# Teste via cURL
curl -X POST https://seu-dominio.com/api/cron/lembrete-voos \
  -H "Content-Type: application/json"

# Teste via Postman
POST https://seu-dominio.com/api/cron/lembrete-voos
Content-Type: application/json
```

## Resposta Esperada

```json
{
  "message": "Lembretes processados",
  "voosEncontrados": 3,
  "sucessos": 3,
  "erros": 0,
  "resultados": [
    {
      "voo_id": "uuid-do-voo",
      "piloto_email": "piloto@email.com",
      "piloto_enviado": true,
      "agencia_email": "agencia@email.com",
      "agencia_enviado": true,
      "erro": null
    }
  ]
}
```

## Monitoramento

O sistema registra logs na tabela `logs_atividade` para auditoria:

```sql
SELECT * FROM logs_atividade 
WHERE tipo_atividade = 'lembrete_voos' 
ORDER BY created_at DESC;
```

## Troubleshooting

### 1. E-mails não sendo enviados

- Verifique se `RESEND_API_KEY` está configurada
- Verifique se o domínio está verificado no Resend
- Verifique logs no dashboard do Resend

### 2. Cron não executando

- Verifique se o horário está correto (UTC vs local)
- Teste manualmente o endpoint
- Verifique logs da plataforma de hospedagem

### 3. Voos não sendo encontrados

- Verifique se há voos cadastrados para o dia seguinte
- Verifique se os status dos voos estão corretos
- Teste a query no banco de dados

### 4. Erro de timeout

- Aumente o timeout da função (Vercel: 60s max)
- Considere processar em lotes se houver muitos voos
- Otimize as queries do banco

## Configuração Recomendada

Para um ambiente de produção, recomendamos:

1. **Vercel Cron Jobs** (se no plano Pro+)
2. **Webhook via UptimeRobot** (se no plano gratuito)
3. **Monitoramento via Cronitor** para alertas em caso de falha
4. **Backup via segundo serviço** (EasyCron) executando 15 minutos depois

## Exemplo de Configuração Completa (Vercel)

```json
// vercel.json
{
  "functions": {
    "pages/api/cron/lembrete-voos.ts": {
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/lembrete-voos",
      "schedule": "0 22 * * *"
    }
  ]
}
```

## Alertas e Notificações

Para receber alertas em caso de falha:

1. Configure webhook no Cronitor
2. Configure alertas no Resend Dashboard
3. Configure monitoramento no Vercel Analytics
4. Configure notificações no sistema de logs

---

*Este documento deve ser atualizado sempre que houver mudanças na configuração do cron job.*