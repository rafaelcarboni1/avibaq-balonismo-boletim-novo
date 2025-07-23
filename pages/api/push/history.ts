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

    const { 
      page = 1, 
      limit = 20, 
      status, 
      search,
      dateFrom,
      dateTo,
      type = 'all' // 'immediate', 'scheduled', 'all'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Construir query principal
    let query = supabase
      .from('push_notifications')
      .select(`
        *,
        users!push_notifications_created_by_fkey (
          email,
          nome
        )
      `)
      .order('created_at', { ascending: false });

    // Filtros
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else {
      // Por padrão, mostrar todas as notificações (incluindo draft que são notificações enviadas)
      // Em produção, vamos filtrar apenas sent, scheduled e draft
      query = query.in('status', ['sent', 'scheduled', 'draft']);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // Buscar notificações
    const { data: notifications, error: notificationsError } = await query
      .range(offset, offset + limitNum - 1);

    if (notificationsError) {
      console.error('Erro ao buscar histórico:', notificationsError);
      return res.status(500).json({ error: 'Erro ao buscar histórico' });
    }

    // Buscar total para paginação
    let countQuery = supabase
      .from('push_notifications')
      .select('id', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    } else {
      countQuery = countQuery.in('status', ['sent', 'scheduled', 'draft']);
    }

    if (dateFrom) {
      countQuery = countQuery.gte('created_at', dateFrom);
    }

    if (dateTo) {
      countQuery = countQuery.lte('created_at', dateTo);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Erro ao contar notificações:', countError);
      return res.status(500).json({ error: 'Erro ao contar notificações' });
    }

    // Para cada notificação, buscar estatísticas de entrega
    const notificationsWithStats = await Promise.all(
      (notifications || []).map(async (notification) => {
        // Buscar estatísticas de entrega
        const { data: deliveryStats, error: statsError } = await supabase
          .from('push_delivery_logs')
          .select('status')
          .eq('notification_id', notification.id);

        if (statsError) {
          console.error(`Erro ao buscar stats para notificação ${notification.id}:`, statsError);
        }

        const stats = deliveryStats || [];
        const delivered = stats.filter(s => s.status === 'delivered').length;
        const failed = stats.filter(s => s.status === 'failed').length;
        const clicked = stats.filter(s => s.status === 'clicked').length;

        // Buscar jobs relacionados se for agendada
        let scheduledJobs = [];
        if (notification.status === 'scheduled') {
          const { data: jobs, error: jobsError } = await supabase
            .from('push_scheduled_jobs')
            .select('*')
            .eq('notification_id', notification.id)
            .order('scheduled_for', { ascending: true });

          if (!jobsError) {
            scheduledJobs = jobs || [];
          }
        }

        return {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          internalLink: notification.internal_link,
          targetAudience: notification.target_audience,
          status: notification.status,
          createdAt: notification.created_at,
          adminEmail: notification.users?.email,
          adminName: notification.users?.nome,
          stats: {
            targeted: notification.targeted_count || 0,
            delivered,
            failed,
            clicked,
            deliveryRate: notification.targeted_count > 0 
              ? Math.round((delivered / notification.targeted_count) * 100)
              : 0,
            clickRate: delivered > 0
              ? Math.round((clicked / delivered) * 100)
              : 0
          },
          scheduledJobs: scheduledJobs
        };
      })
    );

    // Filtrar por busca se especificado
    let filteredNotifications = notificationsWithStats;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredNotifications = notificationsWithStats.filter(notification =>
        notification.title?.toLowerCase().includes(searchLower) ||
        notification.message?.toLowerCase().includes(searchLower) ||
        notification.adminEmail?.toLowerCase().includes(searchLower) ||
        notification.adminName?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por tipo se especificado
    if (type && type !== 'all') {
      if (type === 'immediate') {
        filteredNotifications = filteredNotifications.filter(n => 
          !n.scheduledJobs || n.scheduledJobs.length === 0
        );
      } else if (type === 'scheduled') {
        filteredNotifications = filteredNotifications.filter(n => 
          n.scheduledJobs && n.scheduledJobs.length > 0
        );
      }
    }

    const totalPages = Math.ceil((count || 0) / limitNum);

    // Buscar estatísticas gerais
    const { data: totalStats, error: totalStatsError } = await supabase
      .from('push_notifications')
      .select('targeted_count, sent_count')
      .eq('status', 'sent');

    const overallStats = {
      totalNotifications: count || 0,
      totalSent: totalStats?.reduce((sum, n) => sum + (n.sent_count || 0), 0) || 0,
      totalTargeted: totalStats?.reduce((sum, n) => sum + (n.targeted_count || 0), 0) || 0
    };

    res.status(200).json({
      notifications: filteredNotifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      },
      stats: overallStats
    });

  } catch (error) {
    console.error('Erro na API history:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}