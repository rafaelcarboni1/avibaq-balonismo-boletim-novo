import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente Supabase com service role para contornar RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar se tem authorization header ou é uma chamada interna
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET || 'internal-cron-secret'}`) {
    return res.status(401).json({ error: 'Não autorizado - apenas chamadas internas' });
  }

  try {
    console.log('[ProcessScheduled] Iniciando processamento de jobs agendados...');

    // Configurar VAPID
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys não configuradas');
    }

    webpush.setVapidDetails(
      'mailto:contato@avibaq.com.br',
      vapidPublicKey,
      vapidPrivateKey
    );

    // Buscar jobs pendentes que devem ser executados agora
    const now = new Date();
    const { data: pendingJobs, error: jobsError } = await supabase
      .from('push_scheduled_jobs')
      .select(`
        *,
        push_notifications (*)
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true });

    if (jobsError) {
      console.error('Erro ao buscar jobs:', jobsError);
      return res.status(500).json({ error: 'Erro ao buscar jobs agendados' });
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('[ProcessScheduled] Nenhum job pendente encontrado');
      return res.status(200).json({ 
        success: true, 
        processed: 0, 
        message: 'Nenhum job pendente' 
      });
    }

    console.log(`[ProcessScheduled] Processando ${pendingJobs.length} jobs...`);

    let processedCount = 0;
    let successCount = 0;

    for (const job of pendingJobs) {
      try {
        console.log(`[ProcessScheduled] Processando job ${job.id}...`);

        // Marcar job como processando
        await supabase
          .from('push_scheduled_jobs')
          .update({ 
            status: 'processing',
            executed_at: new Date().toISOString()
          })
          .eq('id', job.id);

        const notification = job.push_notifications;
        if (!notification) {
          throw new Error('Notificação não encontrada');
        }

        // Buscar subscriptions baseado no target_audience
        let subscriptionsQuery = supabase
          .from('push_subscriptions')
          .select('*, users!push_subscriptions_user_id_fkey(role, email)')
          .eq('active', true);

        const targetAudience = notification.target_audience;

        if (targetAudience.type === 'roles' && targetAudience.roles) {
          subscriptionsQuery = subscriptionsQuery.in('users.role', targetAudience.roles);
        } else if (targetAudience.type === 'users' && targetAudience.emails) {
          subscriptionsQuery = subscriptionsQuery.in('users.email', targetAudience.emails);
        }

        const { data: subscriptions, error: subsError } = await subscriptionsQuery;

        if (subsError) {
          throw new Error(`Erro ao buscar subscriptions: ${subsError.message}`);
        }

        if (!subscriptions || subscriptions.length === 0) {
          console.log(`[ProcessScheduled] Job ${job.id}: Nenhuma subscription encontrada`);
          await supabase
            .from('push_scheduled_jobs')
            .update({ status: 'completed' })
            .eq('id', job.id);
          continue;
        }

        // Enviar notificações em lotes
        const batchSize = 10;
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < subscriptions.length; i += batchSize) {
          const batch = subscriptions.slice(i, i + batchSize);
          
          const sendPromises = batch.map(async (subscription) => {
            try {
              const payload = JSON.stringify({
                title: notification.title,
                body: notification.message,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/badge-72x72.png',
                data: {
                  url: notification.internal_link || '/dashboard',
                  notificationId: notification.id,
                  timestamp: new Date().toISOString()
                }
              });

              await webpush.sendNotification(
                {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: subscription.p256dh_key,
                    auth: subscription.auth_key
                  }
                },
                payload
              );

              // Log de entrega bem-sucedida
              await supabase
                .from('push_delivery_logs')
                .insert({
                  notification_id: notification.id,
                  subscription_id: subscription.id,
                  user_id: subscription.user_id,
                  status: 'delivered',
                  delivered_at: new Date().toISOString()
                });

              return { success: true, subscriptionId: subscription.id };

            } catch (error: any) {
              console.error(`Erro ao enviar para subscription ${subscription.id}:`, error);

              // Log de falha na entrega
              await supabase
                .from('push_delivery_logs')
                .insert({
                  notification_id: notification.id,
                  subscription_id: subscription.id,
                  user_id: subscription.user_id,
                  status: 'failed',
                  error_message: error.message,
                  delivered_at: new Date().toISOString()
                });

              // Se subscription expirou, marcar como inativa
              if (error.statusCode === 410 || error.statusCode === 404) {
                await supabase
                  .from('push_subscriptions')
                  .update({ active: false })
                  .eq('id', subscription.id);
              }

              return { success: false, subscriptionId: subscription.id, error: error.message };
            }
          });

          const results = await Promise.allSettled(sendPromises);
          
          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
              sentCount++;
            } else {
              failedCount++;
            }
          });

          // Pequena pausa entre lotes
          if (i + batchSize < subscriptions.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Atualizar estatísticas da notificação
        await supabase
          .from('push_notifications')
          .update({
            sent_count: sentCount,
            targeted_count: subscriptions.length,
            status: 'sent'
          })
          .eq('id', notification.id);

        // Marcar job como concluído
        await supabase
          .from('push_scheduled_jobs')
          .update({ 
            status: 'completed',
            sent_count: sentCount,
            failed_count: failedCount
          })
          .eq('id', job.id);

        console.log(`[ProcessScheduled] Job ${job.id} concluído: ${sentCount} enviadas, ${failedCount} falharam`);
        
        processedCount++;
        successCount++;

        // Se for recorrente, criar próximo job
        if (job.recurring && job.recurring_pattern) {
          const nextDate = calculateNextExecution(new Date(job.scheduled_for), job.recurring_pattern);
          if (nextDate) {
            await supabase
              .from('push_scheduled_jobs')
              .insert({
                notification_id: notification.id,
                scheduled_for: nextDate.toISOString(),
                recurring: true,
                recurring_pattern: job.recurring_pattern,
                status: 'pending',
                created_at: new Date().toISOString()
              });
            console.log(`[ProcessScheduled] Próximo job recorrente criado para ${nextDate.toISOString()}`);
          }
        }

      } catch (error: any) {
        console.error(`[ProcessScheduled] Erro ao processar job ${job.id}:`, error);

        // Marcar job como falhado
        await supabase
          .from('push_scheduled_jobs')
          .update({ 
            status: 'failed',
            error_message: error.message
          })
          .eq('id', job.id);

        processedCount++;
      }
    }

    console.log(`[ProcessScheduled] Processamento concluído: ${processedCount} jobs processados, ${successCount} sucessos`);

    res.status(200).json({
      success: true,
      processed: processedCount,
      successful: successCount,
      failed: processedCount - successCount,
      message: `Processados ${processedCount} jobs agendados`
    });

  } catch (error) {
    console.error('[ProcessScheduled] Erro geral:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função para calcular próxima execução
function calculateNextExecution(lastDate: Date, pattern: string): Date | null {
  const nextDate = new Date(lastDate);

  switch (pattern) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    default:
      return null;
  }

  return nextDate;
}