import { NextApiRequest, NextApiResponse } from 'next';

// API de teste para debug de upload
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 [TEST] API de teste chamada');
  console.log('🧪 [TEST] Método:', req.method);
  console.log('🧪 [TEST] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🧪 [TEST] URL:', req.url);
  console.log('🧪 [TEST] Query:', req.query);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const contentType = req.headers['content-type'] || '';
    console.log('🧪 [TEST] Content-Type:', contentType);
    
    // Informações sobre o ambiente
    console.log('🧪 [TEST] Ambiente:', {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      env: process.env.NODE_ENV
    });
    
    return res.status(200).json({
      success: true,
      message: 'API de teste funcionando',
      received: {
        method: req.method,
        contentType,
        headers: req.headers,
        query: req.query
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV
      }
    });
    
  } catch (error) {
    console.error('🧪 [TEST] Erro:', error);
    return res.status(500).json({ 
      error: 'Erro na API de teste',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}