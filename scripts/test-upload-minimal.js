// Teste simples para verificar o problema de upload
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBasicUpload() {
  console.log('🧪 Teste Básico de Upload');
  
  // Teste 1: Verificar se consegue listar voos
  const { data: voos, error: voosError } = await supabase
    .from('voos')
    .select('id, piloto_id, status')
    .limit(5);
  
  console.log('1. Voos disponíveis:', voos?.length || 0);
  if (voosError) console.error('   Erro:', voosError);
  
  // Teste 2: Verificar se consegue acessar storage
  const { data: storageData, error: storageError } = await supabase
    .storage
    .from('voos-anexos')
    .list('', { limit: 1 });
  
  console.log('2. Acesso ao storage:', storageError ? 'ERRO' : 'OK');
  if (storageError) console.error('   Erro:', storageError);
  
  // Teste 3: Verificar se consegue inserir na tabela (simulado)
  const { data: anexoTest, error: anexoError } = await supabase
    .from('voos_anexos')
    .select('id')
    .limit(1);
  
  console.log('3. Acesso à tabela voos_anexos:', anexoError ? 'ERRO' : 'OK');
  if (anexoError) console.error('   Erro:', anexoError);
  
  console.log('\n✅ Execute este script com: node scripts/test-upload-minimal.js');
  console.log('📝 Se algum teste falhar, isso indica onde está o problema');
}

testBasicUpload().catch(console.error);