import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSPolicy() {
  console.log('🔍 Testando política RLS para upload de anexos...');
  
  const vooId = '8c930b01-b679-4659-8224-3db8bd0b5d85';
  const userId = '3dd68e6a-4c5d-47a4-921c-da3b497efb36';
  const testPath = `voos/${vooId}/test-file.txt`;
  
  console.log('📋 Dados do teste:');
  console.log('   Voo ID:', vooId);
  console.log('   User ID:', userId);
  console.log('   Path:', testPath);
  
  // Testar a função storage.foldername
  console.log('\n🧪 Testando função storage.foldername...');
  try {
    const { data: folderResult, error: folderError } = await supabase
      .rpc('exec_sql', { 
        query: `SELECT storage.foldername('${testPath}') as foldername_result;` 
      });
    
    if (folderError) {
      console.error('❌ Erro ao testar foldername:', folderError);
    } else {
      console.log('✅ Resultado foldername:', folderResult[0]?.foldername_result);
      const folders = folderResult[0]?.foldername_result;
      if (folders && folders.length > 1) {
        console.log('   Índice [0]:', folders[0]);
        console.log('   Índice [1]:', folders[1]);
        console.log('   Índice [2]:', folders[2] || 'undefined');
      }
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao testar foldername:', error);
  }
  
  // Testar a condição da política RLS
  console.log('\n🔐 Testando condição da política RLS...');
  try {
    const query = `
      SELECT 
        u.id as user_id,
        m.id as membro_id,
        m.tipo,
        v.id as voo_id,
        v.piloto_id,
        (storage.foldername('${testPath}'))[1] as path_voo_id,
        ((storage.foldername('${testPath}'))[1] = v.id::text) as path_matches_voo
      FROM auth.users u
      JOIN membros m ON m.user_id = u.id
      JOIN voos v ON v.piloto_id = m.id
      WHERE u.id = '${userId}'
        AND m.tipo = 'piloto'
        AND v.id = '${vooId}';
    `;
    
    const { data: policyResult, error: policyError } = await supabase
      .rpc('exec_sql', { query });
    
    if (policyError) {
      console.error('❌ Erro ao testar política:', policyError);
    } else if (policyResult && policyResult.length > 0) {
      console.log('✅ Condição da política atendida:');
      const result = policyResult[0];
      console.log('   User ID:', result.user_id);
      console.log('   Membro ID:', result.membro_id);
      console.log('   Tipo:', result.tipo);
      console.log('   Voo ID:', result.voo_id);
      console.log('   Piloto ID:', result.piloto_id);
      console.log('   Path Voo ID:', result.path_voo_id);
      console.log('   Path matches Voo:', result.path_matches_voo);
    } else {
      console.log('❌ Condição da política NÃO atendida');
      console.log('   O usuário não tem permissão para fazer upload neste voo');
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao testar política:', error);
  }
  
  // Verificar se a política existe
  console.log('\n📜 Verificando política RLS...');
  try {
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', { 
        query: `
          SELECT policyname, cmd, with_check 
          FROM pg_policies 
          WHERE tablename = 'objects' 
            AND schemaname = 'storage' 
            AND policyname LIKE '%upload%';
        ` 
      });
    
    if (policiesError) {
      console.error('❌ Erro ao verificar políticas:', policiesError);
    } else {
      console.log('✅ Políticas de upload encontradas:');
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`);
      });
    }
  } catch (error) {
    console.error('❌ Erro inesperado ao verificar políticas:', error);
  }
}

testRLSPolicy().catch(console.error);