import { useEffect, useState } from "react";
import { getAssociadosEmDia } from "../src/helpers/getAssociadosEmDia";
import { Header } from "../src/components/Layout/Header";
import { UserIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";

export default function MembrosPage() {
  const [membros, setMembros] = useState<any[]>([]);
  
  useEffect(() => {
    console.log("🔄 [MembrosPage] Iniciando carregamento...");
    
    getAssociadosEmDia()
      .then((resultado) => {
        console.log("🔄 [MembrosPage] Resultado recebido:", resultado);
        console.log("🔄 [MembrosPage] Tipo do resultado:", typeof resultado);
        console.log("🔄 [MembrosPage] É array?", Array.isArray(resultado));
        setMembros(resultado);
      })
      .catch((error) => {
        console.error("❌ [MembrosPage] Erro ao carregar:", error);
        setMembros([]);
      });
  }, []);

  // Aplicar ordem aleatória separadamente para pilotos e agências
  const pilotos = membros
    .filter(m => m.tipo === "piloto" || !m.tipo) // Inclui membros sem tipo definido
    .sort(() => Math.random() - 0.5); // Ordem aleatória para pilotos
    
  const agencias = membros
    .filter(m => m.tipo === "agencia")
    .sort(() => Math.random() - 0.5); // Ordem aleatória para agências
  
  console.log("🔄 [MembrosPage] Estado atual:", {
    membros: membros.length,
    pilotos: pilotos.length,
    agencias: agencias.length,
    primeirMembro: membros[0] || null,
    todosOsMembros: membros
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <section className="mt-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 px-8 py-10">
            <div className="rounded-lg bg-blue-50 text-blue-800 px-4 py-2 text-sm mb-8 dark:bg-blue-900/30 dark:text-blue-200">
              Lista atualizada automaticamente com associados em dia.
            </div>
            <h2 className="flex items-center gap-2 text-xl font-semibold mt-6 mb-3">
              <UserIcon className="h-5 w-5 text-primary" /> Pilotos
            </h2>
            <ul className="grid gap-2 mb-8">
              {pilotos.length === 0 && (
                <li className="text-sm text-gray-500 dark:text-gray-400">Nenhum piloto em dia no momento.</li>
              )}
              {pilotos.map((m) => (
                <li
                  key={m.nome_completo}
                  className="border border-gray-200 dark:border-white/10 rounded-md px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {m.nome_completo}
                </li>
              ))}
            </ul>
            <h2 className="flex items-center gap-2 text-xl font-semibold mt-6 mb-3">
              <BuildingOfficeIcon className="h-5 w-5 text-primary" /> Empresas
            </h2>
            <ul className="grid gap-2">
              {agencias.length === 0 && (
                <li className="text-sm text-gray-500 dark:text-gray-400">Nenhuma empresa em dia no momento.</li>
              )}
              {agencias.map((m) => (
                <li
                  key={m.nome_completo}
                  className="border border-gray-200 dark:border-white/10 rounded-md px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {m.nome_completo}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
} 