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

    console.log('[SCHEDULE DEBUG] === INÍCIO DO DEBUG ===');
    console.log('[SCHEDULE DEBUG] Dados recebidos:', {
      title,
      message,
      internalLink,
      targetAudience,
      scheduledFor,
      recurring,
      recurringPattern,
      adminUserId: req.body.adminUserId
    });
    
    // VALIDAR adminUserId ANTES DE USAR
    const adminUserId = req.body.adminUserId;
    console.log('[SCHEDULE DEBUG] adminUserId raw:', adminUserId);
    console.log('[SCHEDULE DEBUG] adminUserId type:', typeof adminUserId);
    console.log('[SCHEDULE DEBUG] adminUserId length:', adminUserId?.length);
    
    if (!adminUserId || adminUserId.length < 10) {
      return res.status(400).json({ 
        error: 'adminUserId inválido ou ausente',
        debug: { adminUserId, type: typeof adminUserId }
      });
    }
    
    // Verificar se o usuário existe no banco
    console.log('[SCHEDULE DEBUG] Verificando se usuário existe...');
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id, nome, email, role')
      .eq('id', adminUserId)
      .single();
      
    if (userError || !userExists) {
      console.log('[SCHEDULE DEBUG] Usuário não encontrado:', { userError, adminUserId });
      return res.status(400).json({ 
        error: 'Usuário não encontrado no banco de dados',
        debug: { 
          adminUserId, 
          userError: userError?.message,
          code: userError?.code
        }
      });
    }
    
    console.log('[SCHEDULE DEBUG] Usuário encontrado:', userExists);

    // Validações
    if (!title || !message) {
      return res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
    }

    if (!scheduledFor) {
      return res.status(400).json({ error: 'Data de agendamento é obrigatória' });
    }

    // Tratar datetime-local: converter para horário brasileiro (UTC-3)
    let scheduledDate;
    if (scheduledFor.includes('T') && !scheduledFor.endsWith('Z')) {
      // datetime-local: assumir que é horário brasileiro e converter para UTC
      const localDateTime = new Date(scheduledFor);
      // Adicionar 3 horas para converter de Brasília (UTC-3) para UTC
      scheduledDate = new Date(localDateTime.getTime() + 3 * 60 * 60 * 1000);
    } else {
      scheduledDate = new Date(scheduledFor);
    }
    
    const now = new Date();
    
    // Debug: vamos ver as datas que estão chegando
    console.log('[SCHEDULE DEBUG] Data recebida raw:', scheduledFor);
    console.log('[SCHEDULE DEBUG] Data parseada:', scheduledDate.toISOString());
    console.log('[SCHEDULE DEBUG] Data atual:', now.toISOString());
    console.log('[SCHEDULE DEBUG] Diferença em minutos:', (scheduledDate.getTime() - now.getTime()) / (60 * 1000));
    console.log('[SCHEDULE DEBUG] Timezone offset servidor:', new Date().getTimezoneOffset());
    
    // Validar se é uma data válida
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: 'Data inválida fornecida' });
    }
    
    // Adicionar apenas 1 minuto de tolerância - SIMPLIFICANDO
    const minAllowedTime = new Date(now.getTime() + 1 * 60 * 1000);
    
    if (scheduledDate <= minAllowedTime) {
      const nowFormatted = now.toLocaleString('pt-BR');
      const scheduledFormatted = scheduledDate.toLocaleString('pt-BR');
      
      return res.status(400).json({ 
        error: `Data deve ser pelo menos 1 minuto no futuro.`,
        debug: {
          agora: nowFormatted,
          agendadoPara: scheduledFormatted,
          diferencaMinutos: Math.round((scheduledDate.getTime() - now.getTime()) / (60 * 1000))
        }
      });
    }

    // Validar padrão de recorrência se especificado
    if (recurring && !recurringPattern) {
      return res.status(400).json({ error: 'Padrão de recorrência é obrigatório para notificações recorrentes' });
    }

    // Criar notificação template - versão simplificada com apenas campos básicos
    const insertData = {
      created_by: userExists.id, // Usar o ID validado do banco
      title,
      message,
      target_audience: targetAudience || { type: 'all' }
    };
    
    // Adicionar campos opcionais apenas se existirem na tabela
    if (internalLink) {
      insertData.internal_link = internalLink;
    }
    
    console.log('[SCHEDULE DEBUG] Dados para inserir na notificação (modo seguro):', insertData);
    
    // Tentar inserção modo seguro - apenas campos garantidos
    const { data: notification, error: notificationError } = await supabase
      .from('push_notifications')
      .insert(insertData)
      .select('id, created_by, title, message, created_at')
      .single();

    if (notificationError) {
      console.error('[SCHEDULE DEBUG] Erro COMPLETO ao criar notificação:', {
        error: notificationError,
        code: notificationError?.code,
        message: notificationError?.message,
        details: notificationError?.details,
        hint: notificationError?.hint,
        insertData
      });
      return res.status(500).json({ 
        error: 'Erro ao criar template de notificação',
        debug: {
          errorCode: notificationError?.code,
          errorMessage: notificationError?.message,
          errorDetails: notificationError?.details
        }
      });
    }
    
    console.log('[SCHEDULE DEBUG] Notificação criada com sucesso:', notification);

    console.log('[SCHEDULE DEBUG] Notificação criada, tentando criar job agendado...');
    
    // Verificar se tabela push_scheduled_jobs existe
    let job = null;
    let jobError = null;
    
    try {
      const jobData = {
        notification_id: notification.id,
        job_type: recurring ? 'recurring' : 'once',
        next_run_at: scheduledDate.toISOString(),
        status: 'pending'
      };
      
      // Adicionar recurring_rule apenas se for recorrente
      if (recurring && recurringPattern) {
        jobData.recurring_rule = recurringPattern;
      }
      
      console.log('[SCHEDULE DEBUG] Dados para inserir no job:', jobData);

      const { data, error } = await supabase
        .from('push_scheduled_jobs')
        .insert(jobData)
        .select()
        .single();
        
      job = data;
      jobError = error;
    } catch (jobInsertError) {
      console.log('[SCHEDULE DEBUG] Erro ao inserir job (tabela pode não existir):', jobInsertError);
      jobError = jobInsertError;
    }

    if (jobError) {
      console.error('[SCHEDULE DEBUG] Erro COMPLETO ao criar job:', {
        error: jobError,
        code: jobError?.code,
        message: jobError?.message,
        details: jobError?.details,
        hint: jobError?.hint,
        jobData
      });
      
      // Limpar notificação criada em caso de erro
      await supabase
        .from('push_notifications')
        .delete()
        .eq('id', notification.id);
        
      return res.status(500).json({ 
        error: 'Erro ao agendar notificação',
        debug: {
          errorCode: jobError?.code,
          errorMessage: jobError?.message,
          errorDetails: jobError?.details
        }
      });
    }
    
    console.log('[SCHEDULE DEBUG] Job criado com sucesso:', job);

    // Calcular próximas execuções se for recorrente
    let nextExecutions = [];
    if (recurring && recurringPattern) {
      nextExecutions = calculateNextExecutions(scheduledDate, recurringPattern, 5);
      
      // Criar jobs para as próximas execuções
      const futureJobs = nextExecutions.map(date => ({
        notification_id: notification.id,
        job_type: 'recurring',
        next_run_at: date.toISOString(),
        recurring_rule: recurringPattern,
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
    console.error('[SCHEDULE DEBUG] Erro GERAL na API schedule:', {
      error,
      message: error?.message,
      stack: error?.stack,
      body: req.body
    });
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      debug: {
        message: error?.message,
        type: typeof error
      }
    });
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