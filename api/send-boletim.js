import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

function getBrasiliaDate(offsetDays = 0) {
  const now = new Date();
  // Ajusta para o fuso de Brasília (GMT-3)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const brasilia = new Date(utc - (3 * 60 * 60 * 1000));
  brasilia.setDate(brasilia.getDate() + offsetDays);
  return brasilia.toISOString().slice(0, 10); // YYYY-MM-DD
}

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

  // Buscar o boletim do dia seguinte
  const dataAmanha = getBrasiliaDate(1); // Dia seguinte
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

  // Enviar e-mail para cada assinante
  for (const assinante of assinantes) {
    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif;background:#f9fafb;padding:24px 0;">
        <div style="text-align:center;margin-bottom:24px;">
          <img src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png" alt="AVIBAQ" style="max-width:120px;margin-bottom:8px;" />
          <h2 style="color:#1e293b;font-size:24px;margin:0;">Boletim Meteorológico - AVIBAQ</h2>
        </div>
        <div style="background:#fff;border-radius:8px;padding:24px 24px 16px 24px;box-shadow:0 2px 8px #0001;">
          <p style="font-size:16px;color:#222;margin-bottom:16px;">Olá, <strong>${assinante.nome}</strong>!</p>
          ${conteudo}
        </div>
        <div style="font-size:13px;color:#666;text-align:center;margin-top:32px;">
          <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb;" />
          <p style="margin:0 0 8px 0;">AVIBAQ - Associação de Pilotos e Empresas de Balonismo</p>
          <p style="margin:0 0 8px 0;">Dúvidas? Fale conosco: <a href="mailto:contato@avibaq.org" style="color:#2563eb;">contato@avibaq.org</a></p>
          <p style="margin:0;">Caso não queira mais receber nossos e-mails, <a href="https://avibaq.org/descadastrar?token=${assinante.token_descadastro}" style="color:#ef4444;">clique aqui para se descadastrar</a>.</p>
        </div>
      </div>
    `;

    try {
      await resend.emails.send({
        from: 'AVIBAQ <no-reply@avibaq.org>',
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