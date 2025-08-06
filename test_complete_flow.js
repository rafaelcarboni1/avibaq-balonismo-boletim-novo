// Script para testar o fluxo completo: cadastro → login → acesso ao checklist
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteFlow() {
  console.log('🚀 TESTE COMPLETO DO FLUXO');
  console.log('==========================');
  
  const testEmail = `piloto.teste.${Date.now()}@gmail.com`;
  const testPassword = 'senha123456';
  let authUserId, userId, membroId, vooId;
  
  try {
    // 1. CADASTRO - Simular página /associar-se
    console.log('\n1. 📝 CADASTRO DE NOVO PILOTO');
    console.log('Email:', testEmail);
    
    // Criar usuário no Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });
    
    if (authError) {
      console.log('❌ Erro no cadastro Auth:', authError.message);
      return;
    }
    
    authUserId = authData.user.id;
    console.log('✅ Usuário criado no Auth:', authUserId);
    
    // Criar perfil na tabela users
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUserId,
        nome: 'Piloto Teste Completo',
        email: testEmail,
        role: 'piloto',
        username: testEmail.split('@')[0],
        auth_id: authUserId,
        primeira_senha: false
      })
      .select()
      .single();
    
    if (profileError) {
      console.log('❌ Erro ao criar perfil:', profileError.message);
      return;
    }
    
    userId = userProfile.id;
    console.log('✅ Perfil criado na tabela users:', userId);
    
    // Criar membro
    const { data: membro, error: membroError } = await supabaseAdmin
      .from('membros')
      .insert({
        nome_completo: 'Piloto Teste Completo',
        email: testEmail,
        telefone: '11999999999',
        tipo: 'piloto',
        cpf: '12345678901',
        user_id: userId,
        status: 'ativo'
      })
      .select()
      .single();
    
    if (membroError) {
      console.log('❌ Erro ao criar membro:', membroError.message);
      return;
    }
    
    membroId = membro.id;
    console.log('✅ Membro criado:', membroId);
    
    // 2. LOGIN - Simular login do usuário
    console.log('\n2. 🔐 LOGIN DO USUÁRIO');
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.log('❌ Erro no login:', loginError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso:', loginData.user.id);
    
    // Testar hook useUser
    const { data: userTableId, error: rpcError } = await supabase
      .rpc('get_current_user_table_id');
    
    if (rpcError) {
      console.log('❌ Erro na RPC get_current_user_table_id:', rpcError.message);
      console.log('   Detalhes do erro:', rpcError);
    } else {
      console.log('✅ RPC retornou user_table_id:', userTableId);
    }
    
    // 3. CRIAR VOO PARA TESTE
    console.log('\n3. ✈️  CRIANDO VOO PARA TESTE');
    
    const { data: voo, error: vooError } = await supabaseAdmin
      .from('voos')
      .insert({
        data_voo: new Date().toISOString().split('T')[0],
        piloto_id: membroId,
        periodo: 'manha',
        local_decolagem_previsto: 'Campo de Teste',
        adultos_previstos: 2,
        criancas_previstas: 0,
        status: 'planejado',
        created_by: userId
      })
      .select()
      .single();
    
    if (vooError) {
      console.log('❌ Erro ao criar voo:', vooError.message);
      return;
    }
    
    vooId = voo.id;
    console.log('✅ Voo criado:', vooId);
    
    // 4. ACESSO AO CHECKLIST
    console.log('\n4. ✅ TESTANDO ACESSO AO CHECKLIST');
    
    // Simular busca do piloto (como faz a página do checklist)
    const { data: pilotoData, error: pilotoError } = await supabase
      .from('membros')
      .select('*')
      .eq('user_id', userTableId)
      .eq('tipo', 'piloto')
      .single();
    
    if (pilotoError) {
      console.log('❌ Erro ao buscar piloto:', pilotoError.message);
      
      // Tentar busca por email como fallback
      const { data: pilotoByEmail, error: emailError } = await supabase
        .from('membros')
        .select('*')
        .eq('email', testEmail)
        .eq('tipo', 'piloto')
        .single();
      
      if (emailError) {
        console.log('❌ Erro ao buscar piloto por email:', emailError.message);
      } else {
        console.log('✅ Piloto encontrado por email:', pilotoByEmail.nome_completo);
      }
    } else {
      console.log('✅ Piloto encontrado por user_id:', pilotoData.nome_completo);
    }
    
    // Buscar voos do piloto
    const { data: voosData, error: voosError } = await supabase
      .from('voos')
      .select(`
        *,
        voos_baloes(
          balao_id,
          baloes(
            id,
            prefixo,
            volume_m3
          )
        )
      `)
      .eq('piloto_id', membroId)
      .order('data_voo', { ascending: false });
    
    if (voosError) {
      console.log('❌ Erro ao buscar voos:', voosError.message);
    } else {
      console.log(`✅ Encontrados ${voosData.length} voos do piloto`);
    }
    
    // Testar criação automática de itens do checklist
    console.log('\n5. 📋 TESTANDO CRIAÇÃO DE ITENS DO CHECKLIST');
    
    // Verificar se já existem itens para este voo
    const { data: existingItems, error: itemsError } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('voo_id', vooId);
    
    if (itemsError) {
      console.log('❌ Erro ao buscar itens existentes:', itemsError.message);
    } else {
      console.log(`📊 Itens existentes: ${existingItems.length}`);
      
      if (existingItems.length === 0) {
        console.log('🔧 Criando itens do checklist...');
        
        // Simular criação dos itens (como faz a página)
        const checklistItems = [
          // Bloco 1 - Pré-voo
          { bloco: 1, item_numero: 1, item_descricao: 'Verificação meteorológica' },
          { bloco: 1, item_numero: 2, item_descricao: 'Inspeção visual do balão' },
          { bloco: 1, item_numero: 3, item_descricao: 'Verificação dos equipamentos' },
          // Bloco 2 - Durante o voo
          { bloco: 2, item_numero: 1, item_descricao: 'Comunicação com torre' },
          { bloco: 2, item_numero: 2, item_descricao: 'Monitoramento de altitude' },
          // Bloco 3 - Pós-voo
          { bloco: 3, item_numero: 1, item_descricao: 'Inspeção pós-voo' },
          { bloco: 3, item_numero: 2, item_descricao: 'Armazenamento do equipamento' }
        ];
        
        const itemsToInsert = checklistItems.map(item => ({
          voo_id: vooId,
          bloco: item.bloco,
          item_numero: item.item_numero,
          item_descricao: item.item_descricao,
          created_by: userId
        }));
        
        const { data: createdItems, error: createError } = await supabaseAdmin
          .from('checklist_itens')
          .insert(itemsToInsert)
          .select();
        
        if (createError) {
          console.log('❌ Erro ao criar itens:', createError.message);
        } else {
          console.log(`✅ Criados ${createdItems.length} itens do checklist`);
        }
      }
    }
    
    // 6. TESTAR MARCAÇÃO DE ITEM
    console.log('\n6. ✏️  TESTANDO MARCAÇÃO DE ITEM');
    
    const { data: itemsToMark, error: markError } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('voo_id', vooId)
      .limit(1);
    
    if (markError) {
      console.log('❌ Erro ao buscar item para marcar:', markError.message);
    } else if (itemsToMark.length > 0) {
      const item = itemsToMark[0];
      
      const { error: updateError } = await supabase
        .from('checklist_itens')
        .update({
          marcado: true,
          marcado_em: new Date().toISOString(),
          marcado_por: userTableId,
          observacoes: 'Teste de marcação automática'
        })
        .eq('id', item.id);
      
      if (updateError) {
        console.log('❌ Erro ao marcar item:', updateError.message);
      } else {
        console.log('✅ Item marcado com sucesso:', item.item_descricao);
      }
    }
    
    // 7. VERIFICAÇÃO FINAL
    console.log('\n7. 🔍 VERIFICAÇÃO FINAL');
    
    const { data: finalCheck } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('voo_id', vooId);
    
    const totalItems = finalCheck?.length || 0;
    const markedItems = finalCheck?.filter(item => item.marcado).length || 0;
    
    console.log(`📊 Estatísticas do checklist:`);
    console.log(`- Total de itens: ${totalItems}`);
    console.log(`- Itens marcados: ${markedItems}`);
    console.log(`- Progresso: ${totalItems > 0 ? Math.round((markedItems / totalItems) * 100) : 0}%`);
    
    // Logout
    await supabase.auth.signOut();
    console.log('✅ Logout realizado');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    // Limpeza
    console.log('\n8. 🧹 LIMPEZA DOS DADOS DE TESTE');
    
    try {
      if (vooId) {
        // Remover itens do checklist
        await supabaseAdmin.from('checklist_itens').delete().eq('voo_id', vooId);
        // Remover voo
        await supabaseAdmin.from('voos').delete().eq('id', vooId);
        console.log('✅ Voo e itens removidos');
      }
      
      if (membroId) {
        await supabaseAdmin.from('membros').delete().eq('id', membroId);
        console.log('✅ Membro removido');
      }
      
      if (userId) {
        await supabaseAdmin.from('users').delete().eq('id', userId);
        console.log('✅ Usuário removido');
      }
      
      if (authUserId) {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        console.log('✅ Auth user removido');
      }
    } catch (cleanupError) {
      console.log('⚠️  Erro na limpeza:', cleanupError.message);
    }
  }
}

// Executar teste
testCompleteFlow().then(() => {
  console.log('\n🏁 TESTE COMPLETO FINALIZADO');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});