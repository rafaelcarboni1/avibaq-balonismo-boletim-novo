import { supabase } from "../integrations/supabase/client";

export async function getAssociadosEmDia() {
  // Usar data local do Brasil para evitar problemas de timezone
  const hoje = new Date();
  const brasilOffset = -3; // UTC-3 (horário de Brasília)
  const hojeBrasil = new Date(hoje.getTime() + (brasilOffset * 60 * 60 * 1000));
  
  const inicio = new Date(2025, 6); // Julho/2025
  const mesAtual = new Date(hojeBrasil.getFullYear(), hojeBrasil.getMonth());

  // Gera todos os meses de 07/2025 até o mês atual
  const meses: string[] = [];
  let atual = new Date(inicio.getFullYear(), inicio.getMonth());
  while (atual <= mesAtual) {
    meses.push(`${('0'+(atual.getMonth()+1)).slice(-2)}/${atual.getFullYear()}`);
    atual.setMonth(atual.getMonth() + 1);
  }

  console.log("🔍 [getAssociadosEmDia] Debug Info:");
  console.log("  - Data atual Brasil:", hojeBrasil.toISOString());
  console.log("  - Meses esperados:", meses);

  const { data, error } = await supabase
    .from("membros")
    .select("nome_completo, tipo, status, mensalidades_pagas")
    .eq("status", "ativo");

  if (error) {
    console.error("Erro ao buscar associados em dia:", error);
    return [];
  }

  console.log("  - Total membros ativos:", data?.length || 0);

  // Filtra quem está em dia
  const membrosEmDia = (data || []).filter(m => {
    const pagos = m.mensalidades_pagas || [];
    const estEmDia = meses.every(mes => pagos.includes(mes));
    
    // Log detalhado para todos os membros para debug
    console.log(`  - ${m.nome_completo} (${m.tipo}): tem ${JSON.stringify(pagos)}, precisa ${JSON.stringify(meses)} = ${estEmDia ? '✅ EM DIA' : '❌ EM ABERTO'}`);
    
    return estEmDia;
  });

  console.log("  - Total em dia:", membrosEmDia.length);
  console.log("  - Membros em dia:", membrosEmDia.map(m => `${m.nome_completo} (${m.tipo})`));

  return membrosEmDia;
} 