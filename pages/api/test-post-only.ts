import { NextApiRequest, NextApiResponse } from 'next';

// API de teste que APENAS aceita POST para testar se headers resolvem
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[TEST-POST-ONLY] Function started');
  console.log('[TEST-POST-ONLY] Method:', req.method);
  console.log('[TEST-POST-ONLY] Headers:', req.headers);
  
  // APENAS POST
  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'POST funcionando com headers CORS!',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.status(405).json({ error: 'Apenas POST é permitido' });
}