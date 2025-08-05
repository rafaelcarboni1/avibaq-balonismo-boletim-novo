const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://elcbodhxzvoqpzamgown.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2JvZGh4enZvcXB6YW1nb3duIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMwNDc4MCwiZXhwIjoyMDY2ODgwNzgwfQ.UfTwpvPuw4ffuPHS9UPBIMNYPOuSmde8WxnN4FXVSAs';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUsersMembros() {
  console.log('🔍 DEBUG: Relação Users <-> Membros');
  console.log('=====================================\n');

  try {
    // Buscar users pilotos
    console.log('1️⃣ Users com role piloto:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nome, role')
      .eq('role', 'piloto')
      .limit(5);

    if (usersError) {
      console.error('❌ Erro ao buscar users:', usersError);
      return;
    }

    users.forEach(user => {
      console.log(`   - ${user.email} (${user.id}) - ${user.nome || 'Sem nome'}`);
    });

    // Buscar membros
    console.log('\n2️⃣ Membros:');
    const { data: membros, error: membrosError } = await supabase
      .from('membros')
      .select('id, user_id, email')
      .limit(10);

    if (membrosError) {
      console.error('❌ Erro ao buscar membros:', membrosError);
      return;
    }

    membros.forEach(membro => {
      console.log(`   - ${membro.email} (${membro.id}) - user_id: ${membro.user_id}`);
    });

    // Verificar correspondência
    console.log('\n3️⃣ Verificando correspondência:');
    for (const user of users) {
      const membroCorrespondente = membros.find(m => m.user_id === user.id || m.email === user.email);
      if (membroCorrespondente) {
        console.log(`✅ User ${user.email} -> Membro ${membroCorrespondente.id}`);
      } else {
        console.log(`❌ User ${user.email} -> Nenhum membro correspondente`);
      }
    }

    // Tentar criar um voo com um membro existente
    console.log('\n4️⃣ Testando criação de voo:');
    const membroParaTeste = membros[0];
    if (membroParaTeste) {
      console.log(`Usando membro: ${membroParaTeste.email} (${membroParaTeste.id})`);
      
      const dataFutura = new Date();
      dataFutura.setDate(dataFutura.getDate() + 7);
      
      const { data: vooTeste, error: vooTesteError } = await supabase
        .from('voos')
        .insert({
          piloto_id: membroParaTeste.id,
          data_voo: dataFutura.toISOString().split('T')[0],
          periodo: 'manha',
          horario_previsto: '08:00:00',
          local_decolagem_previsto: 'Campo de Teste Debug',
          status: 'planejado',
          observacoes_planejamento: 'Voo de debug',
          created_by: membroParaTeste.user_id
        })
        .select()
        .single();

      if (vooTesteError) {
        console.error('❌ Erro ao criar voo de teste:', vooTesteError);
      } else {
        console.log(`✅ Voo de teste criado: ${vooTeste.id}`);
        console.log(`   URL: http://localhost:3000/piloto/checklist/${vooTeste.id}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugUsersMembros();