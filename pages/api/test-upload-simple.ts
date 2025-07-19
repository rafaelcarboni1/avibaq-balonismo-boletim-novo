import { NextApiRequest, NextApiResponse } from 'next';

// API de teste SEM dynamic route para verificar se o problema é o [id]
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[TEST-SIMPLE] Function started');
  console.log('[TEST-SIMPLE] Method:', req.method);
  console.log('[TEST-SIMPLE] URL:', req.url);
  
  // Aceita POST e GET
  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'POST funcionando na API simples',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'GET funcionando na API simples',
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}