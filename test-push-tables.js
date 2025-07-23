const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPushTables() {
  console.log('🔍 Verificando tabelas do sistema de push notifications...\n');

  const tables = ['push_subscriptions', 'push_notifications', 'push_delivery_logs', 'push_scheduled_jobs'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ Tabela ${table}: Erro inesperado - ${err.message}`);
    }
  }
  
  // Testar estrutura específica da push_notifications
  try {
    console.log('\n🔍 Testando estrutura da tabela push_notifications...');
    const { data, error } = await supabase
      .from('push_notifications')
      .insert({
        created_by: '00000000-0000-0000-0000-000000000000', // UUID fake para teste
        title: 'Teste',
        message: 'Teste de estrutura',
        target_audience: { type: 'all' },
        status: 'draft'
      })
      .select();
      
    if (error) {
      console.log(`❌ Estrutura push_notifications: ${error.message}`);
    } else {
      console.log('✅ Estrutura push_notifications: OK');
      
      // Limpar o registro de teste
      await supabase
        .from('push_notifications')
        .delete()
        .eq('id', data[0].id);
    }
  } catch (err) {
    console.log(`❌ Estrutura push_notifications: ${err.message}`);
  }
}

testPushTables().then(() => {
  console.log('\n✅ Verificação concluída!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro na verificação:', err);
  process.exit(1);
});