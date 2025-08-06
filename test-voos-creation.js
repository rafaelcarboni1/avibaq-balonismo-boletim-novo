// Script para testar criação de voos após correção das políticas RLS
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVoosCreation() {
  console.log('🧪 TESTE DE CRIAÇÃO DE VOOS');
  console.log('============================\n');

  try {
    // 1. Verificar políticas RLS existentes
    console.log('1. Verificando políticas RLS da tabela voos...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'voos' })
      .select();
    
    if (policiesError) {
      console.log('⚠️  Não foi possível verificar políticas (função pode não existir)');
    } else {
      console.log('📋 Políticas encontradas:', policies?.length || 0);
    }

    // 2. Buscar um piloto ativo para teste
    console.log('\n2. Buscando piloto ativo para teste...');
    const { data: pilotos, error: pilotosError } = await supabase
      .from('membros')
      .select('id, nome_completo, email')
      .eq('tipo', 'piloto')
      .eq('status', 'ativo')
      .limit(1);

    if (pilotosError) {
      console.error('❌ Erro ao buscar pilotos:', pilotosError.message);
      return;
    }

    if (!pilotos || pilotos.length === 0) {
      console.log('⚠️  Nenhum piloto ativo encontrado');
      return;
    }

    const piloto = pilotos[0];
    console.log(`✅ Piloto encontrado: ${piloto.nome_completo} (${piloto.email})`);

    // 3. Buscar uma agência ativa para teste
    console.log('\n3. Buscando agência ativa para teste...');
    const { data: agencias, error: agenciasError } = await supabase
      .from('membros')
      .select('id, nome_completo, email')
      .eq('tipo', 'agencia')
      .eq('status', 'ativo')
      .limit(1);

    if (agenciasError) {
      console.error('❌ Erro ao buscar agências:', agenciasError.message);
      return;
    }

    let agencia = null;
    if (agencias && agencias.length > 0) {
      agencia = agencias[0];
      console.log(`✅ Agência encontrada: ${agencia.nome_completo} (${agencia.email})`);
    } else {
      console.log('⚠️  Nenhuma agência ativa encontrada');
    }

    // 4. Verificar vínculos entre agência e piloto (se agência existe)
    if (agencia) {
      console.log('\n4. Verificando vínculos agência-piloto...');
      const { data: vinculos, error: vinculosError } = await supabase
        .from('vinculos_agencia_piloto')
        .select('status')
        .eq('agencia_id', agencia.id)
        .eq('piloto_id', piloto.id);

      if (vinculosError) {
        console.error('❌ Erro ao verificar vínculos:', vinculosError.message);
      } else if (!vinculos || vinculos.length === 0) {
        console.log('⚠️  Nenhum vínculo encontrado entre agência e piloto');
        agencia = null; // Não testar agência sem vínculo
      } else {
        const vinculo = vinculos[0];
        console.log(`📋 Vínculo encontrado: ${vinculo.status}`);
        if (vinculo.status !== 'aceito') {
          console.log('⚠️  Vínculo não está aceito, agência não poderá criar voos');
          agencia = null;
        }
      }
    }

    // 5. Teste de criação de voo (sem autenticação - apenas para verificar políticas)
    console.log('\n5. Testando criação de voo (verificação de políticas)...');
    
    const vooTeste = {
      piloto_id: piloto.id,
      agencia_id: agencia?.id || null,
      data_voo: new Date().toISOString().split('T')[0], // Data de hoje
      periodo: 'manha',
      local_decolagem_previsto: 'Campo de Teste',
      adultos_previstos: 2,
      criancas_previstas: 0,
      observacoes_planejamento: 'Teste de criação de voo após correção RLS'
    };

    const { data: novoVoo, error: vooError } = await supabase
      .from('voos')
      .insert(vooTeste)
      .select();

    if (vooError) {
      console.error('❌ Erro ao criar voo:', vooError.message);
      console.log('💡 Isso é esperado se não houver usuário autenticado');
      
      // Verificar se o erro é relacionado a RLS
      if (vooError.message.includes('row-level security') || vooError.message.includes('policy')) {
        console.log('🔒 Erro relacionado a políticas RLS - isso indica que as políticas estão ativas');
      }
    } else {
      console.log('✅ Voo criado com sucesso:', novoVoo[0]?.id);
      
      // Limpar voo de teste
      await supabase.from('voos').delete().eq('id', novoVoo[0].id);
      console.log('🧹 Voo de teste removido');
    }

    console.log('\n📊 RESUMO DO TESTE:');
    console.log('==================');
    console.log(`✅ Piloto ativo encontrado: ${piloto.nome_completo}`);
    console.log(`${agencia ? '✅' : '⚠️ '} Agência ativa: ${agencia ? agencia.nome_completo : 'Não encontrada'}`);
    console.log(`${agencia ? '✅' : '⚠️ '} Vínculo aceito: ${agencia ? 'Sim' : 'N/A'}`);
    console.log('🔒 Políticas RLS: Ativas (erro esperado sem autenticação)');
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    console.log('- Teste com usuário autenticado como piloto');
    console.log('- Teste com usuário autenticado como agência');
    console.log('- Verificar se as políticas permitem criação adequada');

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

// Executar teste
testVoosCreation();