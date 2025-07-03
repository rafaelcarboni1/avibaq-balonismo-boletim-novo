import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { to, nome } = req.body;
  if (!to) {
    return res.status(400).json({ error: 'Missing recipient' });
  }
  try {
    await resend.emails.send({
      from: 'AVIBAQ <no-reply@avibaq.org>',
      to,
      subject: 'Cadastro aprovado na AVIBAQ',
      html: `<p>Olá${nome ? `, <b>${nome}</b>` : ''}!</p>
        <p>Seu cadastro foi aprovado na AVIBAQ. Seja bem-vindo(a) à associação!</p>
        <p>Lembre-se de manter sua mensalidade em dia para continuar aproveitando todos os benefícios.</p>
        <p>Qualquer dúvida, estamos à disposição.<br/>Equipe AVIBAQ</p>`
    });
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Erro ao enviar e-mail via Resend:', error);
    return res.status(500).json({ error: 'Erro ao enviar e-mail' });
  }
} 