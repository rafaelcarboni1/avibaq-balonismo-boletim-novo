import { supabase } from "../integrations/supabase/client";

export async function getAssociadosEmDia() {
  console.log("🎯 Buscando associados em dia usando mensalidades_pagas...");

  try {
    // Buscar TODOS os membros que têm mensalidades_pagas preenchido
    const { data: membros, error } = await supabase
      .from("membros")
      .select("nome_completo, tipo, mensalidades_pagas")
      .not("mensalidades_pagas", "is", null);

    if (error) {
      console.error("❌ Erro ao buscar membros:", error);
      return [];
    }

    console.log("📊 Total de membros com mensalidades_pagas:", membros?.length || 0);

    if (!membros || membros.length === 0) {
      console.log("⚠️ Nenhum membro com mensalidades_pagas preenchido");
      return [];
    }

    // Filtrar especificamente quem tem '07/2025' no array
    const membrosEmDia = membros.filter(membro => {
      const mensalidades = membro.mensalidades_pagas || [];
      const temJulho = mensalidades.includes('07/2025');
      
      console.log(`${temJulho ? '✅' : '❌'} ${membro.nome_completo} (${membro.tipo}): ${JSON.stringify(mensalidades)}`);
      
      return temJulho;
    });

    console.log("✅ RESULTADO FINAL:");
    console.log(`   - Total em dia: ${membrosEmDia.length}`);
    console.log(`   - Pilotos: ${membrosEmDia.filter(m => m.tipo === 'piloto').length}`);
    console.log(`   - Agências: ${membrosEmDia.filter(m => m.tipo === 'agencia').length}`);

    return membrosEmDia;
    
  } catch (error) {
    console.error("❌ Erro na função:", error);
    return [];
  }
}

 