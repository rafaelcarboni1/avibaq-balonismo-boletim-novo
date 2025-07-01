import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Buscar assinantes ativos
  const { data: assinantes, error } = await supabase
    .from('assinantes')
    .select('id, nome, email, token_descadastro')
    .eq('ativo', true);

  if (error) {
    return res.status(500).json({ error: 'Erro ao buscar assinantes' });
  }

  // Conteúdo do boletim (exemplo fixo, personalize depois)
  const titulo = 'Boletim Meteorológico - AVIBAQ';
  const conteudo = '<p>Condições meteorológicas para hoje: ...</p>';

  // Enviar e-mail para cada assinante
  for (const assinante of assinantes) {
    const html = `
      <h2>${titulo}</h2>
      <p>Olá, ${assinante.nome}!</p>
      ${conteudo}
      <hr>
      <p style="font-size:12px;color:#888;">
        Caso não queira mais receber nossos e-mails, 
        <a href="https://avibaq-balonismo-boletim-novo.vercel.app/descadastrar?token=${assinante.token_descadastro}">
          clique aqui para se descadastrar
        </a>.
      </p>
    `;

    try {
      await resend.emails.send({
        from: 'AVIBAQ <no-reply@avibaq-balonismo-boletim-novo.vercel.app>',
        to: assinante.email,
        subject: titulo,
        html,
      });
    } catch (err) {
      console.error(`Erro ao enviar para ${assinante.email}:`, err);
    }
  }

  return res.status(200).json({ success: true });
} 