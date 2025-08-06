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
    const { userId, endpoint } = req.body;

    // Validar dados recebidos
    if (!userId) {
      return res.status(400).json({ error: 'User ID é obrigatório' });
    }

    // Se endpoint específico foi fornecido, desativar apenas ele
    // Caso contrário, desativar todas as subscriptions do usuário
    let query = supabaseService
      .from('push_subscriptions')
      .update({ 
        active: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (endpoint) {
      query = query.eq('endpoint', endpoint);
    }

    const { data: updatedSubscriptions, error: updateError } = await query
      .select('id, endpoint');

    if (updateError) {
      console.error('Erro ao desativar subscriptions:', updateError);
      return res.status(500).json({ error: 'Erro ao desativar notificações' });
    }

    const count = updatedSubscriptions?.length || 0;
    
    // Log da operação
    console.log(`[PUSH] ${count} subscription(s) desativada(s) para usuário ${userId}`);
    
    // Registrar logs de unsubscribe
    if (updatedSubscriptions && updatedSubscriptions.length > 0) {
      const logs = updatedSubscriptions.map(sub => ({
        notification_id: null,
        subscription_id: sub.id,
        user_id: userId,
        delivery_status: 'expired' as const,
        error_message: 'Usuário solicitou cancelamento das notificações',
        user_agent: req.headers['user-agent'],
        sent_at: new Date().toISOString()
      }));

      await supabaseService
        .from('push_delivery_logs')
        .insert(logs);
    }

    res.status(200).json({ 
      success: true, 
      count,
      message: endpoint 
        ? 'Notificação específica desativada com sucesso'
        : 'Todas as notificações desativadas com sucesso'
    });

  } catch (error) {
    console.error('Erro no endpoint /api/push/unsubscribe:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}