import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Use service role client para operações do servidor
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { adminUserId } = req.body;

    if (!id || !adminUserId) {
      return res.status(400).json({ error: 'ID da notificação e Admin User ID são obrigatórios' });
    }

    // Verificar se o usuário é admin
    const { data: adminUser, error: adminError } = await supabaseService
      .from('users')
      .select('id, role')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser || adminUser.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado - apenas administradores' });
    }

    // Buscar a notificação
    const { data: notification, error: notificationError } = await supabaseService
      .from('push_notifications')
      .select('id, status, title, send_type')
      .eq('id', id as string)
      .single();

    if (notificationError || !notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    // Verificar se pode ser cancelada
    if (notification.status === 'sent') {
      return res.status(400).json({ error: 'Não é possível cancelar notificação já enviada' });
    }

    if (notification.status === 'cancelled') {
      return res.status(400).json({ error: 'Notificação já está cancelada' });
    }

    // Cancelar a notificação
    const { error: cancelError } = await supabaseService
      .from('push_notifications')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id as string);

    if (cancelError) {
      console.error('Erro ao cancelar notificação:', cancelError);
      return res.status(500).json({ error: 'Erro ao cancelar notificação' });
    }

    // Se havia job agendado, cancelar também
    if (notification.send_type === 'scheduled' || notification.send_type === 'recurring') {
      const { error: jobCancelError } = await supabaseService
        .from('push_scheduled_jobs')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('notification_id', id as string);

      if (jobCancelError) {
        console.warn('Erro ao cancelar job agendado:', jobCancelError);
      }
    }

    console.log(`[PUSH] Notificação ${id} cancelada pelo admin ${adminUserId}`);

    res.status(200).json({
      success: true,
      message: `Notificação "${notification.title}" cancelada com sucesso`
    });

  } catch (error) {
    console.error('Erro no endpoint /api/push/cancel:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}