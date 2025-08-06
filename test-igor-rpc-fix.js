import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Credenciais do Igor
const IGOR_EMAIL = 'igor_pk_@hotmail.com';
const IGOR_PASSWORD = 'igorniehues';

async function testIgorRPCFix() {
  console.log('🧪 TESTE DA FUNÇÃO RPC CORRIGIDA - USUÁRIO IGOR');
  console.log('=' .repeat(60));
  
  try {
    // 1. Login do Igor
    console.log('\n1. 🔐 Fazendo login do Igor...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: IGOR_EMAIL,
      password: IGOR_PASSWORD
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log('   Auth ID:', authData.user.id);
    console.log('   Email:', authData.user.email);
    
    // 2. Testar função RPC get_current_user_table_id
    console.log('\n2. 🔧 Testando função RPC get_current_user_table_id...');
    const { data: userTableId, error: rpcError } = await supabase.rpc('get_current_user_table_id');
    
    if (rpcError) {
      console.error('❌ Erro na função RPC:', rpcError.message);
      console.error('   Detalhes:', rpcError);
    } else {
      console.log('✅ Função RPC executada com sucesso');
      console.log('   User Table ID retornado:', userTableId);
    }
    
    // 3. Testar função de debug
    console.log('\n3. 🔍 Testando função de debug...');
    const { data: debugInfo, error: debugError } = await supabase.rpc('debug_get_current_user_table_id');
    
    if (debugError) {
      console.error('❌ Erro na função de debug:', debugError.message);
    } else {
      console.log('✅ Função de debug executada com sucesso');
      console.log('   Debug Info:', JSON.stringify(debugInfo, null, 2));
    }
    
    // 4. Verificar dados na tabela users
    console.log('\n4. 👤 Verificando dados na tabela users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, auth_id')
      .eq('email', IGOR_EMAIL)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError.message);
    } else {
      console.log('✅ Dados do usuário encontrados:');
      console.log('   ID na tabela users:', userData.id);
      console.log('   Email:', userData.email);
      console.log('   Auth ID na tabela:', userData.auth_id);
      console.log('   Auth ID do login:', authData.user.id);
      console.log('   IDs coincidem?', userData.auth_id === authData.user.id ? '✅ SIM' : '❌ NÃO');
    }
    
    // 5. Teste de simulação do problema do marcado_por
    console.log('\n5. 🎯 Simulando problema do marcado_por...');
    
    if (userTableId && userData) {
      console.log('✅ PROBLEMA RESOLVIDO!');
      console.log('   - Função RPC retorna ID válido:', userTableId);
      console.log('   - ID corresponde ao usuário na tabela:', userTableId === userData.id ? '✅ SIM' : '❌ NÃO');
      console.log('   - Campo marcado_por pode usar:', userTableId);
    } else {
      console.log('❌ PROBLEMA AINDA EXISTE!');
      console.log('   - Função RPC não retorna ID válido');
      console.log('   - Campo marcado_por ficará null');
    }
    
    // 6. Salvar relatório
    const report = {
      timestamp: new Date().toISOString(),
      test: 'Igor RPC Fix Test',
      auth_data: {
        user_id: authData.user.id,
        email: authData.user.email
      },
      rpc_result: {
        user_table_id: userTableId,
        error: rpcError?.message || null
      },
      debug_info: debugInfo,
      user_data: userData,
      problem_resolved: !!(userTableId && userData && userTableId === userData.id)
    };
    
    fs.writeFileSync('igor-rpc-test-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Relatório salvo em: igor-rpc-test-report.json');
    
    // Logout
    await supabase.auth.signOut();
    console.log('\n🚪 Logout realizado');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

// Executar teste
testIgorRPCFix().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});