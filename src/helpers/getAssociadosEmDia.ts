import { supabase } from "../integrations/supabase/client";

export async function getAssociadosEmDia() {
  console.log("🔍 [getAssociadosEmDia] Iniciando busca...");

  try {
    // Primeiro, testar se a coluna mensalidades_pagas existe
    const testColumn = await supabase
      .from("membros")
      .select("mensalidades_pagas")
      .limit(1);

    const columnExists = !testColumn.error;
    console.log("  - Coluna mensalidades_pagas existe:", columnExists);

    if (columnExists) {
      // Usar lógica original com mensalidades_pagas
      return await getAssociadosComMensalidadesPagas();
    } else {
      // Usar lógica alternativa com ultima_mensalidade
      console.log("  - Usando lógica alternativa com ultima_mensalidade");
      return await getAssociadosComUltimaMensalidade();
    }
  } catch (error) {
    console.error("❌ Erro na função getAssociadosEmDia:", error);
    // Em caso de erro, retornar fallback vazio mas loggar o problema
    return [];
  }
}

// Lógica original para quando a coluna mensalidades_pagas existir
async function getAssociadosComMensalidadesPagas() {
  try {
    console.log("  - Usando lógica com mensalidades_pagas");
    
    const hoje = new Date();
    const brasilOffset = -3;
    const hojeBrasil = new Date(hoje.getTime() + (brasilOffset * 60 * 60 * 1000));
    const inicio = new Date(2025, 6);
    const mesAtual = new Date(hojeBrasil.getFullYear(), hojeBrasil.getMonth());

    const meses: string[] = [];
    let atual = new Date(inicio.getFullYear(), inicio.getMonth());
    while (atual <= mesAtual) {
      meses.push(`${('0'+(atual.getMonth()+1)).slice(-2)}/${atual.getFullYear()}`);
      atual.setMonth(atual.getMonth() + 1);
    }

    console.log("  - Meses esperados:", meses);

    const { data, error } = await supabase
      .from("membros")
      .select("nome_completo, tipo, status, mensalidades_pagas")
      .eq("status", "ativo");

    if (error) {
      console.error("Erro ao buscar associados em dia:", error);
      return [];
    }

    console.log("  - Total membros ativos encontrados:", data?.length || 0);

    const membrosEmDia = (data || []).filter(m => {
      const pagos = m.mensalidades_pagas || [];
      const estEmDia = meses.every(mes => pagos.includes(mes));
      
      console.log(`  - ${m.nome_completo} (${m.tipo}): tem ${JSON.stringify(pagos)}, precisa ${JSON.stringify(meses)} = ${estEmDia ? '✅ EM DIA' : '❌ EM ABERTO'}`);
      
      return estEmDia;
    });

    console.log("  - ✅ RESULTADO FINAL - Total em dia:", membrosEmDia.length);
    console.log("  - ✅ MEMBROS EM DIA:", membrosEmDia.map(m => `${m.nome_completo} (${m.tipo})`));

    return membrosEmDia;
  } catch (error) {
    console.error("❌ Erro na função getAssociadosComMensalidadesPagas:", error);
    return [];
  }
}

// Lógica alternativa usando ultima_mensalidade (similar ao getDashboardStats)
async function getAssociadosComUltimaMensalidade() {
  try {
    const { data, error } = await supabase
      .from("membros")
      .select("nome_completo, tipo, status, ultima_mensalidade")
      .eq("status", "ativo");

    if (error) {
      console.error("Erro ao buscar associados em dia:", error);
      return [];
    }

    console.log("  - Total membros ativos encontrados:", data?.length || 0);

    const hoje = new Date();
    const membrosEmDia = (data || []).filter(m => {
      if (!m.ultima_mensalidade) {
        console.log(`  - ${m.nome_completo}: sem data de última mensalidade = ❌ EM ABERTO`);
        return false;
      }
      
      const ultimaDate = new Date(m.ultima_mensalidade);
      const diffMeses = (hoje.getFullYear() - ultimaDate.getFullYear()) * 12 + (hoje.getMonth() - ultimaDate.getMonth());
      const estEmDia = diffMeses <= 1;
      
      console.log(`  - ${m.nome_completo}: última mensalidade ${m.ultima_mensalidade}, diff ${diffMeses} meses = ${estEmDia ? '✅ EM DIA' : '❌ EM ABERTO'}`);
      
      return estEmDia;
    });

    console.log("  - ✅ RESULTADO FINAL - Total em dia:", membrosEmDia.length);
    console.log("  - ✅ MEMBROS EM DIA:", membrosEmDia.map(m => `${m.nome_completo} (${m.tipo})`));

    return membrosEmDia;
  } catch (error) {
    console.error("❌ Erro na função getAssociadosComUltimaMensalidade:", error);
    return [];
  }
} 