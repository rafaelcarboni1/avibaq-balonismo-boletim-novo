// Script para testar o fluxo de associação
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configurações:');
console.log('URL:', supabaseUrl ? '✅' : '❌');
console.log('ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
console.log('SERVICE_KEY:', supabaseServiceKey ? '✅' : '❌');

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAssociacaoFlow() {
  console.log('🔍 TESTANDO FLUXO DE ASSOCIAÇÃO');
  console.log('================================');
  
  try {
    // 1. Verificar estrutura das tabelas
    console.log('\n1. Verificando estrutura das tabelas...');
    
    const { data: membros, error: membrosError } = await supabaseAdmin
      .from('membros')
      .select('*')
      .limit(1);
    
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1);
    
    console.log('✅ Tabela membros:', membros ? 'OK' : 'ERRO');
    console.log('✅ Tabela users:', users ? 'OK' : 'ERRO');
    
    if (membrosError) console.log('❌ Erro membros:', membrosError.message);
    if (usersError) console.log('❌ Erro users:', usersError.message);
    
    // 2. Testar criação de usuário no Auth
    console.log('\n2. Testando criação no Supabase Auth...');
    
    const testEmail = `teste_${Date.now()}@example.com`;
    const testPassword = 'senha123456';
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ Erro ao criar usuário no Auth:', authError.message);
      return;
    }
    
    console.log('✅ Usuário criado no Auth:', authUser.user.id);
    
    // 3. Testar criação na tabela users
    console.log('\n3. Testando criação na tabela users...');
    
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: testEmail,
        nome: 'Teste Usuario',
        role: 'piloto',
        auth_id: authUser.user.id
      })
      .select()
      .single();
    
    if (userError) {
      console.log('❌ Erro ao criar na tabela users:', userError.message);
    } else {
      console.log('✅ Usuário criado na tabela users:', newUser.id);
    }
    
    // 4. Testar criação na tabela membros
    console.log('\n4. Testando criação na tabela membros...');
    
    const { data: newMembro, error: membroError } = await supabaseAdmin
      .from('membros')
      .insert({
        nome_completo: 'Teste Usuario',
        email: testEmail,
        telefone: '11999999999',
        tipo: 'piloto',
        user_id: newUser?.id
      })
      .select()
      .single();
    
    if (membroError) {
      console.log('❌ Erro ao criar na tabela membros:', membroError.message);
    } else {
      console.log('✅ Membro criado na tabela membros:', newMembro.id);
    }
    
    // 5. Verificar sincronização
    console.log('\n5. Verificando sincronização das tabelas...');
    
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const { data: publicUsers } = await supabaseAdmin.from('users').select('*');
    const { data: membrosData } = await supabaseAdmin.from('membros').select('*');
    
    console.log('📊 Total auth.users:', authUsers.users.length);
    console.log('📊 Total public.users:', publicUsers?.length || 0);
    console.log('📊 Total membros:', membrosData?.length || 0);
    
    // 6. Verificar usuários órfãos
    console.log('\n6. Verificando usuários órfãos...');
    
    const { data: orphanUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, auth_id')
      .is('auth_id', null);
    
    const { data: orphanMembros } = await supabaseAdmin
      .from('membros')
      .select('id, email, user_id')
      .is('user_id', null);
    
    console.log('⚠️  Users sem auth_id:', orphanUsers?.length || 0);
    console.log('⚠️  Membros sem user_id:', orphanMembros?.length || 0);
    
    if (orphanUsers?.length > 0) {
      console.log('Usuários órfãos:', orphanUsers.map(u => u.email));
    }
    
    if (orphanMembros?.length > 0) {
      console.log('Membros órfãos:', orphanMembros.map(m => m.email));
    }
    
    // 7. Limpeza - remover usuário de teste
    console.log('\n7. Limpando dados de teste...');
    
    if (newMembro) {
      await supabaseAdmin.from('membros').delete().eq('id', newMembro.id);
    }
    
    if (newUser) {
      await supabaseAdmin.from('users').delete().eq('id', newUser.id);
    }
    
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    
    console.log('✅ Limpeza concluída');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testAssociacaoFlow().then(() => {
  console.log('\n🏁 Teste concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});