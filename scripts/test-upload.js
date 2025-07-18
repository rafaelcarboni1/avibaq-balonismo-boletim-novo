import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

// Teste com chave anônima (como no frontend)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Teste com chave de serviço (admin)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testUpload() {
  console.log('🧪 Testando upload de anexos...');
  
  // Criar arquivo de teste
  const testContent = 'Este é um arquivo de teste para verificar o upload.';
  const testFile = new Blob([testContent], { type: 'text/plain' });
  const testFileName = `test-upload-${Date.now()}.txt`;
  const testPath = `voos/test-voo-id/track/${testFileName}`;
  
  console.log('📁 Testando com chave anônima (como no frontend)...');
  
  try {
    const { data: uploadData, error: uploadError } = await supabaseAnon.storage
      .from('voos-anexos')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Erro com chave anônima:', uploadError);
      console.log('   Código:', uploadError.statusCode);
      console.log('   Mensagem:', uploadError.message);
      
      if (uploadError.message.includes('RLS')) {
        console.log('\n💡 Problema: Row Level Security está bloqueando o upload');
      } else if (uploadError.message.includes('JWT')) {
        console.log('\n💡 Problema: Token de autenticação inválido ou expirado');
      } else if (uploadError.message.includes('policy')) {
        console.log('\n💡 Problema: Políticas de segurança estão bloqueando o upload');
      }
    } else {
      console.log('✅ Upload com chave anônima bem-sucedido!');
      console.log('   Path:', uploadData.path);
      
      // Limpar arquivo de teste
      await supabaseAnon.storage
        .from('voos-anexos')
        .remove([testPath]);
    }
  } catch (error) {
    console.error('❌ Erro inesperado com chave anônima:', error);
  }
  
  console.log('\n📁 Testando com chave de serviço (admin)...');
  
  try {
    const { data: uploadData, error: uploadError } = await supabaseService.storage
      .from('voos-anexos')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Erro com chave de serviço:', uploadError);
    } else {
      console.log('✅ Upload com chave de serviço bem-sucedido!');
      console.log('   Path:', uploadData.path);
      
      // Limpar arquivo de teste
      await supabaseService.storage
        .from('voos-anexos')
        .remove([testPath]);
    }
  } catch (error) {
    console.error('❌ Erro inesperado com chave de serviço:', error);
  }
  
  // Verificar buckets disponíveis
  console.log('\n📦 Verificando buckets disponíveis...');
  
  try {
    const { data: buckets, error: bucketsError } = await supabaseService.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
    } else {
      console.log('✅ Buckets encontrados:');
      buckets.forEach(bucket => {
        console.log(`   - ${bucket.name} (público: ${bucket.public})`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar buckets:', error);
  }
  
  console.log('\n🔧 Diagnóstico:');
  console.log('1. Se o upload com chave de serviço funciona mas com chave anônima não:');
  console.log('   → Problema nas políticas RLS ou autenticação');
  console.log('2. Se ambos falham:');
  console.log('   → Problema na configuração do bucket ou rede');
  console.log('3. Se ambos funcionam:');
  console.log('   → Problema específico no frontend (autenticação do usuário)');
}

testUpload().catch(console.error);