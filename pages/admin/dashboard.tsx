import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/helpers/getDashboardStats";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import KpiCard from "@/components/KpiCard";
import { UserIcon, BuildingOfficeIcon } from "@heroicons/react/24/solid";

function CardLink({ title, value, href, subtitle }: { title: any, value: any, href: any, subtitle?: any }) {
  // Cores de depuração para cada card
  let bg = "bg-white";
  if (title === "Pilotos") bg = "bg-blue-100";
  if (title === "Agências") bg = "bg-green-100";
  if (title === "Ativos") bg = "bg-yellow-100";
  if (title === "Pendentes") bg = "bg-red-100";
  return (
    <Link href={href} className={`${bg} rounded shadow p-6 flex flex-col items-center hover:bg-gray-50 transition border border-transparent hover:border-blue-400`}>
      <span className="text-gray-500">{title}</span>
      <span className="text-2xl font-bold">{value}</span>
      {subtitle && <span className="text-xs text-gray-400 mt-1">{subtitle}</span>}
    </Link>
  );
}

export default function AdminDashboard() {
  const { role } = useUser();
  const [stats, setStats] = useState({
    totalPilotos: "--",
    pilotosEmDia: "--",
    totalEmpresas: "--",
    empresasEmDia: "--",
    cadastrosAtivos: "--",
    cadastrosPendentes: "--",
  });
  const [boletimAmanha, setBoletimAmanha] = useState<any>(null);
  const [loadingBoletimAmanha, setLoadingBoletimAmanha] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats({
        totalPilotos: (data.totalPilotos ?? 0).toString(),
        pilotosEmDia: (data.pilotosEmDia ?? 0).toString(),
        totalEmpresas: (data.totalEmpresas ?? 0).toString(),
        empresasEmDia: (data.empresasEmDia ?? 0).toString(),
        cadastrosAtivos: (data.cadastrosAtivos ?? 0).toString(),
        cadastrosPendentes: (data.cadastrosPendentes ?? 0).toString(),
      });
    });
    async function fetchBoletimAmanha() {
      setLoadingBoletimAmanha(true);
      const tz = 'America/Sao_Paulo';
      const hoje = new Date();
      const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
      const dataAmanha = amanha.toLocaleDateString('sv-SE', { timeZone: tz });
      const { data, error } = await supabase
        .from("boletins")
        .select("id, data, periodo, bandeira, titulo_curto")
        .eq("data", dataAmanha)
        .eq("periodo", "manha")
        .limit(1)
        .single();
      if (!error && data) {
        setBoletimAmanha(data);
      } else {
        setBoletimAmanha(null);
      }
      setLoadingBoletimAmanha(false);
    }
    fetchBoletimAmanha();
  }, []);

  useEffect(() => {
    async function fetchLogs() {
      setLoadingLogs(true);
      const { data, error } = await supabase
        .from("logs_atividade")
        .select("id, acao, detalhes, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (!error && data) {
        setLogs(data);
      } else {
        setLogs([]);
      }
      setLoadingLogs(false);
    }
    fetchLogs();
  }, []);

  function getBandeiraColor(bandeira: string) {
    switch (bandeira) {
      case "verde": return "bg-green-100 text-green-800 border-green-400";
      case "amarela": return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "vermelha": return "bg-red-100 text-red-800 border-red-400";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  // LOG DE DEPURAÇÃO
  console.log("DASHBOARD RENDER", { stats, boletimAmanha, loadingBoletimAmanha });
  if (!stats || typeof stats !== 'object') {
    return <div style={{ color: 'red', padding: 32 }}>Erro: stats inválido</div>;
  }
  if (role !== 'admin' && role !== 'tesouraria' && role !== 'meteo') {
    return <div className="max-w-2xl mx-auto mt-16 text-center text-lg text-red-600 font-semibold">Acesso restrito a administradores, tesouraria e meteorologia.</div>;
  }
  // DASHBOARD REAL RESTAURADO
  return (
    <ProtectedRoute allowedRoles={["admin", "meteo", "tesouraria"]}>
      <DashboardLayout title="Dashboard">
        <div style={{ display: 'flex', flexDirection: 'row', gap: 32, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {/* KPI Cards refinados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <KpiCard title="Cadastros Ativos"    value={stats.cadastrosAtivos}      icon={UserIcon}           color="green" />
              <KpiCard title="Cadastros Pendentes" value={stats.cadastrosPendentes}   icon={UserIcon}           color="yellow"/>
              <KpiCard title="Pilotos"             value={stats.totalPilotos}         icon={UserIcon}           color="blue" />
              <KpiCard title="Empresas"            value={stats.totalEmpresas}        icon={BuildingOfficeIcon} color="red"  />
            </div>
            {/* Preview Boletim de Amanhã */}
            <div style={{ marginTop: 32, marginBottom: 16 }}>
              {loadingBoletimAmanha ? (
                <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 24, textAlign: 'center', fontSize: 18 }}>Carregando boletim de amanhã...</div>
              ) : boletimAmanha ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: 8, padding: 20 }}>
                  <span style={{ fontWeight: 700, color: boletimAmanha.bandeira === 'verde' ? '#16a34a' : boletimAmanha.bandeira === 'amarela' ? '#eab308' : '#dc2626', fontSize: 18 }}>
                    Bandeira: {boletimAmanha.bandeira.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 16, color: '#222' }}>{boletimAmanha.titulo_curto}</span>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/admin/boletins/${boletimAmanha.id}/edit`)}>
                    Editar Boletim de Amanhã
                  </Button>
                </div>
              ) : (
                <div style={{ background: '#fee2e2', border: '1px solid #dc2626', borderRadius: 8, padding: 20, color: '#b91c1c', fontWeight: 600, fontSize: 16 }}>
                  Boletim de amanhã não criado (deadline 19 h)
                </div>
              )}
            </div>
            {/* Banner de Pendências */}
            {parseInt(stats?.cadastrosPendentes ?? '0') > 0 && (
              <div style={{ background: '#fef9c3', border: '1px solid #facc15', color: '#b45309', borderRadius: 8, padding: 16, marginBottom: 16, fontWeight: 600, fontSize: 16 }}>
                Há {stats.cadastrosPendentes} cadastros aguardando aprovação
              </div>
            )}
            {/* Painel de Log de Atividade - sempre abaixo */}
            <aside style={{ width: '100%', background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px #0001', marginTop: 32, marginBottom: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: '#0f172a' }}>Log de Atividade</h3>
              {loadingLogs ? (
                <div style={{ color: '#64748b', fontSize: 15 }}>Carregando log...</div>
              ) : logs.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 15 }}>Nenhuma atividade recente.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {logs.map((log) => (
                    <li key={log.id} style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: 600, color: '#334155', fontSize: 15 }}>{log.acao}</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>{log.created_at && new Date(log.created_at).toLocaleString('pt-BR')}</div>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 