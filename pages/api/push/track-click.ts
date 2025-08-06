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
    const { notificationId, timestamp } = req.body;

    if (!notificationId) {
      return res.status(400).json({ error: 'Notification ID é obrigatório' });
    }

    // Atualizar log de delivery para registrar o clique
    const { error: updateError } = await supabaseService
      .from('push_delivery_logs')
      .update({
        delivery_status: 'clicked',
        clicked_at: new Date(timestamp || Date.now()).toISOString()
      })
      .eq('notification_id', notificationId)
      .eq('delivery_status', 'sent'); // Apenas logs que foram enviados com sucesso

    if (updateError) {
      console.error('Erro ao registrar clique:', updateError);
    }

    // Não retornar erro mesmo se o update falhar - é apenas tracking
    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Erro no endpoint /api/push/track-click:', error);
    res.status(200).json({ success: false }); // Falhar silenciosamente
  }
}