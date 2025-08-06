const { createClient } = require('@supabase/supabase-js');

async function testBalloonValidation() {
  console.log('🔍 Testando validação de prefixo de balão...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Variáveis de ambiente não encontradas');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Testar a função de validação diretamente
  const testPrefixes = ['PT-ABC', 'BR-FORT1', 'PP-123', 'XX-ABC'];
  
  for (const prefix of testPrefixes) {
    try {
      console.log(`\n🧪 Testando prefixo: ${prefix}`);
      
      const { data, error } = await supabase
        .rpc('validar_prefixo_balao', { prefixo: prefix });
      
      if (error) {
        console.log(`❌ Erro ao chamar função: ${error.message}`);
      } else {
        console.log(`${data ? '✅' : '❌'} Resultado: ${data ? 'VÁLIDO' : 'INVÁLIDO'}`);
      }
    } catch (err) {
      console.log(`❌ Erro: ${err.message}`);
    }
  }
  
  // Testar inserção real de balão
  console.log('\n🧪 Testando inserção de balão com BR-FORT1...');
  
  try {
    const { data, error } = await supabase
      .from('baloes')
      .insert({
        prefixo: 'BR-FORT1',
        volume_m3: 1000,
        proprietario_id: '00000000-0000-0000-0000-000000000000' // ID fictício para teste
      })
      .select();
    
    if (error) {
      console.log(`❌ Erro ao inserir: ${error.message}`);
    } else {
      console.log('✅ Inserção bem-sucedida (será rollback)');
      
      // Fazer rollback do teste
      if (data && data[0]) {
        await supabase.from('baloes').delete().eq('id', data[0].id);
      }
    }
  } catch (err) {
    console.log(`❌ Erro na inserção: ${err.message}`);
  }
}

testBalloonValidation();