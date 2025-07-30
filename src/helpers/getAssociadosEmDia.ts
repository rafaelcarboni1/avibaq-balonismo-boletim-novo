import { supabase } from "../integrations/supabase/client";

export async function getAssociadosEmDia() {
  console.log("🎯 Buscando associados em dia usando função RPC para acesso público...");

  try {
    // Usar função RPC que bypassa RLS para acesso público
    const { data: membros, error } = await supabase
      .rpc("get_members_public_info");

    console.log("🔍 RPC executada: get_members_public_info()");

    if (error) {
      console.error("❌ Erro ao executar RPC:", error);
      return [];
    }

    console.log("📊 Total de membros retornados pela RPC:", membros?.length || 0);
    console.log("📋 Primeiros 5 membros:", membros?.slice(0, 5));

    if (!membros || membros.length === 0) {
      console.log("⚠️ RPC retornou nenhum membro");
      return [];
    }

    // Analisar todos os tipos encontrados
    const tiposEncontrados = Array.from(new Set(membros.map(m => m.tipo || 'null')));
    console.log("📋 Tipos encontrados:", tiposEncontrados);
    
    // Filtrar apenas membros com mensalidades_pagas preenchido
    const membrosComMensalidades = membros.filter(membro => {
      return membro.mensalidades_pagas && membro.mensalidades_pagas.length > 0;
    });
    
    console.log("📊 Membros com mensalidades_pagas:", membrosComMensalidades.length);
    
    // Filtrar especificamente quem tem '07/2025' no array
    const membrosEmDia = membrosComMensalidades.filter(membro => {
      const mensalidades = membro.mensalidades_pagas || [];
      const temJulho = mensalidades.includes('07/2025');
      
      if (temJulho) {
        console.log(`✅ ${membro.nome_completo} (${membro.tipo || 'SEM_TIPO'}): ${JSON.stringify(mensalidades)}`);
      }
      
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

 