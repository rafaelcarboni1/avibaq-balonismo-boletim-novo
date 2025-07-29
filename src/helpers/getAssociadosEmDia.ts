import { supabase } from "../integrations/supabase/client";

export async function getAssociadosEmDia() {
  console.log("🚀 [SOLUÇÃO DEFINITIVA] Iniciando busca de associados em dia...");

  try {
    // PRIMEIRO: Verificar quantos membros existem - TESTE DE ACESSO MAIS BÁSICO
    console.log("🔧 TESTE DE ACESSO AO BANCO:");
    
    // Teste 1: Apenas count sem dados sensíveis
    const { count, error: errorCount } = await supabase
      .from("membros")
      .select("*", { count: 'exact', head: true });
    
    console.log("   - Teste count:", { count, error: errorCount?.message });
    
    // Teste 2: Buscar dados básicos
    const { data: todosMembros, error: erroTodos } = await supabase
      .from("membros")
      .select("id, nome_completo, tipo, status")
      .limit(5);

    console.log("   - Teste select básico:", { 
      count: todosMembros?.length || 0, 
      error: erroTodos?.message,
      amostra: todosMembros?.map(m => ({ nome: m.nome_completo, status: m.status })) || []
    });

    // Teste 3: Buscar com todas as colunas que você usa
    const { data: membrosCompletos, error: erroCompleto } = await supabase
      .from("membros")
      .select("nome_completo, tipo, status, mensalidades_pagas, ultima_mensalidade, pagamento_inscricao")
      .limit(3);

    console.log("   - Teste com mensalidades_pagas:", { 
      count: membrosCompletos?.length || 0, 
      error: erroCompleto?.message,
      primeiroMembro: membrosCompletos?.[0] || null
    });

    if (erroTodos) {
      console.error("❌ Erro ao buscar todos os membros:", erroTodos);
      return [];
    }

    console.log("🔍 DIAGNÓSTICO COMPLETO:");
    console.log("   - Total de membros na tabela:", todosMembros?.length || 0);
    
    if (todosMembros && todosMembros.length > 0) {
      const statusCount = todosMembros.reduce((acc: any, m: any) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
      }, {});
      console.log("   - Membros por status:", statusCount);
      console.log("   - Amostra dos primeiros 3 membros:", todosMembros.slice(0, 3).map(m => ({
        nome: m.nome_completo,
        status: m.status,
        tipo: m.tipo,
        pagamento: m.pagamento_inscricao
      })));
    }

    // SEGUNDO: Buscar especificamente membros ativos
    const { data, error } = await supabase
      .from("membros")
      .select("nome_completo, tipo, status, mensalidades_pagas, ultima_mensalidade, pagamento_inscricao, created_at")
      .eq("status", "ativo");

    if (error) {
      console.error("❌ Erro ao buscar membros ativos:", error);
    }

    console.log("📊 Total membros ativos (status='ativo'):", data?.length || 0);
    
    // COMO VOCÊ USA mensalidades_pagas: buscar TODOS os membros e filtrar por quem tem julho
    console.log("💡 ESTRATÉGIA BASEADA EM mensalidades_pagas (como você usa):");
    
    // Buscar TODOS os membros (independente do status) que podem ter mensalidades_pagas
    const { data: todosMembrosComMensalidades, error: erroMensalidades } = await supabase
      .from("membros")
      .select("nome_completo, tipo, status, mensalidades_pagas, ultima_mensalidade, pagamento_inscricao")
      .not("mensalidades_pagas", "is", null);  // Apenas quem tem algo em mensalidades_pagas
      
    console.log("   - Membros com mensalidades_pagas preenchido:", todosMembrosComMensalidades?.length || 0);
    
    if (todosMembrosComMensalidades && todosMembrosComMensalidades.length > 0) {
      console.log("   - Amostra mensalidades_pagas:", todosMembrosComMensalidades.slice(0, 3).map(m => ({
        nome: m.nome_completo,
        mensalidades: m.mensalidades_pagas,
        status: m.status
      })));
      
      // Filtrar quem tem '07/2025' em mensalidades_pagas
      const membrosComJulho = todosMembrosComMensalidades.filter(m => {
        const mensalidades = m.mensalidades_pagas || [];
        return mensalidades.includes('07/2025');
      });
      
      console.log("   - Membros com '07/2025' em mensalidades_pagas:", membrosComJulho.length);
      
      if (membrosComJulho.length > 0) {
        console.log("   ✅ ENCONTRADOS! Membros em dia:", membrosComJulho.map(m => `${m.nome_completo} (${m.tipo})`));
        return membrosComJulho;
      }
    }
    
    // Fallback: se não conseguiu acessar dados, tentar estratégia original
    let membrosParaAnalise = todosMembrosComMensalidades || data || membrosCompletos;
    let estrategiaUsada = "mensalidades_pagas_julho";
    
    if (!membrosParaAnalise || membrosParaAnalise.length === 0) {
      console.log("❌ PROBLEMA: Não conseguimos acessar nenhum membro da tabela");
      console.log("❌ Possíveis causas: RLS, permissões, ou tabela vazia");
      return [];
    }

    const data_final = membrosParaAnalise;

    // Analisar dados reais para escolher melhor estratégia
    const analise = analisarDadosReais(data_final);
    console.log("🔍 Análise dos dados:", analise);
    console.log("🎯 Estratégia sendo usada:", estrategiaUsada);

    // Aplicar lógica baseada na análise
    const membrosEmDia = aplicarLogicaInteligente(data_final, analise);
    
    console.log("✅ RESULTADO FINAL:", {
      total: membrosEmDia.length,
      pilotos: membrosEmDia.filter(m => m.tipo === 'piloto').length,
      agencias: membrosEmDia.filter(m => m.tipo === 'agencia').length,
      nomes: membrosEmDia.map(m => `${m.nome_completo} (${m.tipo})`)
    });

    return membrosEmDia;
  } catch (error) {
    console.error("❌ Erro na função principal:", error);
    return [];
  }
}

