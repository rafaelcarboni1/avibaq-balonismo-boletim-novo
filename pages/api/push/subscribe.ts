import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Use service role client para operações do servidor
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configurar VAPID keys para web-push (adicionar ao .env.local)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:contato@avibaq.org',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscription, userId } = req.body;

    // Validar dados recebidos
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ error: 'Subscription inválida' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID é obrigatório' });
    }

    // Verificar se o usuário existe
    const { data: user, error: userError } = await supabaseService
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Extrair dados da subscription
    const { endpoint, keys } = subscription;
    const { p256dh, auth } = keys;

    // Detectar plataforma baseado no endpoint
    let platform = 'unknown';
    if (endpoint.includes('fcm.googleapis.com')) {
      platform = 'android';
    } else if (endpoint.includes('web.push.apple.com')) {
      platform = 'ios';
    } else if (endpoint.includes('updates.push.services.mozilla.com')) {
      platform = 'firefox';
    } else if (endpoint.includes('notify.windows.com')) {
      platform = 'windows';
    } else {
      platform = 'desktop';
    }

    // Obter IP do cliente (considerando possíveis proxies)
    const clientIP = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress;

    // User-Agent do cliente
    const userAgent = req.headers['user-agent'];

    // Verificar se já existe uma subscription para este usuário e endpoint
    const { data: existingSubscription } = await supabaseService
      .from('push_subscriptions')
      .select('id, active')
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .single();

    let subscriptionId;

    if (existingSubscription) {
      // Atualizar subscription existente
      const { data: updatedSubscription, error: updateError } = await supabaseService
        .from('push_subscriptions')
        .update({
          p256dh_key: p256dh,
          auth_key: auth,
          user_agent: userAgent,
          ip_address: clientIP,
          platform,
          active: true,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Erro ao atualizar subscription:', updateError);
        return res.status(500).json({ error: 'Erro ao atualizar subscription' });
      }

      subscriptionId = updatedSubscription.id;
      console.log(`[PUSH] Subscription atualizada para usuário ${userId}:`, subscriptionId);
    } else {
      // Criar nova subscription
      const { data: newSubscription, error: insertError } = await supabaseService
        .from('push_subscriptions')
        .insert({
          user_id: userId,
          endpoint,
          p256dh_key: p256dh,
          auth_key: auth,
          user_agent: userAgent,
          ip_address: clientIP,
          platform,
          active: true,
          last_used_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Erro ao criar subscription:', insertError);
        return res.status(500).json({ error: 'Erro ao criar subscription' });
      }

      subscriptionId = newSubscription.id;
      console.log(`[PUSH] Nova subscription criada para usuário ${userId}:`, subscriptionId);
    }

    // Testar a subscription enviando uma notificação de boas-vindas
    try {
      const welcomePayload = JSON.stringify({
        title: 'AVIBAQ - Notificações Ativadas! ✈️',
        body: 'Você receberá alertas importantes sobre voos, meteorologia e comunicados.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: {
          url: `/${user.role === 'admin' ? 'admin' : user.role}/dashboard`,
          timestamp: Date.now()
        }
      });

      await webpush.sendNotification(subscription, welcomePayload);
      
      // Registrar log de envio da notificação de teste
      await supabaseService
        .from('push_delivery_logs')
        .insert({
          notification_id: null, // Notificação de teste/sistema
          subscription_id: subscriptionId,
          user_id: userId,
          delivery_status: 'sent',
          http_status: 200,
          user_agent: userAgent,
          sent_at: new Date().toISOString()
        });

      console.log(`[PUSH] Notificação de boas-vindas enviada para ${userId}`);
    } catch (testError) {
      console.warn(`[PUSH] Falha no teste de notificação para ${userId}:`, testError);
      
      // Registrar falha mas não bloquear o processo
      await supabaseService
        .from('push_delivery_logs')
        .insert({
          notification_id: null,
          subscription_id: subscriptionId,
          user_id: userId,
          delivery_status: 'failed',
          error_message: testError.message || 'Erro no teste de notificação',
          user_agent: userAgent,
          sent_at: new Date().toISOString()
        });
    }

    res.status(200).json({ 
      success: true, 
      subscriptionId,
      message: 'Notificações push ativadas com sucesso!' 
    });

  } catch (error) {
    console.error('Erro no endpoint /api/push/subscribe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}