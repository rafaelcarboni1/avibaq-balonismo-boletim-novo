import { supabase } from "@/integrations/supabase/client";

export async function getDashboardStats() {
  // Busca todos os membros
  const { data: membros, error } = await supabase
    .from("membros")
    .select("tipo, status, ultima_mensalidade")
    .returns<Array<{ tipo: string; status: string; ultima_mensalidade?: string }>>();
  if (error || !membros) {
    return {
      totalPilotos: 0,
      pilotosEmDia: 0,
      totalEmpresas: 0,
      empresasEmDia: 0,
      cadastrosAtivos: 0,
      cadastrosPendentes: 0,
    };
  }
  const hoje = new Date();
  const emDia = (ultima?: string) => {
    if (!ultima) return false;
    const ultimaDate = new Date(ultima);
    const diffMeses = (hoje.getFullYear() - ultimaDate.getFullYear()) * 12 + (hoje.getMonth() - ultimaDate.getMonth());
    return diffMeses <= 1;
  };
  const totalPilotos = membros.filter(m => m.tipo === "piloto").length;
  const pilotosEmDia = membros.filter(m => m.tipo === "piloto" && emDia(m.ultima_mensalidade)).length;
  const totalEmpresas = membros.filter(m => m.tipo === "agencia").length;
  const empresasEmDia = membros.filter(m => m.tipo === "agencia" && emDia(m.ultima_mensalidade)).length;
  const cadastrosAtivos = membros.filter(m => m.status === "ativo").length;
  const cadastrosPendentes = membros.filter(m => m.status === "pendente").length;
  return {
    totalPilotos,
    pilotosEmDia,
    totalEmpresas,
    empresasEmDia,
    cadastrosAtivos,
    cadastrosPendentes,
  };
} 