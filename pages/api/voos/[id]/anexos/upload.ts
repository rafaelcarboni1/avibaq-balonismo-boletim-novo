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

// Cliente normal para verificações de autenticação
const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🚀 [UPLOAD] Iniciando handler de upload');
  console.log('🚀 [UPLOAD] Método:', req.method);
  console.log('🚀 [UPLOAD] Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method !== 'POST') {
    console.log('❌ [UPLOAD] Método não permitido:', req.method);
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { id: vooId } = req.query;
    console.log('🚀 [UPLOAD] Voo ID:', vooId);

    if (!vooId || typeof vooId !== 'string') {
      console.log('❌ [UPLOAD] ID do voo inválido:', vooId);
      return res.status(400).json({ error: 'ID do voo é obrigatório' });
    }

    // Verificar autenticação
    console.log('🔐 [UPLOAD] Verificando autenticação...');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [UPLOAD] Token não fornecido ou formato inválido');
      return res.status(401).json({ error: 'Token de autenticação necessário' });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔐 [UPLOAD] Token recebido:', token.substring(0, 20) + '...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ [UPLOAD] Erro de autenticação:', authError?.message || 'Usuário não encontrado');
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    console.log('✅ [UPLOAD] Usuário autenticado:', user.email);

    // Verificar se o usuário é piloto e tem acesso ao voo
    console.log('👤 [UPLOAD] Verificando se usuário é piloto...');
    const { data: membro, error: membroError } = await supabaseAdmin
      .from('membros')
      .select('id')
      .eq('user_id', user.id)
      .eq('tipo', 'piloto')
      .single();

    if (membroError || !membro) {
      console.log('❌ [UPLOAD] Usuário não é piloto:', membroError?.message || 'Membro não encontrado');
      return res.status(403).json({ error: 'Acesso negado: usuário não é piloto' });
    }
    
    console.log('✅ [UPLOAD] Usuário é piloto, ID:', membro.id);

    // Verificar se o voo pertence ao piloto
    const { data: voo, error: vooError } = await supabaseAdmin
      .from('voos')
      .select('piloto_id, status')
      .eq('id', vooId)
      .single();

    if (vooError || !voo) {
      return res.status(404).json({ error: 'Voo não encontrado' });
    }

    if (voo.piloto_id !== membro.id) {
      return res.status(403).json({ error: 'Acesso negado: voo não pertence ao piloto' });
    }

    if (!['checklist_concluido', 'finalizado'].includes(voo.status)) {
      return res.status(400).json({ error: 'Voo deve estar com checklist concluído' });
    }

    // Verificar Content-Type
    const contentType = req.headers['content-type'] || '';
    console.log('📦 [UPLOAD] Content-Type recebido:', contentType);
    
    if (!contentType.includes('multipart/form-data')) {
      console.log('❌ [UPLOAD] Content-Type inválido, esperado multipart/form-data');
      return res.status(415).json({ 
        error: 'Content-Type deve ser multipart/form-data',
        received: contentType 
      });
    }

    // Verificar se /tmp existe e é gravável (ambiente serverless)
    console.log('📦 [UPLOAD] Verificando diretório /tmp...');
    try {
      const fs = require('fs');
      if (!fs.existsSync('/tmp')) {
        console.log('⚠️ [UPLOAD] /tmp não existe, usando os.tmpdir()');
      } else {
        console.log('✅ [UPLOAD] /tmp existe');
      }
    } catch (tmpError) {
      console.log('⚠️ [UPLOAD] Erro ao verificar /tmp:', tmpError);
    }

    // Parse do formulário multipart
    console.log('📦 [UPLOAD] Parseando formulário multipart...');
    
    let fields, files;
    try {
      // Configuração robusta para ambiente serverless
      const form = formidable({
        uploadDir: require('os').tmpdir(), // Usa o tmpdir do sistema
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFields: 10,
        multiples: false,
        allowEmptyFiles: false,
        minFileSize: 1,
        // Timeout para evitar travamentos
        maxFieldsSize: 2 * 1024 * 1024, // 2MB para fields
      });

      // Adicionar listener de erro direto no form
      form.on('error', (err) => {
        console.error('💥 [UPLOAD] Erro do formidable (event):', err);
      });

      console.log('📦 [UPLOAD] Iniciando parse...');
      [fields, files] = await form.parse(req);
      console.log('📦 [UPLOAD] Parse bem-sucedido');
      
    } catch (parseError) {
      console.error('💥 [UPLOAD] Erro no parse do formidable:', parseError);
      console.error('💥 [UPLOAD] Stack do parseError:', parseError?.stack);
      console.error('💥 [UPLOAD] Tipo do parseError:', typeof parseError);
      console.error('💥 [UPLOAD] Nome do parseError:', parseError?.constructor?.name);
      
      return res.status(400).json({ 
        error: 'Erro ao processar formulário multipart',
        details: parseError instanceof Error ? parseError.message : String(parseError),
        errorType: parseError?.constructor?.name || 'Unknown'
      });
    }
    
    console.log('📦 [UPLOAD] Fields recebidos:', Object.keys(fields || {}));
    console.log('📦 [UPLOAD] Files recebidos:', Object.keys(files || {}));
    
    const tipo = Array.isArray(fields.tipo) ? fields.tipo[0] : fields.tipo;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    console.log('📦 [UPLOAD] Tipo extraído:', tipo);
    console.log('📦 [UPLOAD] File extraído:', file ? `${file.originalFilename} (${file.size} bytes)` : 'Não encontrado');

    if (!file || !tipo) {
      return res.status(400).json({ error: 'Arquivo e tipo são obrigatórios' });
    }

    // Validar tipo de anexo
    const tiposPermitidos = ['track_log', 'foto_voo', 'regulamento_assinado'];
    if (!tiposPermitidos.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de anexo inválido' });
    }

    // Validar tipo MIME
    const tiposArquivo: Record<string, string[]> = {
      track_log: ['application/gpx+xml', 'text/xml', 'application/xml', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg'],
      foto_voo: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
      regulamento_assinado: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic']
    };

    if (!tiposArquivo[tipo].includes(file.mimetype || '')) {
      return res.status(400).json({ 
        error: `Tipo de arquivo não permitido para ${tipo}. Tipos aceitos: ${tiposArquivo[tipo].join(', ')}` 
      });
    }

    // Ler o arquivo
    const fileBuffer = fs.readFileSync(file.filepath);
    
    // Gerar nome único
    const fileExt = path.extname(file.originalFilename || '');
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExt}`;
    const storagePath = `voos/${vooId}/${fileName}`;

    // Upload para o Supabase Storage
    console.log('Iniciando upload para Storage:', storagePath);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('voos-anexos')
      .upload(storagePath, fileBuffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no upload para Storage:', uploadError);
      console.error('Detalhes do erro:', JSON.stringify(uploadError, null, 2));
      return res.status(500).json({ error: `Erro no upload: ${uploadError.message}` });
    }
    
    console.log('Upload para Storage concluído:', uploadData);

    // Obter URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('voos-anexos')
      .getPublicUrl(storagePath);

    // Salvar registro no banco
    const anexoRecord = {
      voo_id: vooId,
      tipo,
      nome_arquivo: fileName,
      nome_original: file.originalFilename || fileName,
      url_storage: publicUrl,
      tamanho_bytes: file.size,
      mime_type: file.mimetype || 'application/octet-stream',
      uploaded_por: user.id
    };
    
    console.log('Salvando anexo no banco:', JSON.stringify(anexoRecord, null, 2));
    
    const { data: anexoData, error: anexoError } = await supabaseAdmin
      .from('voos_anexos')
      .insert(anexoRecord)
      .select()
      .single();

    if (anexoError) {
      console.error('Erro ao salvar anexo no banco:', anexoError);
      console.error('Detalhes do erro:', JSON.stringify(anexoError, null, 2));
      // Tentar remover o arquivo do storage se falhou ao salvar no banco
      await supabaseAdmin.storage.from('voos-anexos').remove([storagePath]);
      return res.status(500).json({ error: `Erro ao salvar anexo: ${anexoError.message}` });
    }
    
    console.log('Anexo salvo no banco com sucesso:', anexoData?.id);

    // Limpar arquivo temporário
    fs.unlinkSync(file.filepath);

    console.log('🎉 [UPLOAD] Upload completo com sucesso!');
    console.log('🎉 [UPLOAD] Anexo ID:', anexoData?.id);
    console.log('🎉 [UPLOAD] URL:', anexoData?.url_storage);
    
    return res.status(200).json({
      success: true,
      anexo: anexoData
    });

  } catch (error) {
    console.error('💥 [UPLOAD] ERRO CRÍTICO no upload:', error);
    
    let errorMessage = 'Erro interno do servidor';
    let errorDetails: any = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      };
    } else {
      errorMessage = 'Ocorreu um erro inesperado.';
      errorDetails = error;
    }
    
    console.error('💥 [UPLOAD] Detalhes do erro:', JSON.stringify(errorDetails, null, 2));
    
    // Evitar que a resposta seja enviada se os headers já foram enviados
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      });
    } else {
      console.error('💥 [UPLOAD] Headers já enviados, não é possível enviar resposta de erro');
    }
  }
}