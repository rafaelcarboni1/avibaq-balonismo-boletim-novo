import { NextApiRequest, NextApiResponse } from 'next';

// API de teste simples para verificar se o problema é específico do upload
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 [TEST] API de teste iniciada');
  
  try {
    // Simular uma pequena operação async
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('🧪 [TEST] Operação concluída');
    
    return res.status(200).json({
      success: true,
      message: 'API de teste funcionando',
      timestamp: new Date().toISOString(),
      method: req.method,
      headers: Object.keys(req.headers)
    });
    
  } catch (error) {
    console.error('🧪 [TEST] Erro:', error);
    
    return res.status(500).json({
      error: 'Erro na API de teste',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}