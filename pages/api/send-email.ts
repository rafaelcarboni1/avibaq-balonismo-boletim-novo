import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('[Send Email] RESEND_API_KEY not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const result = await resend.emails.send({
      from: 'AVIBAQ <noreply@avibaq.com.br>',
      to: [to],
      subject: subject,
      html: html
    });

    console.log('[Send Email] Email sent successfully:', { to, subject, id: result.data?.id });

    return res.status(200).json({ 
      success: true, 
      id: result.data?.id,
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('[Send Email] Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
}