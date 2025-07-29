import { supabase } from "../integrations/supabase/client";

export async function getAssociadosEmDia() {
  console.log("🚀 [SOLUÇÃO DEFINITIVA] Iniciando busca de associados em dia...");

  try {
    // Buscar TODOS os dados disponíveis para tomar decisão inteligente
    const { data, error } = await supabase
      .from("membros")
      .select("nome_completo, tipo, status, mensalidades_pagas, ultima_mensalidade, pagamento_inscricao, created_at")
      .eq("status", "ativo");

    if (error) {
      console.error("❌ Erro ao buscar membros:", error);
      return [];
    }

    console.log("📊 Total membros ativos encontrados:", data?.length || 0);
    
    if (!data || data.length === 0) {
      console.log("⚠️  Nenhum membro ativo encontrado");
      return [];
    }

    // Analisar dados reais para escolher melhor estratégia
    const analise = analisarDadosReais(data);
    console.log("🔍 Análise dos dados:", analise);

    // Aplicar lógica baseada na análise
    const membrosEmDia = aplicarLogicaInteligente(data, analise);
    
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

 