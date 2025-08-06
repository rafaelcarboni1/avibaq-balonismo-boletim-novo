const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMDQ3ODAsImV4cCI6MjA2Njg4MDc4MH0.wr15r6xgR0vAlnna2S7qs4RCLgWEPGqQZLq8jaW3BTw';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGetCurrentUserTableId() {
  console.log('🧪 Iniciando teste da função RPC get_current_user_table_id...');
  
  try {
    // 0. Primeiro, vamos verificar usuários existentes na tabela users
    console.log('\n0. Verificando usuários existentes na tabela users...');
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('id, email, nome, auth_id')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log('✅ Usuários encontrados:', existingUsers.length);
    existingUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.nome}) - auth_id: ${user.auth_id}`);
    });
    
    // Vamos tentar com o primeiro usuário que tem auth_id
    const userWithAuth = existingUsers.find(u => u.auth_id !== null);
    if (!userWithAuth) {
      console.error('❌ Nenhum usuário encontrado com auth_id válido');
      console.log('   Vamos testar a função RPC sem autenticação...');
      
      // Testar função RPC sem login
      console.log('\n1. Testando função RPC sem autenticação...');
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_user_table_id');
      
      if (rpcError) {
        console.error('❌ Erro na função RPC (sem auth):', rpcError.message);
        console.error('   Detalhes:', rpcError);
      } else {
        console.log('✅ Função RPC executada (sem auth):', rpcData);
      }
      return;
    }
    
    console.log(`\n   Usando usuário: ${userWithAuth.email} (auth_id: ${userWithAuth.auth_id})`);
    
    // 1. Simular autenticação usando service role para testar a função
    console.log('\n1. Testando função RPC com service role...');
    
    // Criar cliente com service role para testar
    const supabaseService = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs');
    
    // Testar a função RPC diretamente
    const { data: rpcData, error: rpcError } = await supabaseService.rpc('get_current_user_table_id');
    
    if (rpcError) {
      console.error('❌ Erro na função RPC:', rpcError.message);
      console.error('   Detalhes:', rpcError);
      return;
    }
    
    console.log('✅ Função RPC executada com sucesso');
    console.log('   Resultado:', rpcData);
    
    // 3. Verificar se retorna um ID válido
    console.log('\n3. Verificando se o ID é válido...');
    if (rpcData === null || rpcData === undefined) {
      console.error('❌ Função RPC retornou null/undefined');
      console.log('   Isso indica que o usuário não foi encontrado na tabela users');
    } else if (typeof rpcData === 'number' && rpcData > 0) {
      console.log('✅ ID válido retornado:', rpcData);
    } else {
      console.error('❌ ID inválido retornado:', rpcData);
    }
    
    // 2. Comparar com dados da tabela users
    console.log('\n2. Comparando com dados da tabela users...');
    console.log('✅ Usuário da tabela:', userWithAuth);
    console.log('   ID da tabela:', userWithAuth.id);
    console.log('   auth_id da tabela:', userWithAuth.auth_id);
    
    // Verificar se os IDs coincidem
    if (rpcData === userWithAuth.id) {
      console.log('✅ IDs coincidem perfeitamente!');
    } else {
      console.error('❌ IDs não coincidem!');
      console.log('   RPC retornou:', rpcData);
      console.log('   Tabela users ID:', userWithAuth.id);
    }
    
    // 3. Verificar se a função RPC existe
    console.log('\n3. Verificando se a função RPC existe no banco...');
    const { data: functionExists, error: funcError } = await supabaseService
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'get_current_user_table_id');
    
    if (funcError) {
      console.log('⚠️  Não foi possível verificar a existência da função:', funcError.message);
    } else if (functionExists && functionExists.length > 0) {
      console.log('✅ Função RPC existe no banco de dados');
    } else {
      console.error('❌ Função RPC não encontrada no banco de dados');
    }
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Executar o teste
testGetCurrentUserTableId()
  .then(() => {
    console.log('\n🏁 Teste concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });