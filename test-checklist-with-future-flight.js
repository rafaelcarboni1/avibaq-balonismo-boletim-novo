const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testChecklistWithFutureFlight() {
  console.log('🔍 TESTE DE CHECKLIST COM VOO FUTURO');
  console.log('===================================\n');

  try {
    // 1. Buscar um piloto
    console.log('1️⃣ Buscando piloto...');
    const { data: pilotos, error: pilotosError } = await supabase
      .from('users')
      .select('id, email, nome')
      .eq('role', 'piloto')
      .limit(1);

    if (pilotosError || !pilotos || pilotos.length === 0) {
      console.error('❌ Erro ao buscar pilotos:', pilotosError);
      return;
    }

    const piloto = pilotos[0];
    console.log(`✅ Piloto encontrado: ${piloto.nome || piloto.email} (${piloto.id})`);

    // 2. Buscar um balão
    console.log('\n2️⃣ Buscando balão...');
    const { data: baloes, error: baloesError } = await supabase
      .from('baloes')
      .select('id, prefixo, nome_batismo')
      .eq('ativo', true)
      .limit(1);

    if (baloesError || !baloes || baloes.length === 0) {
      console.error('❌ Erro ao buscar balões:', baloesError);
      return;
    }

    const balao = baloes[0];
    const nomeBalao = balao.nome_batismo || balao.prefixo;
    console.log(`✅ Balão encontrado: ${nomeBalao} (${balao.id})`);

    // 3. Buscar um membro piloto (tabela membros)
    console.log('\n3️⃣ Buscando membro piloto...');
    const { data: membros, error: membrosError } = await supabase
      .from('membros')
      .select('id, user_id, email')
      .eq('user_id', piloto.id)
      .limit(1);

    if (membrosError || !membros || membros.length === 0) {
      console.error('❌ Erro ao buscar membro piloto:', membrosError);
      return;
    }

    const membroPiloto = membros[0];
    console.log(`✅ Membro piloto encontrado: ${membroPiloto.email} (${membroPiloto.id})`);

    // 4. Criar um voo com data futura
    console.log('\n4️⃣ Criando voo com data futura...');
    const dataFutura = new Date();
    dataFutura.setDate(dataFutura.getDate() + 7); // 7 dias no futuro
    
    const { data: novoVoo, error: vooError } = await supabase
      .from('voos')
      .insert({
        piloto_id: membroPiloto.id,
        data_voo: dataFutura.toISOString().split('T')[0], // Apenas a data
        periodo: 'manha',
        horario_previsto: '08:00:00',
        local_decolagem_previsto: 'Campo de Teste',
        status: 'planejado',
        observacoes_planejamento: 'Voo de teste para checklist',
        created_by: piloto.id
      })
      .select()
      .single();

    if (vooError) {
      console.error('❌ Erro ao criar voo:', vooError);
      return;
    }

    console.log(`✅ Voo criado: ${novoVoo.id}`);
    console.log(`   Data: ${novoVoo.data_voo}`);
    console.log(`   Status: ${novoVoo.status}`);

    // 5. Associar balão ao voo
    console.log('\n5️⃣ Associando balão ao voo...');
    const { data: vooBalao, error: vooBalaoError } = await supabase
      .from('voos_baloes')
      .insert({
        voo_id: novoVoo.id,
        balao_id: balao.id,
        adultos_previstos: 2,
        criancas_previstas: 0
      })
      .select()
      .single();

    if (vooBalaoError) {
      console.error('❌ Erro ao associar balão:', vooBalaoError);
      return;
    }

    console.log(`✅ Balão associado ao voo: ${vooBalao.id}`);

    // 6. Criar itens de checklist para este voo
    console.log('\n6️⃣ Criando itens de checklist...');
    const itensParaCriar = [
      { bloco: 1, item_numero: 1, item_descricao: 'Verificar condições meteorológicas' },
      { bloco: 1, item_numero: 2, item_descricao: 'Inspeção visual do balão' },
      { bloco: 1, item_numero: 3, item_descricao: 'Verificar equipamentos de segurança' },
      { bloco: 2, item_numero: 1, item_descricao: 'Preparar queimador' },
      { bloco: 2, item_numero: 2, item_descricao: 'Verificar combustível' }
    ];

    const itensCreated = [];
    for (const item of itensParaCriar) {
      const { data: itemCreated, error: createError } = await supabase
        .from('checklist_itens')
        .insert({
          voo_id: novoVoo.id,
          bloco: item.bloco,
          item_numero: item.item_numero,
          item_descricao: item.item_descricao,
          marcado: false
        })
        .select()
        .single();

      if (createError) {
        console.error(`❌ Erro ao criar item ${item.item_numero}:`, createError);
      } else {
        console.log(`✅ Item ${item.bloco}.${item.item_numero} criado: ${item.item_descricao}`);
        itensCreated.push(itemCreated);
      }
    }

    // 7. Testar marcação de itens
    console.log('\n7️⃣ Testando marcação de itens...');
    if (itensCreated.length > 0) {
      const itemParaMarcar = itensCreated[0];
      console.log(`Marcando item: Bloco ${itemParaMarcar.bloco}.${itemParaMarcar.item_numero}`);
      
      const { data: itemMarcado, error: marcarError } = await supabase
        .from('checklist_itens')
        .update({
          marcado: true,
          marcado_em: new Date().toISOString(),
          marcado_por: piloto.id,
          preenchido_por: piloto.id
        })
        .eq('id', itemParaMarcar.id)
        .select()
        .single();

      if (marcarError) {
        console.error('❌ Erro ao marcar item:', marcarError);
        
        // Análise detalhada do erro
        if (marcarError.code === '23503') {
          console.log('⚠️ Erro de foreign key constraint!');
          console.log('   Verificando integridade referencial...');
          
          // Verificar se o usuário existe
          const { data: userCheck } = await supabase
            .from('users')
            .select('id')
            .eq('id', piloto.id)
            .single();
            
          console.log(`   Usuário ${piloto.id} existe: ${userCheck ? 'SIM' : 'NÃO'}`);
        }
      } else {
        console.log('✅ Item marcado com sucesso!');
        console.log(`   ID: ${itemMarcado.id}`);
        console.log(`   Marcado: ${itemMarcado.marcado}`);
        console.log(`   Marcado em: ${itemMarcado.marcado_em}`);
        console.log(`   Marcado por: ${itemMarcado.marcado_por}`);
        console.log(`   Preenchido por: ${itemMarcado.preenchido_por}`);
      }
    }

    // 8. Testar desmarcação
    console.log('\n8️⃣ Testando desmarcação...');
    const { data: itensMarcados, error: buscarMarcadosError } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('voo_id', novoVoo.id)
      .eq('marcado', true)
      .limit(1);

    if (buscarMarcadosError) {
      console.error('❌ Erro ao buscar itens marcados:', buscarMarcadosError);
    } else if (itensMarcados && itensMarcados.length > 0) {
      const itemParaDesmarcar = itensMarcados[0];
      console.log(`Desmarcando item: Bloco ${itemParaDesmarcar.bloco}.${itemParaDesmarcar.item_numero}`);
      
      const { data: itemDesmarcado, error: desmarcarError } = await supabase
        .from('checklist_itens')
        .update({
          marcado: false,
          marcado_em: null,
          marcado_por: null,
          motivo_nao_marcado: 'Teste de desmarcação automática'
        })
        .eq('id', itemParaDesmarcar.id)
        .select()
        .single();

      if (desmarcarError) {
        console.error('❌ Erro ao desmarcar item:', desmarcarError);
      } else {
        console.log('✅ Item desmarcado com sucesso!');
        console.log(`   Marcado: ${itemDesmarcado.marcado}`);
        console.log(`   Motivo: ${itemDesmarcado.motivo_nao_marcado}`);
      }
    } else {
      console.log('⚠️ Nenhum item marcado encontrado para desmarcar');
    }

    // 9. Verificar estado final
    console.log('\n9️⃣ Estado final dos itens...');
    const { data: estadoFinal, error: estadoFinalError } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('voo_id', novoVoo.id)
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

    // 🔟 URL para teste manual
    console.log('\n🔟 URL para teste manual:');
    console.log(`🌐 http://localhost:3000/piloto/checklist/${novoVoo.id}`);

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testChecklistWithFutureFlight();