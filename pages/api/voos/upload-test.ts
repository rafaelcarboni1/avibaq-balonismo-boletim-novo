import { NextApiRequest, NextApiResponse } from 'next';

// API de teste SEM [id] para verificar se dynamic routes são o problema
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[UPLOAD-TEST] Function started');
  console.log('[UPLOAD-TEST] Method:', req.method);
  console.log('[UPLOAD-TEST] URL:', req.url);
  console.log('[UPLOAD-TEST] Query:', req.query);
  
  if (req.method === 'POST') {
    return res.status(200).json({
      success: true,
      message: 'POST funcionando sem dynamic route',
      method: req.method,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'GET funcionando sem dynamic route',
      method: req.method,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}