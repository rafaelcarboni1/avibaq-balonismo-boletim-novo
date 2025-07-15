import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Cliente com service_role_key para ignorar RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, nome, email, role, username } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Criar perfil na tabela users usando service_role_key (ignora RLS)
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        nome: nome || email,
        email: email,
        role: role || 'piloto',
        username: username || email.split('@')[0],
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar perfil:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ user });

  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}