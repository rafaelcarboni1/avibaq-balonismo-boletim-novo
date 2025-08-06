-- Script para corrigir tabelas de push notifications
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Remover tabelas existentes (se houver problemas)
DROP TABLE IF EXISTS push_delivery_logs CASCADE;
DROP TABLE IF EXISTS push_scheduled_jobs CASCADE; 
DROP TABLE IF EXISTS push_notifications CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;

-- PASSO 2: Recriar as tabelas com estrutura correta

-- ==========================================================
-- TABELA 1: PUSH SUBSCRIPTIONS
-- ==========================================================
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Dados da subscription (formato Web Push API)
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  
  -- Metadados do dispositivo/browser
  user_agent TEXT,
  ip_address INET,
  platform VARCHAR(50),
  
  -- Status da subscription
  active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, endpoint),
  CONSTRAINT check_endpoint_valid CHECK (endpoint LIKE 'https://%'),
  CONSTRAINT check_keys_not_empty CHECK (
    LENGTH(p256dh_key) > 0 AND LENGTH(auth_key) > 0
  )
);

-- ==========================================================
-- TABELA 2: PUSH NOTIFICATIONS  
-- ==========================================================
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Conteúdo da notificação
  title VARCHAR(50) NOT NULL CHECK (LENGTH(title) > 0),
  message VARCHAR(120) NOT NULL CHECK (LENGTH(message) > 0),
  internal_link VARCHAR(200),
  icon_url TEXT,
  
  -- Configurações de público-alvo
  target_audience JSONB NOT NULL DEFAULT '{}',
  
  -- Agendamento
  send_type VARCHAR(20) NOT NULL DEFAULT 'immediate' CHECK (send_type IN ('immediate', 'scheduled', 'recurring')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  recurring_rule JSONB,
  
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- TABELA 3: PUSH DELIVERY LOGS
-- ==========================================================
CREATE TABLE push_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES push_notifications(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES push_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status da entrega
  delivery_status VARCHAR(20) NOT NULL CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'expired', 'clicked')),
  
  -- Detalhes técnicos
  http_status INTEGER,
  error_message TEXT,
  push_service_response JSONB,
  
  -- Metadados
  user_agent TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- TABELA 4: PUSH SCHEDULED JOBS
-- ==========================================================
CREATE TABLE push_scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES push_notifications(id) ON DELETE CASCADE,
  
  -- Configuração do job
  job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('once', 'recurring')),
  next_run_at TIMESTAMP WITH TIME ZONE NOT NULL,
  recurring_rule JSONB,
  
  -- Estado do job
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  run_count INTEGER DEFAULT 0,
  max_runs INTEGER,
  
  -- Controle de erro
  failure_count INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- ÍNDICES PARA PERFORMANCE
-- ==========================================================
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_active ON push_subscriptions(active) WHERE active = true;
CREATE INDEX idx_push_notifications_created_by ON push_notifications(created_by);
CREATE INDEX idx_push_notifications_status ON push_notifications(status);
CREATE INDEX idx_push_delivery_notification ON push_delivery_logs(notification_id);
CREATE INDEX idx_push_jobs_next_run ON push_scheduled_jobs(next_run_at);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (usuários podem gerenciar suas subscriptions)
CREATE POLICY "Usuários podem gerenciar suas próprias subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());

-- Apenas admins podem gerenciar notificações
CREATE POLICY "Apenas admins podem gerenciar notificações" ON push_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'meteo', 'tesouraria')
    )
  );

-- Apenas admins podem ver logs de entrega
CREATE POLICY "Apenas admins podem ver logs de entrega" ON push_delivery_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'meteo', 'tesouraria')
    )
  );

-- Apenas admins podem gerenciar jobs agendados
CREATE POLICY "Apenas admins podem gerenciar jobs agendados" ON push_scheduled_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'meteo', 'tesouraria')
    )
  );

-- ==========================================================
-- TRIGGERS PARA UPDATED_AT
-- ==========================================================
CREATE OR REPLACE FUNCTION trigger_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_push_notifications_updated_at
  BEFORE UPDATE ON push_notifications
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

CREATE TRIGGER trigger_push_jobs_updated_at
  BEFORE UPDATE ON push_scheduled_jobs
  FOR EACH ROW EXECUTE FUNCTION trigger_updated_at();

-- Confirmar criação
SELECT 'Push notifications tables created successfully!' as result;