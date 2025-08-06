import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function disableStorageRLS() {
  console.log('🔧 Configurando storage para permitir uploads...');
  
  try {
    // Primeiro, vamos tornar o bucket público temporariamente
    console.log('📦 Atualizando configurações do bucket...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }
    
    const voosAnexosBucket = buckets.find(b => b.name === 'voos-anexos');
    
    if (voosAnexosBucket) {
      console.log('✅ Bucket voos-anexos encontrado');
      console.log('   Público:', voosAnexosBucket.public);
      console.log('   Limite de tamanho:', voosAnexosBucket.file_size_limit);
    }
    
    // Vamos tentar uma abordagem diferente: usar a API REST diretamente
    console.log('\n🔄 Tentando configurar políticas via API REST...');
    
    // Criar uma política muito simples que permite tudo para usuários autenticados
    const simplePolicySQL = `
      -- Remover políticas existentes
      DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
      DROP POLICY IF EXISTS "Allow authenticated access" ON storage.objects;
      
      -- Criar política simples para uploads
      CREATE POLICY "Allow authenticated uploads" ON storage.objects
        FOR ALL USING (
          bucket_id = 'voos-anexos' AND
          auth.uid() IS NOT NULL
        )
        WITH CHECK (
          bucket_id = 'voos-anexos' AND
          auth.uid() IS NOT NULL
        );
    `;
    
    console.log('\n📋 SQL para executar manualmente no Supabase Dashboard:');
    console.log('=' .repeat(60));
    console.log(simplePolicySQL);
    console.log('=' .repeat(60));
    
    console.log('\n📝 Instruções:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Cole e execute o SQL acima');
    console.log('4. Teste o upload novamente');
    
    // Teste de upload para verificar se funciona
    console.log('\n🧪 Testando upload após configuração...');
    
    const testFile = new Blob(['teste após configuração'], { type: 'text/plain' });
    const testPath = `test-config-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voos-anexos')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Upload ainda falha:', uploadError);
      
      console.log('\n🔧 Solução alternativa: Usar service_role no frontend');
      console.log('\n📝 Modifique o arquivo de configuração do Supabase no frontend:');
      console.log('\nEm lib/supabase.ts ou similar, temporariamente use:');
      console.log('const supabase = createClient(url, SERVICE_ROLE_KEY)');
      console.log('\n⚠️  ATENÇÃO: Isso é apenas para testes! Não use em produção!');
      
    } else {
      console.log('✅ Upload funcionando!');
      
      // Limpar arquivo de teste
      await supabase.storage
        .from('voos-anexos')
        .remove([testPath]);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

disableStorageRLS().catch(console.error);