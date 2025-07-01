import { serve } from 'std/server'
import { Resend } from 'resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  const { email, nome, token } = await req.json()

  const confirmUrl = `https://localhost:8080/confirmar?token=${token}` // Troque para seu domínio em produção

  const { error } = await resend.emails.send({
    from: 'AVIBAQ <no-reply@localhost>', // Troque para seu domínio em produção
    to: [email],
    subject: 'Confirme sua inscrição no Boletim AVIBAQ',
    html: `
      <h2>Olá, ${nome}!</h2>
      <p>Obrigado por se inscrever para receber o Boletim Meteorológico da AVIBAQ.</p>
      <p>Para confirmar sua inscrição, clique no link abaixo:</p>
      <p><a href="${confirmUrl}" target="_blank">Confirmar inscrição</a></p>
      <p>Se não foi você, ignore este e-mail.</p>
      <br>
      <small>AVIBAQ - Associação de Pilotos e Empresas de Balonismo</small>
    `
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
})