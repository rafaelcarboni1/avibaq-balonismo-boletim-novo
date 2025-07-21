import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente Supabase com service role para contornar RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Para APIs internas de admin, podemos usar service role
    // Em produção, adicionar verificação de token de admin

    const {
      title,
      message,
      internalLink,
      targetAudience,
      scheduledFor,
      recurring,
      recurringPattern
    } = req.body;

    // Validações
    if (!title || !message) {
      return res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
    }

    if (!scheduledFor) {
      return res.status(400).json({ error: 'Data de agendamento é obrigatória' });
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Data de agendamento deve ser no futuro' });
    }

    // Validar padrão de recorrência se especificado
    if (recurring && !recurringPattern) {
      return res.status(400).json({ error: 'Padrão de recorrência é obrigatório para notificações recorrentes' });
    }

    // Criar notificação template
    const { data: notification, error: notificationError } = await supabase
      .from('push_notifications')
      .insert({
        admin_user_id: req.body.adminUserId,
        title,
        message,
        internal_link: internalLink,
        target_audience: targetAudience,
        status: 'scheduled',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Erro ao criar notificação:', notificationError);
      return res.status(500).json({ error: 'Erro ao criar template de notificação' });
    }

    // Criar job agendado
    const jobData = {
      notification_id: notification.id,
      scheduled_for: scheduledFor,
      recurring: recurring || false,
      recurring_pattern: recurringPattern || null,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: job, error: jobError } = await supabase
      .from('push_scheduled_jobs')
      .insert(jobData)
      .select()
      .single();

    if (jobError) {
      console.error('Erro ao criar job:', jobError);
      
      // Limpar notificação criada em caso de erro
      await supabase
        .from('push_notifications')
        .delete()
        .eq('id', notification.id);
        
      return res.status(500).json({ error: 'Erro ao agendar notificação' });
    }

    // Calcular próximas execuções se for recorrente
    let nextExecutions = [];
    if (recurring && recurringPattern) {
      nextExecutions = calculateNextExecutions(scheduledDate, recurringPattern, 5);
      
      // Criar jobs para as próximas execuções
      const futureJobs = nextExecutions.map(date => ({
        notification_id: notification.id,
        scheduled_for: date.toISOString(),
        recurring: true,
        recurring_pattern: recurringPattern,
        status: 'pending',
        created_at: new Date().toISOString()
      }));

      if (futureJobs.length > 0) {
        await supabase
          .from('push_scheduled_jobs')
          .insert(futureJobs);
      }
    }

    res.status(200).json({
      success: true,
      notification: notification,
      job: job,
      nextExecutions: nextExecutions.map(d => d.toISOString()),
      message: `Notificação agendada para ${scheduledDate.toLocaleString('pt-BR')}${recurring ? ' (recorrente)' : ''}`
    });

  } catch (error) {
    console.error('Erro na API schedule:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Função para calcular próximas execuções baseado no padrão
function calculateNextExecutions(startDate: Date, pattern: string, count: number): Date[] {
  const executions: Date[] = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    switch (pattern) {
      case 'daily':
        currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'biweekly':
        currentDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes());
        break;
      case 'quarterly':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes());
        break;
      default:
        return executions;
    }
    executions.push(new Date(currentDate));
  }

  return executions;
}