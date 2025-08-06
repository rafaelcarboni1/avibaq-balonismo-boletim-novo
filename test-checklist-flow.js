const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testChecklistFlow() {
  console.log('🔍 TESTE DO FLUXO DO CHECKLIST');
  console.log('==============================\n');

  try {
    // 1. Verificar se existem membros pilotos
    console.log('1️⃣ Verificando membros pilotos...');
    const { data: pilotos, error: pilotosError } = await supabase
      .from('membros')
      .select('id, nome_completo, email, user_id')
      .eq('tipo', 'piloto')
      .eq('status', 'ativo')
      .limit(5);

    if (pilotosError) {
      console.error('❌ Erro ao buscar pilotos:', pilotosError);
      return;
    }

    console.log(`✅ Encontrados ${pilotos?.length || 0} pilotos ativos`);
    if (pilotos && pilotos.length > 0) {
      pilotos.forEach(piloto => {
        console.log(`   - ${piloto.nome_completo} (${piloto.email}) - user_id: ${piloto.user_id}`);
      });
    }

    // 2. Verificar se existem voos
    console.log('\n2️⃣ Verificando voos existentes...');
    const { data: voos, error: voosError } = await supabase
      .from('voos')
      .select('id, data_voo, status, piloto_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (voosError) {
      console.error('❌ Erro ao buscar voos:', voosError);
      return;
    }

    console.log(`✅ Encontrados ${voos?.length || 0} voos`);
    if (voos && voos.length > 0) {
      voos.forEach(voo => {
        console.log(`   - Voo ${voo.id.substring(0, 8)}... - ${voo.data_voo} - Status: ${voo.status}`);
      });
    }

    // 3. Verificar checklist_itens
    console.log('\n3️⃣ Verificando itens de checklist...');
    const { data: checklistItens, error: checklistError } = await supabase
      .from('checklist_itens')
      .select('id, voo_id, bloco, item_numero, marcado, created_by, marcado_por, preenchido_por')
      .limit(10);

    if (checklistError) {
      console.error('❌ Erro ao buscar checklist_itens:', checklistError);
      return;
    }

    console.log(`✅ Encontrados ${checklistItens?.length || 0} itens de checklist`);
    if (checklistItens && checklistItens.length > 0) {
      checklistItens.forEach(item => {
        console.log(`   - Item ${item.id.substring(0, 8)}... - Bloco ${item.bloco}.${item.item_numero} - Marcado: ${item.marcado}`);
        console.log(`     created_by: ${item.created_by}, marcado_por: ${item.marcado_por}, preenchido_por: ${item.preenchido_por}`);
      });
    }

    // 4. Verificar usuários na tabela users
    console.log('\n4️⃣ Verificando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, nome')
      .eq('role', 'piloto')
      .limit(5);

    if (usersError) {
      console.error('❌ Erro ao buscar users:', usersError);
      return;
    }

    console.log(`✅ Encontrados ${users?.length || 0} usuários piloto`);
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`   - ${user.nome || user.email} (${user.email}) - ID: ${user.id}`);
      });
    }

    // 5. Se não há voos, criar um voo de teste
    if (!voos || voos.length === 0) {
      console.log('\n5️⃣ Criando voo de teste...');
      
      if (!pilotos || pilotos.length === 0) {
        console.log('❌ Não é possível criar voo - nenhum piloto encontrado');
        return;
      }

      const pilotoTeste = pilotos[0];
      const dataVoo = new Date();
      dataVoo.setDate(dataVoo.getDate() + 1); // Amanhã

      const { data: novoVoo, error: vooError } = await supabase
        .from('voos')
        .insert({
          piloto_id: pilotoTeste.id,
          data_voo: dataVoo.toISOString().split('T')[0],
          periodo: 'manha',
          horario_previsto: '08:00:00',
          local_decolagem_previsto: 'Campo de Teste',
          adultos_previstos: 2,
          criancas_previstas: 0,
          status: 'planejado',
          observacoes_planejamento: 'Voo de teste para checklist',
          created_by: pilotoTeste.user_id
        })
        .select()
        .single();

      if (vooError) {
        console.error('❌ Erro ao criar voo de teste:', vooError);
        return;
      }

      console.log(`✅ Voo de teste criado: ${novoVoo.id}`);
      console.log(`   Data: ${novoVoo.data_voo}`);
      console.log(`   Piloto: ${pilotoTeste.nome_completo}`);
      console.log(`   Status: ${novoVoo.status}`);
      
      // Testar acesso ao checklist
      console.log(`\n🔗 URL para testar checklist: http://localhost:3000/piloto/checklist/${novoVoo.id}`);
    } else {
      // Usar voo existente para teste
      const vooTeste = voos[0];
      console.log(`\n🔗 URL para testar checklist: http://localhost:3000/piloto/checklist/${vooTeste.id}`);
    }

    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testChecklistFlow();