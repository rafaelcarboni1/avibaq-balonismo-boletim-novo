import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Use service role client para operações do servidor
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminUserId } = req.query;

    if (!adminUserId) {
      return res.status(400).json({ error: 'Admin User ID é obrigatório' });
    }

    // Verificar se o usuário é admin
    const { data: adminUser, error: adminError } = await supabaseService
      .from('users')
      .select('id, role')
      .eq('id', adminUserId as string)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - apenas administradores' });
    }

    // Parâmetros de paginação e filtros
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;
    const sendType = req.query.sendType as string;

    // Query base para buscar histórico
    let query = supabaseService
      .from('vw_push_notifications_stats')
      .select('*', { count: 'exact' });

    // Aplicar filtros se fornecidos
    if (status) {
      query = query.eq('status', status);
    }
    if (sendType) {
      query = query.eq('send_type', sendType);
    }

    // Paginação e ordenação
    const { data: notifications, error: historyError, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (historyError) {
      console.error('Erro ao buscar histórico:', historyError);
      return res.status(500).json({ error: 'Erro ao buscar histórico' });
    }

    // Buscar estatísticas gerais
    const { data: totalStats } = await supabaseService
      .from('push_notifications')
      .select('status, send_type', { count: 'exact' });

    const stats = {
      total: count || 0,
      sent: totalStats?.filter(n => n.status === 'sent').length || 0,
      scheduled: totalStats?.filter(n => n.status === 'scheduled').length || 0,
      failed: totalStats?.filter(n => n.status === 'failed').length || 0,
      immediate: totalStats?.filter(n => n.send_type === 'immediate').length || 0,
      recurring: totalStats?.filter(n => n.send_type === 'recurring').length || 0
    };

    res.status(200).json({
      success: true,
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Erro no endpoint /api/push/history:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}