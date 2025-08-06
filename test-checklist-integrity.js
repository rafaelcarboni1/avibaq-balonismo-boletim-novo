const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testChecklistIntegrity() {
  console.log('🔍 TESTE DE INTEGRIDADE REFERENCIAL DO CHECKLIST');
  console.log('===============================================\n');

  try {
    // 1. Usar o voo criado no teste anterior
    const vooId = '6c9f016f-f7d6-4949-a8bc-0fa2eefc5305';
    console.log(`1️⃣ Usando voo: ${vooId}`);

    // 2. Verificar se o voo existe
    const { data: voo, error: vooError } = await supabase
      .from('voos')
      .select('id, piloto_id, data_voo, status')
      .eq('id', vooId)
      .single();

    if (vooError || !voo) {
      console.error('❌ Voo não encontrado:', vooError);
      return;
    }

    console.log(`✅ Voo encontrado: ${voo.id} - Status: ${voo.status}`);
    console.log(`   Data: ${voo.data_voo}`);
    console.log(`   Piloto ID: ${voo.piloto_id}`);

    // 3. Buscar o membro piloto
    const { data: membro, error: membroError } = await supabase
      .from('membros')
      .select('id, user_id, email')
      .eq('id', voo.piloto_id)
      .single();

    if (membroError || !membro) {
      console.error('❌ Membro piloto não encontrado:', membroError);
      return;
    }

    console.log(`✅ Membro piloto: ${membro.email} (${membro.id})`);
    console.log(`   User ID: ${membro.user_id}`);

    // 4. Verificar se o user_id do membro existe na tabela users
    let userValido = null;
    if (membro.user_id) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', membro.user_id)
        .single();

      if (userError) {
        console.log(`⚠️ User ID ${membro.user_id} não encontrado na tabela users`);
      } else {
        console.log(`✅ User válido: ${user.email} (${user.id}) - Role: ${user.role}`);
        userValido = user;
      }
    } else {
      console.log('⚠️ Membro não tem user_id associado');
    }

    // 5. Verificar itens de checklist existentes
    console.log('\n2️⃣ Verificando itens de checklist existentes...');
    
    // Buscar itens existentes para este voo
    const { data: itensCreated, error: itemsError } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('voo_id', vooId)
      .order('bloco', { ascending: true })
      .order('item_numero', { ascending: true });
      
    if (itemsError) {
      console.log('❌ Erro ao buscar itens:', itemsError);
      return;
    }
    
    console.log(`✅ Encontrados ${itensCreated.length} itens existentes`);
    itensCreated.forEach(item => {
      console.log(`   - Bloco ${item.bloco}.${item.item_numero}: ${item.item_descricao}`);
    });

    // 6. Testar marcação com user_id válido
    console.log('\n3️⃣ Testando marcação com integridade referencial...');
    if (itensCreated.length > 0 && userValido) {
      const itemParaMarcar = itensCreated[0];
      console.log(`Marcando item: Bloco ${itemParaMarcar.bloco}.${itemParaMarcar.item_numero}`);
      console.log(`Usando user_id: ${userValido.id}`);
      
      const { data: itemMarcado, error: marcarError } = await supabase
        .from('checklist_itens')
        .update({
          marcado: true,
          marcado_em: new Date().toISOString(),
          marcado_por: userValido.id,
          preenchido_por: userValido.id
        })
        .eq('id', itemParaMarcar.id)
        .select()
        .single();

      if (marcarError) {
        console.error('❌ Erro ao marcar item:', marcarError);
        
        // Análise detalhada do erro
        if (marcarError.code === '23503') {
          console.log('⚠️ Erro de foreign key constraint!');
          console.log('   Isso confirma problema de integridade referencial');
          
          // Verificar novamente se o usuário existe
          const { data: userRecheck } = await supabase
            .from('users')
            .select('id')
            .eq('id', userValido.id)
            .single();
            
          console.log(`   User ${userValido.id} existe: ${userRecheck ? 'SIM' : 'NÃO'}`);
        }
      } else {
        console.log('✅ Item marcado com sucesso!');
        console.log(`   ID: ${itemMarcado.id}`);
        console.log(`   Marcado: ${itemMarcado.marcado}`);
        console.log(`   Marcado em: ${itemMarcado.marcado_em}`);
        console.log(`   Marcado por: ${itemMarcado.marcado_por}`);
        console.log(`   Preenchido por: ${itemMarcado.preenchido_por}`);
      }
    } else {
      console.log('⚠️ Não foi possível testar marcação (sem itens ou user inválido)');
    }

    // 7. Testar marcação com user_id inválido
    console.log('\n4️⃣ Testando marcação com user_id inválido...');
    if (itensCreated.length > 1) {
      const itemParaMarcar = itensCreated[1];
      const userIdInvalido = '00000000-0000-0000-0000-000000000000';
      
      console.log(`Tentando marcar item com user_id inválido: ${userIdInvalido}`);
      
      const { data: itemMarcado, error: marcarError } = await supabase
        .from('checklist_itens')
        .update({
          marcado: true,
          marcado_em: new Date().toISOString(),
          marcado_por: userIdInvalido,
          preenchido_por: userIdInvalido
        })
        .eq('id', itemParaMarcar.id)
        .select()
        .single();

      if (marcarError) {
        console.log('✅ Erro esperado capturado:', marcarError.message);
        if (marcarError.code === '23503') {
          console.log('✅ Foreign key constraint funcionando corretamente!');
        }
      } else {
        console.log('❌ PROBLEMA: Marcação com user_id inválido foi aceita!');
      }
    }

    // 8. Verificar estado final
    console.log('\n5️⃣ Estado final dos itens...');
    const { data: estadoFinal, error: estadoFinalError } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('voo_id', vooId)
      .order('bloco')
      .order('item_numero');

    if (estadoFinalError) {
      console.error('❌ Erro ao verificar estado final:', estadoFinalError);
    } else {
      console.log('✅ Estado final:');
      estadoFinal.forEach(item => {
        const status = item.marcado ? 'MARCADO' : 'NÃO MARCADO';
        const detalhes = item.marcado 
          ? `(por: ${item.marcado_por} em ${item.marcado_em})`
          : item.motivo_nao_marcado 
            ? `(${item.motivo_nao_marcado})`
            : '';
        console.log(`   - Bloco ${item.bloco}.${item.item_numero}: ${status} ${detalhes}`);
      });
    }

    // 9. URL para teste manual
    console.log('\n6️⃣ URL para teste manual:');
    console.log(`🌐 http://localhost:3000/piloto/checklist/${vooId}`);

    console.log('\n✅ Teste de integridade referencial concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testChecklistIntegrity();