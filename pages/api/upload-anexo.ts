import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Configurar para não fazer parse automático do body
export const config = {
  api: {
    bodyParser: false,
  },
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente com service role para operações privilegiadas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// VERSÃO SEM DYNAMIC ROUTE - pega vooId da query string
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[UPLOAD-ANEXO] Function started');
  
  // Set proper headers immediately
  res.setHeader('Content-Type', 'application/json');
  
  try {
    console.log('[UPLOAD-ANEXO] Method:', req.method);
    console.log('[UPLOAD-ANEXO] Query:', req.query);
    
    if (req.method !== 'POST') {
      console.log('[UPLOAD-ANEXO] Method not allowed:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Pega vooId da query string em vez de dynamic route
    const { vooId } = req.query;
    console.log('[UPLOAD-ANEXO] Voo ID:', vooId);

    if (!vooId || typeof vooId !== 'string') {
      console.log('[UPLOAD-ANEXO] ID do voo inválido:', vooId);
      return res.status(400).json({ error: 'ID do voo é obrigatório como query param ?vooId=...' });
    }

    // Resposta simples para testar se chega até aqui
    return res.status(200).json({
      success: true,
      message: 'API sem dynamic route funcionando!',
      vooId: vooId,
      method: req.method,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[UPLOAD-ANEXO] ERRO:', error instanceof Error ? error.message : String(error));
    
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}