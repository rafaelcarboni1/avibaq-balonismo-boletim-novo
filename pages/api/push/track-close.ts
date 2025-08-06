import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Use service role client para operações do servidor
const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { notificationId, timestamp, reason } = req.body;

    if (!notificationId) {
      return res.status(400).json({ error: 'Notification ID é obrigatório' });
    }

    // Registrar fechamento na tabela de logs (opcional - apenas para analytics)
    await supabaseService
      .from('push_delivery_logs')
      .insert({
        notification_id: notificationId,
        subscription_id: null, // Não temos essa informação aqui
        user_id: null, // Não temos essa informação aqui  
        delivery_status: 'expired',
        error_message: `Notificação fechada pelo usuário: ${reason || 'user_dismissed'}`,
        sent_at: new Date(timestamp || Date.now()).toISOString()
      });

    // Falhar silenciosamente - é apenas tracking
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro no endpoint /api/push/track-close:', error);
    res.status(200).json({ success: false }); // Falhar silenciosamente
  }
}