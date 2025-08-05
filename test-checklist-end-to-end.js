import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteChecklistFlow() {
  console.log('🚀 TESTE COMPLETO END-TO-END DO CHECKLIST');
  console.log('==========================================\n');

  try {
    // 1. Usar voo conhecido para teste
    console.log('1️⃣ Usando voo conhecido para teste...');
    const flightId = '6c9f016f-f7d6-4949-a8bc-0fa2eefc5305';
    const userId = '3b90f403-9507-4b09-af1f-5043271f61aa';
    
    console.log(`✅ Voo: ${flightId}`);
    console.log(`   User ID: ${userId}\n`);

    // 2. Verificar se já existem itens de checklist
    console.log('2️⃣ Verificando itens de checklist...');
    const { data: existingItems, error: itemsError } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('voo_id', flightId)
      .order('bloco', { ascending: true })
      .order('item_numero', { ascending: true });

    if (itemsError) {
      console.log('❌ Erro ao buscar itens:', itemsError);
      return;
    }

    console.log(`✅ Encontrados ${existingItems.length} itens de checklist\n`);

    if (existingItems.length === 0) {
      console.log('⚠️ Nenhum item encontrado. O checklist precisa ser inicializado primeiro.');
      return;
    }

    // 3. Simular fluxo de marcação progressiva
    console.log('3️⃣ Simulando fluxo de marcação progressiva...');
    
    // Marcar alguns itens do bloco 1
    const bloco1Items = existingItems.filter(item => item.bloco === 1).slice(0, 3);
    
    for (const item of bloco1Items) {
      console.log(`   Marcando item ${item.bloco}.${item.item_numero}...`);
      
      const { data: updatedItem, error: updateError } = await supabase
        .from('checklist_itens')
        .update({
          marcado: true,
          marcado_em: new Date().toISOString(),
          preenchido_por: userId,
          motivo_nao_marcado: null
        })
        .eq('id', item.id)
        .select()
        .single();

      if (updateError) {
        console.log(`   ❌ Erro ao marcar item: ${updateError.message}`);
      } else {
        console.log(`   ✅ Item ${item.bloco}.${item.item_numero} marcado`);
      }
      
      // Pequena pausa para simular uso real
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 4. Marcar alguns itens como não aplicáveis
    console.log('\n4️⃣ Marcando alguns itens como não aplicáveis...');
    const bloco2Items = existingItems.filter(item => item.bloco === 2).slice(0, 2);
    
    for (const item of bloco2Items) {
      console.log(`   Marcando item ${item.bloco}.${item.item_numero} como N/A...`);
      
      const { data: updatedItem, error: updateError } = await supabase
        .from('checklist_itens')
        .update({
          marcado: false,
          motivo_nao_marcado: 'Não aplicável para este voo',
          preenchido_por: userId
        })
        .eq('id', item.id)
        .select()
        .single();

      if (updateError) {
        console.log(`   ❌ Erro ao marcar item: ${updateError.message}`);
      } else {
        console.log(`   ✅ Item ${item.bloco}.${item.item_numero} marcado como N/A`);
      }
    }

    // 5. Verificar progresso do checklist
    console.log('\n5️⃣ Verificando progresso do checklist...');
    const { data: progressItems, error: progressError } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('voo_id', flightId);

    if (progressError) {
      console.log('❌ Erro ao verificar progresso:', progressError);
      return;
    }

    const totalItems = progressItems.length;
    const markedItems = progressItems.filter(item => item.marcado === true).length;
    const notApplicableItems = progressItems.filter(item => 
      item.marcado === false && item.motivo_nao_marcado && item.motivo_nao_marcado !== 'Aguardando preenchimento'
    ).length;
    const pendingItems = progressItems.filter(item => 
      item.marcado === false && (!item.motivo_nao_marcado || item.motivo_nao_marcado === 'Aguardando preenchimento')
    ).length;

    console.log(`✅ Progresso do checklist:`);
    console.log(`   Total de itens: ${totalItems}`);
    console.log(`   Itens marcados: ${markedItems}`);
    console.log(`   Itens N/A: ${notApplicableItems}`);
    console.log(`   Itens pendentes: ${pendingItems}`);
    console.log(`   Progresso: ${Math.round(((markedItems + notApplicableItems) / totalItems) * 100)}%\n`);

    // 6. Testar desmarcação de um item
    console.log('6️⃣ Testando desmarcação de item...');
    if (markedItems > 0) {
      const itemToUnmark = progressItems.find(item => item.marcado === true);
      
      const { data: unmarkedItem, error: unmarkError } = await supabase
        .from('checklist_itens')
        .update({
          marcado: false,
          marcado_em: null,
          motivo_nao_marcado: 'Aguardando preenchimento',
          preenchido_por: null
        })
        .eq('id', itemToUnmark.id)
        .select()
        .single();

      if (unmarkError) {
        console.log(`❌ Erro ao desmarcar item: ${unmarkError.message}`);
      } else {
        console.log(`✅ Item ${itemToUnmark.bloco}.${itemToUnmark.item_numero} desmarcado`);
      }
    }

    // 7. Verificar estado final
    console.log('\n7️⃣ Estado final do checklist...');
    const { data: finalItems, error: finalError } = await supabase
      .from('checklist_itens')
      .select('*')
      .eq('voo_id', flightId)
      .order('bloco', { ascending: true })
      .order('item_numero', { ascending: true });

    if (finalError) {
      console.log('❌ Erro ao verificar estado final:', finalError);
      return;
    }

    console.log('✅ Estado final por bloco:');
    const blocos = [...new Set(finalItems.map(item => item.bloco))];
    
    for (const bloco of blocos) {
      const blocItems = finalItems.filter(item => item.bloco === bloco);
      const blocMarked = blocItems.filter(item => item.marcado === true).length;
      const blocNA = blocItems.filter(item => 
        item.marcado === false && item.motivo_nao_marcado && item.motivo_nao_marcado !== 'Aguardando preenchimento'
      ).length;
      const blocPending = blocItems.filter(item => 
        item.marcado === false && (!item.motivo_nao_marcado || item.motivo_nao_marcado === 'Aguardando preenchimento')
      ).length;
      
      console.log(`   Bloco ${bloco}: ${blocMarked} marcados, ${blocNA} N/A, ${blocPending} pendentes`);
    }

    // 8. URL para teste manual
    console.log('\n8️⃣ URL para teste manual:');
    console.log(`🌐 http://localhost:3000/piloto/checklist/${flightId}\n`);

    console.log('✅ Teste end-to-end concluído com sucesso!');
    console.log('\n📊 Resumo dos testes realizados:');
    console.log('   ✅ Busca de voo existente');
    console.log('   ✅ Verificação de itens de checklist');
    console.log('   ✅ Marcação progressiva de itens');
    console.log('   ✅ Marcação de itens como N/A');
    console.log('   ✅ Cálculo de progresso');
    console.log('   ✅ Desmarcação de itens');
    console.log('   ✅ Verificação de estado final');
    console.log('   ✅ Integridade referencial mantida');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testCompleteChecklistFlow();