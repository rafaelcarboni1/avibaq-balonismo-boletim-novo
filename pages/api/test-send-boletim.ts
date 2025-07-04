import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY!);

function getBrasiliaDate(offsetDays = 0) {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasilia = new Date(utc - (3 * 60 * 60 * 1000));
  brasilia.setDate(brasilia.getDate() + offsetDays);
  return brasilia.toISOString().slice(0, 10);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, nome } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-mail de destino não informado.' });
  }

  // Buscar o boletim do dia seguinte
  const dataAmanha = getBrasiliaDate(1);
  const { data: boletins, error: errorBoletim } = await supabase
    .from('boletins')
    .select('*')
    .eq('data', dataAmanha)
    .order('periodo', { ascending: true });

  if (errorBoletim) {
    return res.status(500).json({ error: 'Erro ao buscar boletim do dia seguinte' });
  }

  if (!boletins || boletins.length === 0) {
    return res.status(404).json({ error: 'Nenhum boletim cadastrado para o dia seguinte.' });
  }

  // Montar o conteúdo do e-mail com todos os boletins do dia seguinte
  let conteudo = '';
  for (const boletim of boletins) {
    conteudo += `
      <h3>Boletim do dia ${boletim.data.split('-').reverse().join('/')} - Período: ${boletim.periodo === 'manha' ? 'Manhã' : 'Tarde'}</h3>
      <p><strong>Bandeira:</strong> ${boletim.bandeira.toUpperCase()}</p>
      <p><strong>Status:</strong> ${boletim.titulo_curto}</p>
      <p><strong>Motivo:</strong> ${boletim.motivo}</p>
    `;
    if (boletim.fotos_urls && boletim.fotos_urls.length > 0) {
      conteudo += '<p><strong>Fotos Anexadas:</strong><br>';
      for (const url of boletim.fotos_urls) {
        conteudo += `<img src="${url}" alt="Foto do boletim" style="max-width:200px; margin:4px;" />`;
      }
      conteudo += '</p>';
    }
    if (boletim.audios_urls && boletim.audios_urls.length > 0) {
      conteudo += '<p><strong>Áudios Anexados:</strong><br>';
      for (const url of boletim.audios_urls) {
        conteudo += `<a href="${url}">Ouvir áudio</a><br>`;
      }
      conteudo += '</p>';
    }
    conteudo += '<hr />';
  }

  const titulo = 'Boletim Meteorológico - AVIBAQ';

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:sans-serif;background:#f9fafb;padding:24px 0;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png" alt="AVIBAQ" style="max-width:120px;margin-bottom:8px;" />
        <h2 style="color:#1e293b;font-size:24px;margin:0;">Boletim Meteorológico - AVIBAQ</h2>
      </div>
      <div style="background:#fff;border-radius:8px;padding:24px 24px 16px 24px;box-shadow:0 2px 8px #0001;">
        <p style="font-size:16px;color:#222;margin-bottom:16px;">Olá, <strong>${nome || 'Testador'}</strong>!</p>
        ${conteudo}
      </div>
      <div style="font-size:13px;color:#666;text-align:center;margin-top:32px;">
        <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb;" />
        <p style="margin:0 0 8px 0;">AVIBAQ - Associação de Pilotos e Empresas de Balonismo</p>
        <p style="margin:0 0 8px 0;">Dúvidas? Fale conosco: <a href="mailto:contato@avibaq.org" style="color:#2563eb;">contato@avibaq.org</a></p>
        <p style="margin:0;">Caso não queira mais receber nossos e-mails, basta ignorar este teste.</p>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: 'AVIBAQ <no-reply@avibaq.org>',
      to: email,
      subject: titulo,
      html,
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error(`Erro ao enviar para ${email}:`, err);
    return res.status(500).json({ error: 'Erro ao enviar e-mail de teste.' });
  }
} 