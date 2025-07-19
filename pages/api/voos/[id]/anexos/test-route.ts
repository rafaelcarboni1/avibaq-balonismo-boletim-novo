import { NextApiRequest, NextApiResponse } from 'next';

// API de teste para validar roteamento
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[TEST-ROUTE] Method:', req.method);
  console.log('[TEST-ROUTE] URL:', req.url);
  console.log('[TEST-ROUTE] Query:', req.query);
  
  // Aceita qualquer método para teste
  return res.status(200).json({
    success: true,
    message: 'Test route working',
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString()
  });
}