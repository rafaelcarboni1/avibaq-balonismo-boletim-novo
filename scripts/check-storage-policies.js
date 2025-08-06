import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStoragePolicies() {
  console.log('🔍 Verificando políticas de storage...');
  
  try {
    // Verificar políticas existentes
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects');
    
    if (error) {
      console.error('❌ Erro ao verificar políticas:', error);
      return;
    }
    
    console.log('📋 Políticas encontradas:', policies?.length || 0);
    
    if (policies && policies.length > 0) {
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('⚠️  Nenhuma política encontrada para storage.objects');
      console.log('\n🔧 Aplicando políticas de storage...');
      
      // Aplicar políticas manualmente
      const policyQueries = [
        `
        CREATE POLICY "Usuários podem fazer upload para seus voos" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'voos-anexos' AND
            auth.uid() IS NOT NULL
          );
        `,
        `
        CREATE POLICY "Usuários podem ver anexos de seus voos" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'voos-anexos' AND
            auth.uid() IS NOT NULL
          );
        `,
        `
        CREATE POLICY "Usuários podem atualizar anexos de seus voos" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'voos-anexos' AND
            auth.uid() IS NOT NULL
          );
        `,
        `
        CREATE POLICY "Usuários podem deletar anexos de seus voos" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'voos-anexos' AND
            auth.uid() IS NOT NULL
          );
        `
      ];
      
      for (const query of policyQueries) {
        try {
          const { error: policyError } = await supabase.rpc('exec_sql', {
            sql: query
          });
          
          if (policyError) {
            console.error('❌ Erro ao criar política:', policyError);
          } else {
            console.log('✅ Política criada com sucesso');
          }
        } catch (err) {
          console.error('❌ Erro:', err);
        }
      }
    }
    
    // Verificar se RLS está habilitado
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');"
      });
    
    if (rlsError) {
      console.error('❌ Erro ao verificar RLS:', rlsError);
    } else {
      console.log('\n🔒 Status RLS:', rlsStatus);
    }
    
    // Teste simples de upload
    console.log('\n🧪 Testando upload básico...');
    
    const testFile = new Blob(['teste'], { type: 'text/plain' });
    const testPath = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voos-anexos')
      .upload(testPath, testFile);
    
    if (uploadError) {
      console.error('❌ Erro no teste de upload:', uploadError);
      
      if (uploadError.message.includes('RLS')) {
        console.log('\n💡 Problema detectado: RLS está bloqueando uploads');
        console.log('\n🔧 Soluções possíveis:');
        console.log('1. Desabilitar RLS temporariamente para testes');
        console.log('2. Simplificar as políticas de storage');
        console.log('3. Usar service_role key para uploads');
      }
    } else {
      console.log('✅ Teste de upload bem-sucedido!');
      
      // Limpar arquivo de teste
      await supabase.storage
        .from('voos-anexos')
        .remove([testPath]);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkStoragePolicies().catch(console.error);