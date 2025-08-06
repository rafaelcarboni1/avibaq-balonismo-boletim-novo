import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import os from 'os';

// Configurar para não fazer parse automático do body
export const config = {
  api: {
    bodyParser: false,
  },
};

// API de debug simplificada para testar formidable
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🧪 [DEBUG-UPLOAD] Iniciando teste de upload simplificado');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🧪 [DEBUG-UPLOAD] Headers:', JSON.stringify(req.headers, null, 2));
    
    // Verificar Content-Type
    const contentType = req.headers['content-type'] || '';
    console.log('🧪 [DEBUG-UPLOAD] Content-Type:', contentType);
    
    if (!contentType.includes('multipart/form-data')) {
      return res.status(415).json({ 
        error: 'Content-Type deve ser multipart/form-data',
        received: contentType 
      });
    }

    // Verificar diretórios temporários
    console.log('🧪 [DEBUG-UPLOAD] Verificando diretórios...');
    console.log('🧪 [DEBUG-UPLOAD] os.tmpdir():', os.tmpdir());
    console.log('🧪 [DEBUG-UPLOAD] /tmp existe:', fs.existsSync('/tmp'));
    
    // Tentar criar arquivo de teste no tmpdir
    const testFile = `${os.tmpdir()}/test-${Date.now()}.txt`;
    try {
      fs.writeFileSync(testFile, 'teste');
      fs.unlinkSync(testFile);
      console.log('🧪 [DEBUG-UPLOAD] Escrita no tmpdir: OK');
    } catch (writeError) {
      console.log('🧪 [DEBUG-UPLOAD] Erro na escrita:', writeError);
    }

    // Teste básico do formidable
    console.log('🧪 [DEBUG-UPLOAD] Testando formidable...');
    
    const form = formidable({
      uploadDir: os.tmpdir(),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB
      maxFields: 5,
      multiples: false,
    });

    form.on('error', (err) => {
      console.error('🧪 [DEBUG-UPLOAD] Erro do formidable (event):', err);
    });

    form.on('progress', (bytesReceived, bytesExpected) => {
      console.log('🧪 [DEBUG-UPLOAD] Progress:', bytesReceived, '/', bytesExpected);
    });

    const [fields, files] = await form.parse(req);
    
    console.log('🧪 [DEBUG-UPLOAD] Parse concluído');
    console.log('🧪 [DEBUG-UPLOAD] Fields:', Object.keys(fields || {}));
    console.log('🧪 [DEBUG-UPLOAD] Files:', Object.keys(files || {}));

    // Detalhes dos arquivos
    const fileDetails = Object.entries(files || {}).map(([key, file]) => {
      const f = Array.isArray(file) ? file[0] : file;
      return {
        key,
        originalFilename: f?.originalFilename,
        mimetype: f?.mimetype,
        size: f?.size,
        filepath: f?.filepath
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Teste de upload bem-sucedido',
      environment: {
        tmpdir: os.tmpdir(),
        tmpExists: fs.existsSync('/tmp'),
        nodeVersion: process.version,
        platform: process.platform
      },
      request: {
        contentType,
        headers: req.headers
      },
      formidable: {
        fields: Object.keys(fields || {}),
        files: fileDetails
      }
    });

  } catch (error) {
    console.error('🧪 [DEBUG-UPLOAD] ERRO:', error);
    
    const errorDetails = {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    };
    
    return res.status(500).json({
      error: 'Erro no teste de upload',
      details: errorDetails,
      environment: {
        tmpdir: os.tmpdir(),
        tmpExists: fs.existsSync('/tmp'),
        nodeVersion: process.version,
        platform: process.platform
      }
    });
  }
}