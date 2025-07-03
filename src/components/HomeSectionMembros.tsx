import { useEffect, useState, useMemo } from "react";
import { getAssociadosEmDia } from "../helpers/getAssociadosEmDia";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "./ui/card";
import { UserIcon, BuildingOfficeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export default function HomeSectionMembros() {
  const [membros, setMembros] = useState<any[]>([]);
  const router = useRouter();
  useEffect(() => {
    getAssociadosEmDia().then(setMembros);
  }, []);

  const pilotos = useMemo(() => membros.filter(m => m.tipo === "piloto"), [membros]);
  const agencias = useMemo(() => membros.filter(m => m.tipo === "agencia"), [membros]);
  const totalPilotos = pilotos.length;
  const totalEmpresas = agencias.length;

  // Shuffle para marquee
  const shuffled = useMemo(() => {
    const arr = [...membros];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [membros]);

  // Mapeamento para exibir tipo
  const tipoMap: Record<string, string> = {};
  membros.forEach(m => {
    tipoMap[m.nome_completo] = m.tipo === "piloto" ? "Piloto" : "Agência";
  });

  return (
    <section className="mt-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 px-8 py-10 text-center space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Pilotos e Empresas Associados</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-white text-sm">
              <UserIcon className="h-4 w-4" /> {totalPilotos} Pilotos
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-white text-sm">
              <BuildingOfficeIcon className="h-4 w-4" /> {totalEmpresas} Empresas
            </span>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <ul
              className="flex gap-8 animate-marquee py-2 text-gray-700 dark:text-gray-200 text-base font-medium"
              style={{ animationDuration: `${Math.max(shuffled.length * 4, 12)}s` }}
            >
              {shuffled.length === 0 ? (
                <li className="text-gray-400 dark:text-gray-400">Nenhum associado em dia no momento.</li>
              ) : (
                shuffled.map((m, i) => (
                  <li key={i} className="whitespace-nowrap">
                    {m.nome_completo} <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{tipoMap[m.nome_completo]}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <button
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-white hover:bg-primary2 transition-colors text-sm"
            onClick={() => router.push('/membros')}
          >
            Ver todos
            <ArrowRightIcon className="h-4 w-4" />
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Funcionalidade em implementação; dados podem estar incompletos.
          </p>
        </div>
      </div>
    </section>
  );
} 