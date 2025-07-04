import { useEffect, useState, useMemo, useRef } from "react";
import { getAssociadosEmDia } from "../helpers/getAssociadosEmDia";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "./ui/card";
import { UserIcon, BuildingOfficeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export default function HomeSectionMembros() {
  const [membros, setMembros] = useState<any[]>([]);
  const [slidePilotos, setSlidePilotos] = useState(0);
  const [slideAgencias, setSlideAgencias] = useState(0);
  const intervalPilotos = useRef<NodeJS.Timeout | null>(null);
  const intervalAgencias = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  useEffect(() => {
    getAssociadosEmDia().then(setMembros);
  }, []);

  const pilotos = useMemo(() => membros.filter(m => m.tipo === "piloto"), [membros]);
  const agencias = useMemo(() => membros.filter(m => m.tipo === "agencia"), [membros]);
  const totalPilotos = pilotos.length;
  const totalEmpresas = agencias.length;

  // Responsividade: 2 por vez no mobile, 3 no desktop
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const perPage = isMobile ? 2 : 3;

  // Slides para pilotos
  const slidesPilotos = useMemo(() => {
    const arr = [];
    for (let i = 0; i < pilotos.length; i += perPage) {
      arr.push(pilotos.slice(i, i + perPage));
    }
    return arr;
  }, [pilotos, perPage]);
  const totalSlidesPilotos = slidesPilotos.length;

  // Slides para agências
  const slidesAgencias = useMemo(() => {
    const arr = [];
    for (let i = 0; i < agencias.length; i += perPage) {
      arr.push(agencias.slice(i, i + perPage));
    }
    return arr;
  }, [agencias, perPage]);
  const totalSlidesAgencias = slidesAgencias.length;

  // Avanço automático pilotos
  useEffect(() => {
    if (slidesPilotos.length === 0) return;
    intervalPilotos.current = setInterval(() => {
      setSlidePilotos((prev) => (prev + 1) % totalSlidesPilotos);
    }, 3000);
    return () => intervalPilotos.current && clearInterval(intervalPilotos.current);
  }, [slidesPilotos, totalSlidesPilotos]);

  // Avanço automático agências
  useEffect(() => {
    if (slidesAgencias.length === 0) return;
    intervalAgencias.current = setInterval(() => {
      setSlideAgencias((prev) => (prev + 1) % totalSlidesAgencias);
    }, 3000);
    return () => intervalAgencias.current && clearInterval(intervalAgencias.current);
  }, [slidesAgencias, totalSlidesAgencias]);

  return (
    <section className="mt-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 px-8 py-10 text-center space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Pilotos e Empresas Associados</h2>
          {/* Linha de Pilotos */}
          <div>
            <div className="flex items-center justify-center mb-1">
              <span className="inline-block bg-primary text-white rounded-full px-5 py-1.5 text-base font-semibold">
                Pilotos ({totalPilotos})
              </span>
            </div>
            <div className="relative w-full max-w-3xl mx-auto min-h-[90px] overflow-hidden">
              {slidesPilotos.length === 0 ? (
                <div className="text-gray-400 dark:text-gray-400 py-6">Nenhum piloto em dia no momento.</div>
              ) : (
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ width: `${slidesPilotos.length * 100}%`, transform: `translateX(-${slidePilotos * (100 / slidesPilotos.length)}%)` }}
                >
                  {slidesPilotos.map((grupo, idx) => (
                    <div
                      key={idx}
                      className="flex w-full min-w-0 flex-1 justify-center gap-8"
                      style={{ width: `${100 / slidesPilotos.length}%` }}
                    >
                      {grupo.map((m, i) => (
                        <div key={i} className="flex flex-col items-center justify-center min-w-[120px] max-w-[180px]">
                          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 text-center break-words">{m.nome_completo}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">Piloto</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Linha de Agências */}
          <div>
            <div className="flex items-center justify-center mb-1 mt-6">
              <span className="inline-block bg-primary text-white rounded-full px-5 py-1.5 text-base font-semibold">
                Empresas/Agências ({totalEmpresas})
              </span>
            </div>
            <div className="relative w-full max-w-3xl mx-auto min-h-[90px] overflow-hidden">
              {slidesAgencias.length === 0 ? (
                <div className="text-gray-400 dark:text-gray-400 py-6">Nenhuma agência em dia no momento.</div>
              ) : (
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ width: `${slidesAgencias.length * 100}%`, transform: `translateX(-${slideAgencias * (100 / slidesAgencias.length)}%)` }}
                >
                  {slidesAgencias.map((grupo, idx) => (
                    <div
                      key={idx}
                      className="flex w-full min-w-0 flex-1 justify-center gap-8"
                      style={{ width: `${100 / slidesAgencias.length}%` }}
                    >
                      {grupo.map((m, i) => (
                        <div key={i} className="flex flex-col items-center justify-center min-w-[120px] max-w-[180px]">
                          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 text-center break-words">{m.nome_completo}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">Agência</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
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