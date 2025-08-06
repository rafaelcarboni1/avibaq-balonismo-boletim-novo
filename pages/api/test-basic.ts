import { NextApiRequest, NextApiResponse } from 'next';

// API básica de teste
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('✅ [BASIC-TEST] API básica chamada');
  
  return res.status(200).json({
    success: true,
    message: 'API básica funcionando',
    timestamp: new Date().toISOString(),
    method: req.method,
    environment: process.env.NODE_ENV
  });
}