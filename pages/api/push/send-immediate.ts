import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Use service role client para operações do servidor
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configurar VAPID keys para web-push
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
    // Verificar se o usuário é admin (middleware básico)
    const { adminUserId, title, message, internalLink, targetAudience } = req.body;

    // Validações básicas
    if (!adminUserId || !title || !message) {
      return res.status(400).json({ error: 'Dados obrigatórios: adminUserId, title, message' });
    }

    if (title.length > 50) {
      return res.status(400).json({ error: 'Título deve ter no máximo 50 caracteres' });
    }

    if (message.length > 120) {
      return res.status(400).json({ error: 'Mensagem deve ter no máximo 120 caracteres' });
    }

    // Verificar se o usuário é admin (admin, meteo ou tesouraria)
    const { data: adminUser, error: adminError } = await supabaseService
      .from('users')
      .select('id, role, nome')
      .eq('id', adminUserId)
      .single();

    const adminRoles = ['admin', 'meteo', 'tesouraria'];
    if (adminError || !adminUser || !adminRoles.includes(adminUser.role)) {
      console.error('[PUSH] Erro de autenticação:', { adminError, adminUser: adminUser?.role });
      return res.status(403).json({ 
        error: 'Acesso negado - apenas administradores',
        details: `Role atual: ${adminUser?.role || 'não encontrado'}`,
        userId: adminUserId
      });
    }

    console.log(`[PUSH] Admin autenticado: ${adminUser.nome} (${adminUser.role})`);

    // Criar registro da notificação
    const { data: notification, error: notificationError } = await supabaseService
      .from('push_notifications')
      .insert({
        admin_user_id: adminUserId,
        title,
        message,
        internal_link: internalLink || null,
        target_audience: targetAudience || { type: 'all' },
        send_type: 'immediate',
        status: 'sending'
      })
      .select('id')
      .single();

    if (notificationError || !notification) {
      console.error('Erro ao criar notificação:', notificationError);
      return res.status(500).json({ error: 'Erro ao criar notificação' });
    }

    const notificationId = notification.id;
    console.log(`[PUSH] Iniciando envio da notificação ${notificationId}...`);

    // Determinar público-alvo e buscar subscriptions
    let subscriptionsQuery = supabaseService
      .from('push_subscriptions')
      .select(`
        id,
        user_id,
        endpoint,
        p256dh_key,
        auth_key,
        users!inner (
          id,
          role,
          email
        )
      `)
      .eq('active', true);

    // Filtrar por público-alvo
    const audience = targetAudience || { type: 'all' };
    
    if (audience.type === 'roles' && audience.roles && audience.roles.length > 0) {
      subscriptionsQuery = subscriptionsQuery.in('users.role', audience.roles);
    } else if (audience.type === 'users' && audience.user_ids && audience.user_ids.length > 0) {
      subscriptionsQuery = subscriptionsQuery.in('user_id', audience.user_ids);
    }

    const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;

    if (subscriptionsError) {
      console.error('Erro ao buscar subscriptions:', subscriptionsError);
      await supabaseService
        .from('push_notifications')
        .update({ status: 'failed' })
        .eq('id', notificationId);
      return res.status(500).json({ error: 'Erro ao buscar destinatários' });
    }

    if (!subscriptions || subscriptions.length === 0) {
      await supabaseService
        .from('push_notifications')
        .update({ 
          status: 'sent',
          total_targeted: 0,
          sent_at: new Date().toISOString()
        })
        .eq('id', notificationId);
        
      return res.status(200).json({ 
        success: true, 
        notificationId,
        targeted: 0,
        message: 'Nenhum destinatário encontrado para o público-alvo especificado' 
      });
    }

    // Atualizar contador de destinatários
    await supabaseService
      .from('push_notifications')
      .update({ total_targeted: subscriptions.length })
      .eq('id', notificationId);

    console.log(`[PUSH] Enviando para ${subscriptions.length} destinatários...`);

    // Preparar payload da notificação
    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        url: internalLink || '/dashboard',
        notificationId,
        timestamp: Date.now()
      },
      requireInteraction: true, // Manter notificação visível até interação
      tag: `avibaq-${notificationId}` // Agrupar notificações similares
    });

    // Enviar notificações em lotes (evitar sobrecarga)
    const batchSize = 10;
    const deliveryLogs: any[] = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key
            }
          };

          const result = await webpush.sendNotification(pushSubscription, payload);
          
          sent++;
          deliveryLogs.push({
            notification_id: notificationId,
            subscription_id: sub.id,
            user_id: sub.user_id,
            delivery_status: 'sent',
            http_status: 200,
            sent_at: new Date().toISOString()
          });

          console.log(`[PUSH] ✓ Enviado para usuário ${sub.user_id}`);
          return { success: true, userId: sub.user_id };
        } catch (error: any) {
          failed++;
          console.error(`[PUSH] ✗ Falha para usuário ${sub.user_id}:`, error.message);

          // Determinar se é erro permanente (subscription expirada)
          const isExpired = error.statusCode === 410 || 
                           error.message?.includes('expired') ||
                           error.message?.includes('invalid');

          if (isExpired) {
            // Marcar subscription como inativa
            await supabaseService
              .from('push_subscriptions')
              .update({ active: false })
              .eq('id', sub.id);
          }

          deliveryLogs.push({
            notification_id: notificationId,
            subscription_id: sub.id,
            user_id: sub.user_id,
            delivery_status: isExpired ? 'expired' : 'failed',
            http_status: error.statusCode || null,
            error_message: error.message || 'Erro desconhecido',
            sent_at: new Date().toISOString()
          });

          return { success: false, userId: sub.user_id, error: error.message };
        }
      });

      // Esperar o lote completar antes do próximo
      await Promise.all(batchPromises);
      
      // Pequena pausa entre lotes para evitar rate limiting
      if (i + batchSize < subscriptions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Salvar logs de entrega
    if (deliveryLogs.length > 0) {
      await supabaseService
        .from('push_delivery_logs')
        .insert(deliveryLogs);
    }

    // Atualizar status final da notificação
    await supabaseService
      .from('push_notifications')
      .update({
        status: 'sent',
        total_sent: sent,
        total_failed: failed,
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    const successRate = subscriptions.length > 0 ? Math.round((sent / subscriptions.length) * 100) : 0;

    console.log(`[PUSH] Envio concluído - ${sent} enviadas, ${failed} falharam (${successRate}% sucesso)`);

    res.status(200).json({
      success: true,
      notificationId,
      targeted: subscriptions.length,
      sent,
      failed,
      successRate: `${successRate}%`,
      message: `Notificação enviada para ${sent} de ${subscriptions.length} destinatários`
    });

  } catch (error) {
    console.error('Erro no endpoint /api/push/send-immediate:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}