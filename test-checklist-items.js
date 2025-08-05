const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testChecklistItems() {
  console.log('🔍 TESTE DE MARCAÇÃO/DESMARCAÇÃO DE ITENS DO CHECKLIST');
  console.log('====================================================\n');

  try {
    // 1. Buscar um voo com checklist
    console.log('1️⃣ Buscando voo com checklist...');
    const { data: voos, error: voosError } = await supabase
      .from('voos')
      .select('id, status, piloto_id')
      .in('status', ['planejado', 'checklist_bloco1', 'checklist_bloco2'])
      .limit(1);

    if (voosError || !voos || voos.length === 0) {
      console.error('❌ Erro ao buscar voos ou nenhum voo encontrado:', voosError);
      return;
    }

    const vooTeste = voos[0];
    console.log(`✅ Voo encontrado: ${vooTeste.id} - Status: ${vooTeste.status}`);

    // 2. Buscar itens do checklist para este voo
    console.log('\n2️⃣ Buscando itens do checklist...');
    const { data: itens, error: itensError } = await supabase
      .from('checklist_itens')
      .select('id, bloco, item_numero, item_descricao, marcado, marcado_por, preenchido_por')
      .eq('voo_id', vooTeste.id)
      .order('bloco')
      .order('item_numero')
      .limit(5);

    if (itensError) {
      console.error('❌ Erro ao buscar itens do checklist:', itensError);
      return;
    }

    if (!itens || itens.length === 0) {
      console.log('⚠️ Nenhum item de checklist encontrado. Criando itens de teste...');
      
      // Criar alguns itens de teste
      const itensParaCriar = [
        { bloco: 1, item_numero: 1, item_descricao: 'Verificar condições meteorológicas' },
        { bloco: 1, item_numero: 2, item_descricao: 'Inspeção visual do balão' },
        { bloco: 1, item_numero: 3, item_descricao: 'Verificar equipamentos de segurança' }
      ];

      for (const item of itensParaCriar) {
        const { error: createError } = await supabase
          .from('checklist_itens')
          .insert({
            voo_id: vooTeste.id,
            bloco: item.bloco,
            item_numero: item.item_numero,
            item_descricao: item.item_descricao,
            marcado: false
          });

        if (createError) {
          console.error(`❌ Erro ao criar item ${item.item_numero}:`, createError);
        } else {
          console.log(`✅ Item ${item.item_numero} criado: ${item.item_descricao}`);
        }
      }

      // Buscar itens novamente
      const { data: novosItens, error: novosItensError } = await supabase
        .from('checklist_itens')
        .select('id, bloco, item_numero, item_descricao, marcado, marcado_por, preenchido_por')
        .eq('voo_id', vooTeste.id)
        .order('bloco')
        .order('item_numero');

      if (novosItensError) {
        console.error('❌ Erro ao buscar novos itens:', novosItensError);
        return;
      }

      itens.push(...(novosItens || []));
    }

    console.log(`✅ Encontrados ${itens.length} itens do checklist`);
    itens.forEach(item => {
      console.log(`   - Bloco ${item.bloco}.${item.item_numero}: ${item.item_descricao} - Marcado: ${item.marcado}`);
    });

    // 3. Buscar um usuário piloto para usar nos testes
    console.log('\n3️⃣ Buscando usuário piloto...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nome')
      .eq('role', 'piloto')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ Erro ao buscar usuários piloto:', usersError);
      return;
    }

    const userTeste = users[0];
    console.log(`✅ Usuário piloto encontrado: ${userTeste.nome || userTeste.email} (${userTeste.id})`);

    // 4. Testar marcação de itens
    console.log('\n4️⃣ Testando marcação de itens...');
    const itemParaMarcar = itens.find(item => !item.marcado);
    
    if (itemParaMarcar) {
      console.log(`Marcando item: Bloco ${itemParaMarcar.bloco}.${itemParaMarcar.item_numero}`);
      
      const { data: itemMarcado, error: marcarError } = await supabase
        .from('checklist_itens')
        .update({
          marcado: true,
          marcado_em: new Date().toISOString(),
          marcado_por: userTeste.id,
          preenchido_por: userTeste.id
        })
        .eq('id', itemParaMarcar.id)
        .select()
        .single();

      if (marcarError) {
        console.error('❌ Erro ao marcar item:', marcarError);
        
        // Verificar se é erro de foreign key
        if (marcarError.code === '23503') {
          console.log('⚠️ Erro de foreign key constraint detectado!');
          console.log('   Isso indica problema de integridade referencial entre checklist_itens e users');
          
          // Verificar se o usuário existe na tabela users
          const { data: userCheck, error: userCheckError } = await supabase
            .from('users')
            .select('id')
            .eq('id', userTeste.id)
            .single();
            
          if (userCheckError || !userCheck) {
            console.log('❌ Usuário não encontrado na tabela users!');
          } else {
            console.log('✅ Usuário existe na tabela users');
          }
        }
      } else {
        console.log('✅ Item marcado com sucesso!');
        console.log(`   Marcado em: ${itemMarcado.marcado_em}`);
        console.log(`   Marcado por: ${itemMarcado.marcado_por}`);
        console.log(`   Preenchido por: ${itemMarcado.preenchido_por}`);
      }
    } else {
      console.log('⚠️ Todos os itens já estão marcados');
    }

    // 5. Testar desmarcação de itens
    console.log('\n5️⃣ Testando desmarcação de itens...');
    const itemParaDesmarcar = itens.find(item => item.marcado);
    
    if (itemParaDesmarcar) {
      console.log(`Desmarcando item: Bloco ${itemParaDesmarcar.bloco}.${itemParaDesmarcar.item_numero}`);
      
      const { data: itemDesmarcado, error: desmarcarError } = await supabase
        .from('checklist_itens')
        .update({
          marcado: false,
          marcado_em: null,
          marcado_por: null,
          motivo_nao_marcado: 'Teste de desmarcação'
        })
        .eq('id', itemParaDesmarcar.id)
        .select()
        .single();

      if (desmarcarError) {
        console.error('❌ Erro ao desmarcar item:', desmarcarError);
      } else {
        console.log('✅ Item desmarcado com sucesso!');
        console.log(`   Motivo: ${itemDesmarcado.motivo_nao_marcado}`);
      }
    } else {
      console.log('⚠️ Nenhum item marcado encontrado para desmarcar');
    }

    // 6. Verificar estado final
    console.log('\n6️⃣ Verificando estado final dos itens...');
    const { data: itensFinais, error: itensFinaisError } = await supabase
      .from('checklist_itens')
      .select('id, bloco, item_numero, marcado, marcado_por, preenchido_por, motivo_nao_marcado')
      .eq('voo_id', vooTeste.id)
      .order('bloco')
      .order('item_numero');

    if (itensFinaisError) {
      console.error('❌ Erro ao verificar estado final:', itensFinaisError);
    } else {
      console.log('✅ Estado final dos itens:');
      itensFinais.forEach(item => {
        const status = item.marcado ? 'MARCADO' : 'NÃO MARCADO';
        const motivo = item.motivo_nao_marcado ? ` (${item.motivo_nao_marcado})` : '';
        console.log(`   - Bloco ${item.bloco}.${item.item_numero}: ${status}${motivo}`);
        if (item.marcado) {
          console.log(`     Marcado por: ${item.marcado_por}, Preenchido por: ${item.preenchido_por}`);
        }
      });
    }

    console.log('\n✅ Teste de marcação/desmarcação concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testChecklistItems();