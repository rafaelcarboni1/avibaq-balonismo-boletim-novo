// Script para testar especificamente a página /associar-se
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testAssociarSeFlow() {
  console.log('🧪 TESTANDO FLUXO DA PÁGINA /ASSOCIAR-SE');
  console.log('==========================================');
  
  const testEmail = `teste.associacao.${Date.now()}@gmail.com`;
  const testPassword = 'senha123456';
  
  try {
    console.log('\n1. Simulando cadastro de novo piloto...');
    console.log('Email:', testEmail);
    
    // Passo 1: Criar usuário no Supabase Auth (como faz a página)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.log('❌ Erro no signUp:', authError.message);
      return;
    }
    
    console.log('✅ Usuário criado no Auth:', authData.user?.id);
    
    // Passo 2: Simular chamada para API create-user-profile
    console.log('\n2. Testando API create-user-profile...');
    
    const profileData = {
      userId: authData.user.id,
      nome: 'Teste Piloto',
      email: testEmail,
      role: 'piloto',
      username: testEmail.split('@')[0]
    };
    
    // Simular a API call
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: profileData.userId,
        nome: profileData.nome,
        email: profileData.email,
        role: profileData.role,
        username: profileData.username,
        auth_id: authData.user.id,
        primeira_senha: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao criar perfil:', profileError.message);
    } else {
      console.log('✅ Perfil criado na tabela users:', userProfile.id);
    }
    
    // Passo 3: Simular inserção na tabela membros
    console.log('\n3. Testando inserção na tabela membros...');
    
    const membroData = {
      nome_completo: 'Teste Piloto',
      email: testEmail,
      telefone: '11999999999',
      tipo: 'piloto',
      cpf: '12345678901',
      endereco: 'Rua Teste, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      user_id: userProfile?.id
    };
    
    const { data: membroCreated, error: membroError } = await supabaseAdmin
      .from('membros')
      .insert(membroData)
      .select()
      .single();
    
    if (membroError) {
      console.log('❌ Erro ao criar membro:', membroError.message);
    } else {
      console.log('✅ Membro criado:', membroCreated.id);
    }
    
    // Passo 4: Verificar se o usuário consegue fazer login
    console.log('\n4. Testando login do usuário criado...');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
    } else {
      console.log('✅ Login realizado com sucesso:', loginData.user.id);
      
      // Testar se o hook useUser funciona
      console.log('\n5. Testando busca de dados do usuário...');
      
      // Simular a função RPC get_current_user_table_id
      const { data: userTableId, error: rpcError } = await supabase
        .rpc('get_current_user_table_id');
      
      if (rpcError) {
        console.log('❌ Erro na RPC get_current_user_table_id:', rpcError.message);
      } else {
        console.log('✅ RPC retornou user_table_id:', userTableId);
      }
      
      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, role, nome, whatsapp_group_joined, whatsapp_modal_shown')
        .eq('email', testEmail)
        .single();
      
      if (userError) {
        console.log('❌ Erro ao buscar dados do usuário:', userError.message);
      } else {
        console.log('✅ Dados do usuário encontrados:', userData.nome);
      }
      
      // Logout
      await supabase.auth.signOut();
    }
    
    // Passo 5: Verificar integridade dos dados
    console.log('\n6. Verificando integridade dos dados criados...');
    
    const { data: finalUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    const { data: finalMembro } = await supabaseAdmin
      .from('membros')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(authData.user.id);
    
    console.log('📊 Verificação final:');
    console.log('- Auth user existe:', authUser.user ? '✅' : '❌');
    console.log('- Public user existe:', finalUser ? '✅' : '❌');
    console.log('- Membro existe:', finalMembro ? '✅' : '❌');
    console.log('- Auth_id sincronizado:', finalUser?.auth_id === authData.user.id ? '✅' : '❌');
    console.log('- User_id sincronizado:', finalMembro?.user_id === finalUser?.id ? '✅' : '❌');
    
    // Limpeza
    console.log('\n7. Limpando dados de teste...');
    
    if (membroCreated) {
      await supabaseAdmin.from('membros').delete().eq('id', membroCreated.id);
    }
    
    if (userProfile) {
      await supabaseAdmin.from('users').delete().eq('id', userProfile.id);
    }
    
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    
    console.log('✅ Limpeza concluída');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testAssociarSeFlow().then(() => {
  console.log('\n🏁 Teste da página /associar-se concluído');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});