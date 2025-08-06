-- Migração para criar sistema completo de notificações push
-- Criada em: 2025-07-21
-- Descrição: Sistema completo de push notifications para PWA AVIBAQ

-- ==========================================================
-- TABELA 1: PUSH SUBSCRIPTIONS
-- ==========================================================
-- Armazena as subscriptions dos usuários para Web Push
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dados da subscription (formato Web Push API)
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL, -- Chave pública P-256
  auth_key TEXT NOT NULL,   -- Chave de autenticação
  
  -- Metadados do dispositivo/browser
  user_agent TEXT,
  ip_address INET,
  platform VARCHAR(50), -- 'android', 'ios', 'desktop', 'unknown'
  
  -- Status da subscription
  active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- TTL opcional
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, endpoint), -- Evita duplicatas do mesmo endpoint
  
  -- Validações
  CONSTRAINT check_endpoint_valid CHECK (endpoint LIKE 'https://%'),
  CONSTRAINT check_keys_not_empty CHECK (
    LENGTH(p256dh_key) > 0 AND LENGTH(auth_key) > 0
  )
);

-- ==========================================================
-- TABELA 2: PUSH NOTIFICATIONS  
-- ==========================================================
-- Templates e configurações das notificações
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Conteúdo da notificação
  title VARCHAR(50) NOT NULL CHECK (LENGTH(title) > 0),
  message VARCHAR(120) NOT NULL CHECK (LENGTH(message) > 0),
  internal_link VARCHAR(200), -- Link interno do sistema (/piloto/dashboard, etc.)
  icon_url TEXT, -- URL do ícone personalizado (opcional)
  
  -- Configurações de público-alvo
  target_audience JSONB NOT NULL DEFAULT '{}', -- {"type": "all"} ou {"type": "roles", "roles": ["pilot", "agency"]} ou {"type": "users", "user_ids": [...]}
  
  -- Agendamento
  send_type VARCHAR(20) NOT NULL DEFAULT 'immediate' CHECK (send_type IN ('immediate', 'scheduled', 'recurring')),
  scheduled_date TIMESTAMP WITH TIME ZONE, -- Para envios agendados
  recurring_rule JSONB, -- Para recorrências: {"frequency": "weekly", "day": "monday", "time": "18:00"}
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  
  -- Estatísticas de entrega
  total_targeted INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  total_expired INTEGER DEFAULT 0,
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validações
  CONSTRAINT check_scheduled_date_future CHECK (
    scheduled_date IS NULL OR scheduled_date > NOW()
  ),
  CONSTRAINT check_recurring_has_rule CHECK (
    send_type != 'recurring' OR recurring_rule IS NOT NULL
  )
);

-- ==========================================================
-- TABELA 3: PUSH DELIVERY LOGS
-- ==========================================================
-- Logs detalhados de cada entrega de notificação
CREATE TABLE push_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES push_notifications(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status da entrega
  delivery_status VARCHAR(20) NOT NULL CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'expired', 'clicked')),
  
  -- Detalhes técnicos
  http_status INTEGER, -- Status code da resposta do push service
  error_message TEXT, -- Mensagem de erro se houver
  push_service_response JSONB, -- Resposta completa do serviço (para debug)
  
  -- Metadados
  user_agent TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE, -- Se o usuário clicou na notificação
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para consultas rápidas
  CONSTRAINT fk_notification_id FOREIGN KEY (notification_id) REFERENCES push_notifications(id),
  CONSTRAINT fk_subscription_id FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id),
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ==========================================================
-- TABELA 4: PUSH SCHEDULED JOBS
-- ==========================================================
-- Gerenciamento de jobs agendados e recorrentes
CREATE TABLE push_scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES push_notifications(id) ON DELETE CASCADE,
  
  -- Configuração do job
  job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('once', 'recurring')),
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  recurring_rule JSONB, -- Regra de recorrência detalhada
  
  -- Estado do job
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  run_count INTEGER DEFAULT 0,
  max_runs INTEGER, -- Limite de execuções (para jobs recorrentes limitados)
  
  -- Controle de erro
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validações
  CONSTRAINT check_next_run_future CHECK (next_run_at > NOW()),
  CONSTRAINT check_recurring_has_rule CHECK (
    job_type != 'recurring' OR recurring_rule IS NOT NULL
  )
);

