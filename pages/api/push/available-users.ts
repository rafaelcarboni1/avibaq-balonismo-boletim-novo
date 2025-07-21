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

    // Buscar usuários com subscriptions ativas
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('push_subscriptions')
      .select(`
        user_id,
        users!push_subscriptions_user_id_fkey (
          id,
          email,
          role
        ),
        membros!push_subscriptions_user_id_fkey (
          nome
        )
      `)
      .eq('active', true);

    if (subscriptionsError) {
      console.error('Erro ao buscar subscriptions:', subscriptionsError);
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }

    // Processar e deduplicar usuários
    const uniqueUsers = new Map();
    
    subscriptions?.forEach((sub: any) => {
      const user = sub.users;
      const membro = sub.membros;
      
      if (user && !uniqueUsers.has(user.id)) {
        uniqueUsers.set(user.id, {
          id: user.id,
          email: user.email,
          role: user.role,
          nome: membro?.nome || user.email.split('@')[0]
        });
      }
    });

    // Converter para array e ordenar
    const users = Array.from(uniqueUsers.values()).sort((a, b) => {
      if (a.nome && b.nome) {
        return a.nome.localeCompare(b.nome);
      }
      return a.email.localeCompare(b.email);
    });

    res.status(200).json(users);

  } catch (error) {
    console.error('Erro na API available-users:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}