function analisarDadosReais(membros: any[]) {
  const comMensalidadesPagas = membros.filter(m => m.mensalidades_pagas && m.mensalidades_pagas.length > 0).length;
  const comUltimaMensalidade = membros.filter(m => m.ultima_mensalidade).length;
  const comPagamentoOk = membros.filter(m => m.pagamento_inscricao === 'ok').length;
  
  return {
    total: membros.length,
    comMensalidadesPagas,
    comUltimaMensalidade, 
    comPagamentoOk,
    estrategiaRecomendada: determinarEstrategia(comMensalidadesPagas, comUltimaMensalidade, comPagamentoOk, membros.length)
  };
}

function determinarEstrategia(mensalidades: number, ultimaMens: number, pagamentoOk: number, total: number) {
  // Se maioria tem mensalidades_pagas preenchido, usar essa lógica
  if (mensalidades > total * 0.5) {
    return 'mensalidades_pagas';
  }
  
  // Se maioria tem ultima_mensalidade, usar essa lógica  
  if (ultimaMens > total * 0.5) {
    return 'ultima_mensalidade';
  }
  
  // Se maioria tem pagamento_inscricao = ok, assumir que pagaram julho
  if (pagamentoOk > total * 0.5) {
    return 'pagamento_inscricao';
  }
  
  // Fallback: usar combinação
  return 'combinada';
}

function aplicarLogicaInteligente(membros: any[], analise: any) {
  console.log(`🎯 Aplicando estratégia: ${analise.estrategiaRecomendada}`);
  
  const hoje = new Date();
  const julhoInicio = new Date(2025, 6, 1); // 1º julho 2025
  const julhoFim = new Date(2025, 6, 31); // 31 julho 2025
  
  return membros.filter(membro => {
    let emDia = false;
    let motivo = '';
    
    switch (analise.estrategiaRecomendada) {
      case 'mensalidades_pagas':
        const pagos = membro.mensalidades_pagas || [];
        emDia = pagos.includes('07/2025');
        motivo = `mensalidades_pagas: ${JSON.stringify(pagos)}`;
        break;
        
      case 'ultima_mensalidade':
        if (membro.ultima_mensalidade) {
          const ultimaDate = new Date(membro.ultima_mensalidade);
          const diffMeses = (hoje.getFullYear() - ultimaDate.getFullYear()) * 12 + (hoje.getMonth() - ultimaDate.getMonth());
          emDia = diffMeses <= 1;
          motivo = `ultima_mensalidade: ${membro.ultima_mensalidade} (${diffMeses} meses atrás)`;
        }
        break;
        
      case 'pagamento_inscricao':
        // Se pagou inscrição, assumir que está em dia (estratégia baseada no que você disse)
        emDia = membro.pagamento_inscricao === 'ok';
        motivo = `pagamento_inscricao: ${membro.pagamento_inscricao}`;
        break;
        
      case 'combinada':
        // Tentar múltiplas estratégias
        const pagosArray = membro.mensalidades_pagas || [];
        const temJulho = pagosArray.includes('07/2025');
        
        const temUltimaMensalidade = membro.ultima_mensalidade && 
          (() => {
            const ultimaDate = new Date(membro.ultima_mensalidade);
            const diffMeses = (hoje.getFullYear() - ultimaDate.getFullYear()) * 12 + (hoje.getMonth() - ultimaDate.getMonth());
            return diffMeses <= 1;
          })();
          
        const temPagamentoOk = membro.pagamento_inscricao === 'ok';
        
        emDia = temJulho || temUltimaMensalidade || temPagamentoOk;
        motivo = `combinada: julho=${temJulho}, ultimaMens=${!!temUltimaMensalidade}, pagtoOk=${temPagamentoOk}`;
        break;
    }
    
    console.log(`  ${emDia ? '✅' : '❌'} ${membro.nome_completo} (${membro.tipo}): ${motivo}`);
    return emDia;
  });
}

 