-- ==========================================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================================

-- Push Subscriptions
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active) WHERE active = true;
CREATE INDEX idx_push_subscriptions_expires ON push_subscriptions(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_push_subscriptions_last_used ON push_subscriptions(last_used_at);

-- Push Notifications  
CREATE INDEX idx_push_notifications_created_by ON push_notifications(created_by);
CREATE INDEX idx_push_notifications_status ON push_notifications(status);
CREATE INDEX idx_push_notifications_send_type ON push_notifications(send_type);
CREATE INDEX idx_push_notifications_scheduled_date ON push_notifications(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_push_notifications_created_at ON push_notifications(created_at);

-- Push Delivery Logs
CREATE INDEX idx_push_delivery_notification ON push_delivery_logs(notification_id);
CREATE INDEX idx_push_delivery_user ON push_delivery_logs(user_id);
CREATE INDEX idx_push_delivery_status ON push_delivery_logs(delivery_status);
CREATE INDEX idx_push_delivery_sent_at ON push_delivery_logs(sent_at);

-- Push Scheduled Jobs
CREATE INDEX idx_push_jobs_notification ON push_scheduled_jobs(notification_id);
CREATE INDEX idx_push_jobs_next_run ON push_scheduled_jobs(next_run_at);
CREATE INDEX idx_push_jobs_status ON push_scheduled_jobs(status);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PUSH SUBSCRIPTIONS
-- Usuários podem ver/gerenciar apenas suas próprias subscriptions
CREATE POLICY "Usuários podem gerenciar suas próprias subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = (SELECT id FROM users WHERE id = auth.uid()));

-- Admins podem ver todas as subscriptions (para relatórios)  
CREATE POLICY "Admins podem ver todas as subscriptions" ON push_subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICAS PUSH NOTIFICATIONS
-- Apenas admins podem criar/gerenciar notificações
CREATE POLICY "Apenas admins podem gerenciar notificações" ON push_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICAS PUSH DELIVERY LOGS  
-- Apenas admins podem ver logs de entrega
CREATE POLICY "Apenas admins podem ver logs de entrega" ON push_delivery_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuários podem ver apenas seus próprios logs (para transparência)
CREATE POLICY "Usuários podem ver seus próprios logs" ON push_delivery_logs
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE id = auth.uid()));

-- POLÍTICAS PUSH SCHEDULED JOBS
-- Apenas admins podem gerenciar jobs agendados
CREATE POLICY "Apenas admins podem gerenciar jobs agendados" ON push_scheduled_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==========================================================
-- TRIGGERS E FUNÇÕES
-- ==========================================================

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_push_notifications_updated_at
  BEFORE UPDATE ON push_notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_push_jobs_updated_at
  BEFORE UPDATE ON push_scheduled_jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_updated_at();

