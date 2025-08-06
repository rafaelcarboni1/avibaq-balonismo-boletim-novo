import { NextApiRequest, NextApiResponse } from 'next';

// VERSÃO ULTRA-LIMPA SEM LOGS PARA DIAGNÓSTICO
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Resposta mínima sem nenhum log
    return res.status(200).json({
      success: true,
      message: 'Clean API working',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}