// Teste simples para upload na página de pós-voo
import { createClient } from '@supabase/supabase-js';
import { uploadFileSecure } from '../src/lib/supabase-upload.ts';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.Uy8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPosVooUpload() {
  try {
    console.log('🧪 Iniciando teste de upload da página de pós-voo...');
    
    // Criar arquivo de teste
    const testContent = 'Conteúdo de teste para upload de anexo de voo';
    const testFileName = 'test-anexo-voo.txt';
    const testFilePath = path.join(process.cwd(), testFileName);
    
    fs.writeFileSync(testFilePath, testContent);
    console.log('📄 Arquivo de teste criado:', testFileName);
    
    // Simular dados do arquivo
    const file = {
      name: testFileName,
      type: 'text/plain',
      size: testContent.length
    };
    
    // Simular ID do voo e tipo de anexo
    const vooId = 'test-voo-123';
    const tipoAnexo = 'relatorio';
    const userId = 'test-user-456';
    
    console.log('📤 Testando upload com parâmetros:');
    console.log('- Voo ID:', vooId);
    console.log('- Tipo:', tipoAnexo);
    console.log('- User ID:', userId);
    console.log('- Arquivo:', file.name);
    
    // Testar upload
    const result = await uploadFileSecure({
       file: new File([fs.readFileSync(testFilePath)], file.name, { type: file.type }),
       bucket: 'voos-anexos',
       path: `${vooId}/${tipoAnexo}`,
       userId: userId,
       allowedTypes: ['text/plain', 'application/pdf', 'image/jpeg', 'image/png'],
       maxSizeBytes: 10 * 1024 * 1024 // 10MB
     });
     
     if (!result.success) {
       throw new Error(`Erro no upload: ${result.error}`);
     }
     
     console.log('✅ Upload realizado com sucesso!');
     console.log('📋 Resultado:', {
       path: result.path,
       url: result.url,
       data: result.data
     });
    
    // Limpar arquivo de teste
    fs.unlinkSync(testFilePath);
    console.log('🧹 Arquivo de teste removido');
    
    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('📊 Detalhes do erro:', error);
    
    // Limpar arquivo de teste em caso de erro
    const testFilePath = path.join(process.cwd(), 'test-anexo-voo.txt');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('🧹 Arquivo de teste removido após erro');
    }
    
    process.exit(1);
  }
}

testPosVooUpload();