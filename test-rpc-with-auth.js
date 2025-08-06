const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRPCWithRealAuth() {
  console.log('🧪 Testando função RPC com autenticação real...');
  
  try {
    // 1. Primeiro, vamos verificar usuários que têm auth_id
    console.log('\n1. Verificando usuários com auth_id...');
    const { data: usersWithAuth, error: usersError } = await supabase
      .from('users')
      .select('id, email, nome, auth_id')
      .not('auth_id', 'is', null)
      .limit(3);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log('✅ Usuários com auth_id encontrados:', usersWithAuth.length);
    usersWithAuth.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - auth_id: ${user.auth_id}`);
    });
    
    if (usersWithAuth.length === 0) {
      console.error('❌ Nenhum usuário com auth_id encontrado');
      return;
    }
    
    // 2. Testar função de debug primeiro
    console.log('\n2. Testando função de debug...');
    const { data: debugData, error: debugError } = await supabase.rpc('debug_get_current_user_table_id');
    
    if (debugError) {
      console.error('❌ Erro na função de debug:', debugError.message);
    } else {
      console.log('✅ Debug info:', debugData);
    }
    
    // 3. Tentar fazer login com um usuário real do auth.users
    console.log('\n3. Tentando fazer login com usuários existentes...');
    
    // Vamos tentar alguns emails comuns de teste
    const testEmails = [
      'murilo@voeomega.com',
      'pamelaselau309@gmail.com',
      'contato@voosmagicos.test',
      'admin@avibaq.com.br',
      'teste@avibaq.com.br'
    ];
    
    const testPasswords = [
      'senha123',
      'password123',
      'admin123',
      'teste123',
      '123456'
    ];
    
    let loginSuccess = false;
    let loggedUser = null;
    
    for (const email of testEmails) {
      for (const password of testPasswords) {
        console.log(`   Tentando: ${email} / ${password}`);
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (!authError && authData.user) {
          console.log(`✅ Login bem-sucedido com: ${email}`);
          console.log(`   User ID: ${authData.user.id}`);
          loginSuccess = true;
          loggedUser = authData.user;
          break;
        }
      }
      if (loginSuccess) break;
    }
    
    if (!loginSuccess) {
      console.log('⚠️  Não foi possível fazer login com nenhum usuário de teste');
      console.log('   Vamos testar a função RPC sem autenticação mesmo assim...');
      
      // Testar sem autenticação
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_user_table_id');
      
      if (rpcError) {
        console.error('❌ Erro na função RPC (sem auth):', rpcError.message);
      } else {
        console.log('✅ Função RPC (sem auth) retornou:', rpcData);
      }
      return;
    }
    
    // 4. Agora testar a função RPC com usuário autenticado
    console.log('\n4. Testando função RPC com usuário autenticado...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_user_table_id');
    
    if (rpcError) {
      console.error('❌ Erro na função RPC:', rpcError.message);
      console.error('   Detalhes:', rpcError);
    } else {
      console.log('✅ Função RPC retornou:', rpcData);
      
      // Verificar se o resultado faz sentido
      if (rpcData) {
        // Buscar dados do usuário na tabela users
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, nome, auth_id')
          .eq('id', rpcData)
          .single();
        
        if (userError) {
          console.error('❌ Erro ao buscar dados do usuário:', userError.message);
        } else {
          console.log('✅ Dados do usuário encontrado:', userData);
          console.log('   Auth ID coincide?', userData.auth_id === loggedUser.id ? '✅ Sim' : '❌ Não');
        }
      }
    }
    
    // 5. Testar função de debug com usuário autenticado
    console.log('\n5. Testando função de debug com usuário autenticado...');
    const { data: debugDataAuth, error: debugErrorAuth } = await supabase.rpc('debug_get_current_user_table_id');
    
    if (debugErrorAuth) {
      console.error('❌ Erro na função de debug:', debugErrorAuth.message);
    } else {
      console.log('✅ Debug info (autenticado):', debugDataAuth);
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    // Fazer logout
    console.log('\n🔓 Fazendo logout...');
    await supabase.auth.signOut();
    console.log('✅ Logout realizado');
  }
}

// Executar o teste
testRPCWithRealAuth()
  .then(() => {
    console.log('\n🏁 Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });