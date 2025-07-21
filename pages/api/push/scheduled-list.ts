import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente Supabase com service role para contornar RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Para APIs internas de admin, podemos usar service role
    // Em produção, adicionar verificação de token de admin

    const { page = 1, limit = 20, status, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Construir query
    let query = supabase
      .from('push_scheduled_jobs')
      .select(`
        *,
        push_notifications (
          id,
          title,
          message,
          target_audience,
          admin_user_id,
          users!push_notifications_admin_user_id_fkey (
            email
          )
        )
      `)
      .order('scheduled_for', { ascending: false });

    // Filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Buscar dados
    const { data: jobs, error: jobsError } = await query
      .range(offset, offset + limitNum - 1);

    if (jobsError) {
      console.error('Erro ao buscar jobs agendados:', jobsError);
      return res.status(500).json({ error: 'Erro ao buscar jobs agendados' });
    }

    // Buscar total para paginação
    let countQuery = supabase
      .from('push_scheduled_jobs')
      .select('id', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Erro ao contar jobs:', countError);
      return res.status(500).json({ error: 'Erro ao contar jobs' });
    }

    // Processar dados para resposta
    const processedJobs = jobs?.map(job => ({
      id: job.id,
      scheduledFor: job.scheduled_for,
      status: job.status,
      recurring: job.recurring,
      recurringPattern: job.recurring_pattern,
      executedAt: job.executed_at,
      sentCount: job.sent_count,
      failedCount: job.failed_count,
      errorMessage: job.error_message,
      notification: {
        id: job.push_notifications?.id,
        title: job.push_notifications?.title,
        message: job.push_notifications?.message,
        targetAudience: job.push_notifications?.target_audience,
        adminEmail: job.push_notifications?.users?.email
      },
      createdAt: job.created_at
    })) || [];

    // Filtrar por busca se especificado
    let filteredJobs = processedJobs;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredJobs = processedJobs.filter(job =>
        job.notification.title?.toLowerCase().includes(searchLower) ||
        job.notification.message?.toLowerCase().includes(searchLower) ||
        job.notification.adminEmail?.toLowerCase().includes(searchLower)
      );
    }

    const totalPages = Math.ceil((count || 0) / limitNum);

    res.status(200).json({
      jobs: filteredJobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Erro na API scheduled-list:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}