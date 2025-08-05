import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function investigateMarcadoPorIssue() {
  console.log('🔍 INVESTIGANDO PROBLEMA DO MARCADO_POR');
  console.log('============================================');
  
  try {
    // 1. Fazer login como Igor
    console.log('\n[LOGIN] Fazendo login como Igor...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'igor_pk_@hotmail.com',
      password: 'igorniehues'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    console.log('Auth UID:', authData.user.id);
    
    // 2. Testar função RPC
    console.log('\n[RPC] Testando função get_current_user_table_id...');
    const { data: rpcResult, error: rpcError } = await supabase.rpc('get_current_user_table_id');
    
    if (rpcError) {
      console.error('❌ Erro na função RPC:', rpcError);
    } else {
      console.log('✅ Função RPC retornou:', rpcResult);
    }
    
    // 3. Verificar se o ID retornado pela RPC existe na tabela users
    if (rpcResult) {
      console.log('\n[USERS] Verificando se ID existe na tabela users...');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', rpcResult)
        .single();
      
      if (userError) {
        console.error('❌ Erro ao buscar usuário:', userError);
      } else {
        console.log('✅ Usuário encontrado na tabela users:', userData);
      }
    }
    
    // 4. Verificar o ID problemático específico
    const problematicId = '7e85dac4-7a9f-48d6-a073-e0aeb2a63b64';
    console.log('\n[PROBLEMA] Verificando ID problemático:', problematicId);
    
    const { data: problematicUser, error: problematicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', problematicId)
      .single();
    
    if (problematicError) {
      console.error('❌ ID problemático não encontrado:', problematicError);
      
      // Verificar se existe por auth_id
      console.log('\n[PROBLEMA] Verificando por auth_id...');
      const { data: byAuthId, error: authIdError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', problematicId);
      
      if (authIdError) {
        console.error('❌ Erro ao buscar por auth_id:', authIdError);
      } else {
        console.log('Resultados por auth_id:', byAuthId);
      }
    } else {
      console.log('✅ ID problemático encontrado:', problematicUser);
    }
    
    // 5. Listar todos os usuários para debug
    console.log('\n[DEBUG] Listando todos os usuários...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, auth_id, email, nome')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (allUsersError) {
      console.error('❌ Erro ao listar usuários:', allUsersError);
    } else {
      console.log('Usuários na tabela:');
      allUsers.forEach(user => {
        console.log(`  - ID: ${user.id}`);
        console.log(`    Auth ID: ${user.auth_id}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Nome: ${user.nome}`);
        console.log('');
      });
    }
    
    // 6. Verificar se há inconsistência entre auth.uid() e user_table_id
    console.log('\n[INCONSISTÊNCIA] Comparando auth.uid() com RPC result...');
    console.log('Auth UID:', authData.user.id);
    console.log('RPC Result:', rpcResult);
    console.log('São iguais?', authData.user.id === rpcResult);
    
    if (authData.user.id !== rpcResult) {
      console.log('⚠️  INCONSISTÊNCIA DETECTADA!');
      
      // Verificar se o auth.uid() existe como auth_id na tabela users
      const { data: authUidUser, error: authUidError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .single();
      
      if (authUidError) {
        console.error('❌ auth.uid() não encontrado como auth_id:', authUidError);
      } else {
        console.log('✅ auth.uid() encontrado como auth_id:', authUidUser);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar investigação
investigateMarcadoPorIssue().then(() => {
  console.log('\n🔍 Investigação concluída');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro na investigação:', error);
  process.exit(1);
});