-- Função para limpar subscriptions expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE push_subscriptions 
  SET active = false, updated_at = NOW()
  WHERE active = true 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Log da limpeza
  INSERT INTO push_delivery_logs (
    notification_id, subscription_id, user_id, delivery_status, error_message
  )
  SELECT 
    NULL, ps.id, ps.user_id, 'expired', 
    'Subscription automaticamente marcada como expirada'
  FROM push_subscriptions ps 
  WHERE ps.active = false 
    AND ps.expires_at IS NOT NULL 
    AND ps.expires_at < NOW()
    AND ps.updated_at > NOW() - INTERVAL '1 minute';
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas de entrega em tempo real
CREATE OR REPLACE FUNCTION update_notification_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar contadores na tabela de notificações
  UPDATE push_notifications SET
    total_sent = (
      SELECT COUNT(*) FROM push_delivery_logs 
      WHERE notification_id = NEW.notification_id 
        AND delivery_status IN ('sent', 'delivered')
    ),
    total_delivered = (
      SELECT COUNT(*) FROM push_delivery_logs 
      WHERE notification_id = NEW.notification_id 
        AND delivery_status = 'delivered'
    ),
    total_failed = (
      SELECT COUNT(*) FROM push_delivery_logs 
      WHERE notification_id = NEW.notification_id 
        AND delivery_status = 'failed'
    ),
    total_expired = (
      SELECT COUNT(*) FROM push_delivery_logs 
      WHERE notification_id = NEW.notification_id 
        AND delivery_status = 'expired'
    ),
    updated_at = NOW()
  WHERE id = NEW.notification_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar estatísticas automaticamente
CREATE TRIGGER trigger_update_notification_stats
  AFTER INSERT OR UPDATE ON push_delivery_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_stats();

-- ==========================================================
-- VIEWS ÚTEIS PARA RELATÓRIOS
-- ==========================================================

-- View para estatísticas gerais de push notifications
CREATE VIEW vw_push_notifications_stats AS
SELECT 
  pn.id,
  pn.title,
  pn.created_by,
  u.nome as created_by_name,
  pn.status,
  pn.send_type,
  pn.total_targeted,
  pn.total_sent,
  pn.total_delivered,
  pn.total_failed,
  pn.total_expired,
  CASE 
    WHEN pn.total_targeted > 0 THEN 
      ROUND((pn.total_delivered::numeric / pn.total_targeted::numeric) * 100, 2)
    ELSE 0 
  END as delivery_rate_percent,
  pn.created_at,
  pn.sent_at
FROM push_notifications pn
JOIN users u ON u.id = pn.created_by
ORDER BY pn.created_at DESC;

-- View para subscriptions ativas por role
CREATE VIEW vw_active_subscriptions_by_role AS
SELECT 
  u.role,
  COUNT(*) as total_subscriptions,
  COUNT(DISTINCT ps.user_id) as unique_users,
  MAX(ps.created_at) as latest_subscription
FROM push_subscriptions ps
JOIN users u ON u.id = ps.user_id
WHERE ps.active = true
GROUP BY u.role;

-- ==========================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ==========================================================

COMMENT ON TABLE push_subscriptions IS 'Armazena subscriptions de Web Push dos usuários para entrega de notificações';
COMMENT ON TABLE push_notifications IS 'Templates e configurações das notificações push enviadas pelo sistema';
COMMENT ON TABLE push_delivery_logs IS 'Logs detalhados de cada tentativa de entrega de notificação';
COMMENT ON TABLE push_scheduled_jobs IS 'Gerenciamento de jobs agendados e recorrentes para envio de notificações';

COMMENT ON COLUMN push_subscriptions.endpoint IS 'URL do endpoint do serviço de push (Google FCM, Mozilla, etc.)';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'Chave pública P-256 para criptografia da mensagem';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'Chave de autenticação para validação da origem';

COMMENT ON COLUMN push_notifications.target_audience IS 'Configuração do público-alvo em formato JSON: {"type": "all|roles|users", "roles": [...], "user_ids": [...]}';
COMMENT ON COLUMN push_notifications.recurring_rule IS 'Regra de recorrência em JSON: {"frequency": "daily|weekly|monthly", "day": "monday", "time": "18:00", "timezone": "America/Sao_Paulo"}';

COMMENT ON VIEW vw_push_notifications_stats IS 'Estatísticas consolidadas das notificações push para relatórios administrativos';
COMMENT ON VIEW vw_active_subscriptions_by_role IS 'Contagem de subscriptions ativas agrupadas por role do usuário';