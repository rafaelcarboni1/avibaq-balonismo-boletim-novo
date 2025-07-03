import { supabase } from "../integrations/supabase/client";

export async function getAssociadosEmDia() {
  const hoje = new Date();
  const inicio = new Date(2025, 6); // Julho/2025
  const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth());

  // Gera todos os meses de 07/2025 até o mês atual
  const meses: string[] = [];
  let atual = new Date(inicio.getFullYear(), inicio.getMonth());
  while (atual <= mesAtual) {
    meses.push(`${('0'+(atual.getMonth()+1)).slice(-2)}/${atual.getFullYear()}`);
    atual.setMonth(atual.getMonth() + 1);
  }

  const { data, error } = await supabase
    .from("membros")
    .select("nome_completo, tipo, status, mensalidades_pagas")
    .eq("status", "ativo");

  if (error) {
    console.error("Erro ao buscar associados em dia:", error);
    return [];
  }

  // Filtra quem está em dia
  return (data || []).filter(m => {
    const pagos = m.mensalidades_pagas || [];
    return meses.every(mes => pagos.includes(mes));
  });
} 