import { ProtectedRoute } from "@/components/ProtectedRoute";
import SimpleDashboardLayout from "@/components/SimpleDashboardLayout";
import SimpleKpiCard from "@/components/SimpleKpiCard";
import { BentoGrid, BentoGridItem } from "@/components/magicui/bento-grid";
import AnimatedChart from "@/components/magicui/animated-chart";
import LoadingSkeleton from "@/components/magicui/loading-skeleton";
import { SafetyKPIPanel, OperationalKPIPanel, AdvancedKPICard } from "@/components/magicui/advanced-kpi-analytics";
import { AdvancedLineChart, GaugeChart, HeatmapChart } from "@/components/magicui/advanced-charts";
import { ComparativeAnalyticsDashboard } from "@/components/magicui/comparative-analytics";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/helpers/getDashboardStats";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { 
  UserIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/solid";
import VooEmAndamento from '@/components/VooEmAndamento';
import PushNotificationManager from '@/components/PushNotificationManager';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'safety' | 'operations' | 'analytics' | 'voos'>('overview');
  const [advancedData, setAdvancedData] = useState<any>(null);
  const [voosData, setVoosData] = useState<any>({
    voosEmAndamento: [],
    voosRecentes: [],
    estatisticasVoos: {}
  });
  const [loadingVoos, setLoadingVoos] = useState(false);
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
    
    // Carregar dados avançados para analytics
    async function loadAdvancedData() {
      // Simular dados avançados - em produção, viriam da API
      setAdvancedData({
        heatmapData: generateHeatmapData(),
        performanceMetrics: generatePerformanceMetrics(),
        trendData: generateTrendData()
      });
    }
    
    loadAdvancedData();
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

  // Função para carregar dados de voos (admin vê todos os voos)
  const carregarDadosVoos = async () => {
    try {
      setLoadingVoos(true);
      
      const [
        voosEmAndamentoResult,
        voosRecentesResult,
        estatisticasResult
      ] = await Promise.all([
        // Todos os voos em andamento da associação
        supabase
          .from('voos')
          .select(`
            *, 
            piloto:membros!voos_piloto_id_fkey(nome),
            agencia:membros!voos_agencia_id_fkey(nome)
          `)
          .in('status', ['rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido'])
          .order('data_voo', { ascending: true }),
        
        // Voos recentes finalizados (últimos 10)
        supabase
          .from('voos')
          .select(`
            *, 
            piloto:membros!voos_piloto_id_fkey(nome),
            agencia:membros!voos_agencia_id_fkey(nome)
          `)
          .in('status', ['finalizado', 'cancelado'])
          .order('data_voo', { ascending: false })
          .limit(10),
        
        // Estatísticas gerais de voos
        supabase
          .from('voos')
          .select('status')
      ]);

      const estatisticas = estatisticasResult.data?.reduce((acc: any, voo: any) => {
        acc[voo.status] = (acc[voo.status] || 0) + 1;
        return acc;
      }, {}) || {};

      setVoosData({
        voosEmAndamento: voosEmAndamentoResult.data || [],
        voosRecentes: voosRecentesResult.data || [],
        estatisticasVoos: estatisticas
      });

    } catch (error) {
      console.error('Erro ao carregar dados de voos:', error);
    } finally {
      setLoadingVoos(false);
    }
  };

  function getBandeiraColor(bandeira: string) {
    switch (bandeira) {
      case "verde": return "bg-green-100 text-green-800 border-green-400";
      case "amarela": return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "vermelha": return "bg-red-100 text-red-800 border-red-400";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  }

  // Funções para gerar dados de demonstração
  function generateHeatmapData() {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = [];
    
    for (const day of days) {
      for (let hour = 6; hour <= 18; hour++) {
        let value = 0;
        // Simular mais voos nos fins de semana e horários específicos
        if (day === 'Sáb' || day === 'Dom') {
          value = Math.floor(Math.random() * 8) + 2;
        } else if (hour >= 8 && hour <= 10 || hour >= 15 && hour <= 17) {
          value = Math.floor(Math.random() * 5) + 1;
        } else {
          value = Math.floor(Math.random() * 3);
        }
        
        data.push({ day, hour, value });
      }
    }
    
    return data;
  }

  function generatePerformanceMetrics() {
    return [
      { x: 85, y: 92, label: 'João Silva' },
      { x: 78, y: 88, label: 'Maria Santos' },
      { x: 90, y: 95, label: 'Pedro Costa' },
      { x: 82, y: 86, label: 'Ana Oliveira' },
      { x: 88, y: 91, label: 'Carlos Lima' }
    ];
  }

  function generateTrendData() {
    return Array.from({ length: 30 }, (_, i) => ({
      name: `${i + 1}`,
      value: Math.floor(Math.random() * 20) + 30 + (i * 0.3)
    }));
  }

  // Performance: Remove debug logs in production
  // console.log("DASHBOARD RENDER", { stats, boletimAmanha, loadingBoletimAmanha });
  if (!stats || typeof stats !== 'object') {
    return <div style={{ color: 'red', padding: 32 }}>Erro: stats inválido</div>;
  }
  if (role !== 'admin' && role !== 'tesouraria' && role !== 'meteo') {
    return <div className="max-w-2xl mx-auto mt-16 text-center text-lg text-red-600 font-semibold">Acesso restrito a administradores, tesouraria e meteorologia.</div>;
  }
  // DASHBOARD REAL RESTAURADO
  return (
    <ProtectedRoute allowedRoles={["admin", "meteo", "tesouraria"]}>
      <SimpleDashboardLayout 
        title="Dashboard Avançado"
        breadcrumbs={[
          { label: "Dashboard", icon: DocumentTextIcon }
        ]}
      >
        <div className="space-y-8">
          {/* Navegação por abas */}
          <div className="flex gap-4 border-b border-gray-200">
            {[
              { key: 'overview', label: 'Visão Geral', icon: ChartBarIcon },
              { key: 'voos', label: 'Voos', icon: ClockIcon },
              { key: 'safety', label: 'Segurança', icon: ShieldCheckIcon },
              { key: 'operations', label: 'Operações', icon: DocumentTextIcon },
              { key: 'analytics', label: 'Analytics', icon: CurrencyDollarIcon }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`
                  flex items-center gap-2 px-4 py-2 border-b-2 transition-colors
                  ${activeTab === tab.key 
                    ? 'border-blue-500 text-blue-600 bg-blue-50' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conteúdo das abas */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {!stats || stats.totalPilotos === "--" ? (
              // Loading skeletons
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200/50">
                    <LoadingSkeleton variant="card" />
                  </div>
                ))}
              </>
            ) : (
              // Actual KPI cards
              <>
            <SimpleKpiCard 
              title="Cadastros Ativos"
              value={parseInt(stats.cadastrosAtivos)} 
              icon={CheckCircleIcon}
              color="green"
              trend={{
                value: 12,
                label: "este mês",
                direction: "up"
              }}
              description="Membros com status ativo"
            />
            <SimpleKpiCard 
              title="Cadastros Pendentes"
              value={parseInt(stats.cadastrosPendentes)}
              icon={ClockIcon}
              color="yellow"
              trend={parseInt(stats.cadastrosPendentes) > 0 ? {
                value: 0,
                label: "Requer atenção",
                direction: "neutral"
              } : undefined}
              description="Aguardando aprovação"
            />
            <SimpleKpiCard 
              title="Pilotos"
              value={parseInt(stats.totalPilotos)}
              icon={UserIcon}
              color="blue"
              trend={{
                value: 3,
                label: "este mês",
                direction: "up"
              }}
              description="Pilotos cadastrados"
            />
            <SimpleKpiCard 
              title="Empresas"
              value={parseInt(stats.totalEmpresas)}
              icon={BuildingOfficeIcon}
              color="purple"
              description="Agências parceiras"
            />
              </>
            )}
          </div>

          {/* Gráficos e Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AnimatedChart
              title="Cadastros por Mês"
              type="bar"
              data={[
                { name: 'Jan', value: 12 },
                { name: 'Fev', value: 8 },
                { name: 'Mar', value: 15 },
                { name: 'Abr', value: 10 },
                { name: 'Mai', value: 18 },
                { name: 'Jun', value: 22 },
              ]}
              colors={["#3b82f6", "#10b981"]}
            />
            
            <AnimatedChart
              title="Distribuição por Tipo"
              type="pie"
              data={[
                { name: 'Pilotos', value: parseInt(stats.totalPilotos) || 0 },
                { name: 'Empresas', value: parseInt(stats.totalEmpresas) || 0 },
              ]}
              colors={["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]}
            />
          </div>

          {/* Bento Grid Layout */}
          <BentoGrid className="md:auto-rows-[20rem]">
            {/* Boletim de Amanhã */}
            <BentoGridItem
              className="md:col-span-2"
              title="Boletim de Amanhã"
              description={
                loadingBoletimAmanha ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                    <span>Carregando boletim...</span>
                  </div>
                ) : boletimAmanha ? (
                  <div className="space-y-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      boletimAmanha.bandeira === 'verde' ? 'bg-green-100 text-green-800' :
                      boletimAmanha.bandeira === 'amarela' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      Bandeira {boletimAmanha.bandeira.toUpperCase()}
                    </div>
                    <p className="text-gray-700">{boletimAmanha.titulo_curto}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => router.push(`/admin/boletins/${boletimAmanha.id}/edit`)}
                      className="mt-2"
                    >
                      Editar Boletim
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <span>Boletim não criado (deadline 19h)</span>
                  </div>
                )
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl items-center justify-center">
                  <DocumentTextIcon className="h-10 w-10 text-white" />
                </div>
              }
              icon={<DocumentTextIcon className="h-6 w-6 text-blue-500" />}
            />

            {/* Alertas e Pendências */}
            <BentoGridItem
              title="Alertas"
              description={
                parseInt(stats?.cadastrosPendentes ?? '0') > 0 ? (
                  <div className="flex items-center gap-2 text-amber-600">
                    <ExclamationTriangleIcon className="h-5 w-5" />
                    <span>{stats.cadastrosPendentes} cadastros pendentes</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Tudo em dia!</span>
                  </div>
                )
              }
              header={
                <div className={`flex h-20 w-full rounded-xl items-center justify-center ${
                  parseInt(stats?.cadastrosPendentes ?? '0') > 0 
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600'
                }`}>
                  {parseInt(stats?.cadastrosPendentes ?? '0') > 0 ? (
                    <ExclamationTriangleIcon className="h-10 w-10 text-white" />
                  ) : (
                    <CheckCircleIcon className="h-10 w-10 text-white" />
                  )}
                </div>
              }
              icon={<ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />}
            />

            {/* Log de Atividade */}
            <BentoGridItem
              className="md:col-span-3"
              title="Atividade Recente"
              description={
                <div className="space-y-3">
                  {loadingLogs ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : logs.length === 0 ? (
                    <p className="text-gray-500">Nenhuma atividade recente</p>
                  ) : (
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {logs.slice(0, 5).map((log, index) => (
                        <div
                          key={log.id}
                          className="border-l-2 border-blue-200 pl-3 py-1"
                        >
                          <p className="text-sm font-medium text-gray-900">{log.acao}</p>
                          <p className="text-xs text-gray-500">
                            {log.created_at && new Date(log.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl items-center justify-center">
                  <ClockIcon className="h-10 w-10 text-white" />
                </div>
              }
              icon={<ClockIcon className="h-6 w-6 text-indigo-500" />}
            />
          </BentoGrid>
            </div>
          )}

          {/* Aba de Segurança */}
          {activeTab === 'safety' && (
            <div className="space-y-8">
              <SafetyKPIPanel flightStats={stats} />
              
              {advancedData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GaugeChart
                    title="Safety Score Geral"
                    value={98.5}
                    max={100}
                    colors={['#ef4444', '#f59e0b', '#10b981']}
                  />
                  
                  <HeatmapChart
                    title="Mapa de Calor - Incidentes por Horário"
                    data={advancedData.heatmapData}
                  />
                </div>
              )}
            </div>
          )}

          {/* Aba de Operações */}
          {activeTab === 'operations' && (
            <div className="space-y-8">
              <OperationalKPIPanel operationalStats={stats} />
              
              {advancedData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AdvancedLineChart
                    title="Tendência Operacional - Últimos 30 Dias"
                    data={advancedData.trendData}
                    type="line"
                    colors={['#3b82f6', '#10b981']}
                  />
                  
                  <div className="space-y-4">
                    <AdvancedKPICard
                      title="Eficiência da Frota"
                      metric={{
                        value: 87.3,
                        target: 85,
                        previousValue: 84.1,
                        format: 'percentage'
                      }}
                      icon={ChartBarIcon}
                      color="blue"
                      description="Utilização vs. Capacidade"
                    />
                    
                    <AdvancedKPICard
                      title="Receita por Hora de Voo"
                      metric={{
                        value: 2850,
                        previousValue: 2650,
                        format: 'currency'
                      }}
                      icon={CurrencyDollarIcon}
                      color="green"
                      description="Receita otimizada"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Aba de Voos */}
          {activeTab === 'voos' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ClockIcon className="h-6 w-6 text-blue-500" />
                  Gestão de Voos da Associação
                </h2>
                <button
                  onClick={carregarDadosVoos}
                  disabled={loadingVoos}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loadingVoos ? 'Carregando...' : 'Atualizar'}
                </button>
              </div>

              {/* Estatísticas de Voos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SimpleKpiCard 
                  title="Voos em Andamento"
                  value={voosData.voosEmAndamento.length} 
                  icon={ClockIcon}
                  color="blue"
                  description="Rascunho até checklist"
                />
                <SimpleKpiCard 
                  title="Finalizados"
                  value={voosData.estatisticasVoos.finalizado || 0}
                  icon={CheckCircleIcon}
                  color="green"
                  description="Voos executados"
                />
                <SimpleKpiCard 
                  title="Cancelados"
                  value={voosData.estatisticasVoos.cancelado || 0}
                  icon={ExclamationTriangleIcon}
                  color="red"
                  description="Voos não executados"
                />
                <SimpleKpiCard 
                  title="Total Geral"
                  value={
                    (voosData.estatisticasVoos.finalizado || 0) + 
                    (voosData.estatisticasVoos.cancelado || 0) + 
                    (voosData.estatisticasVoos.rascunho || 0) + 
                    (voosData.estatisticasVoos.planejado || 0) + 
                    (voosData.estatisticasVoos.checklist_bloco1 || 0) + 
                    (voosData.estatisticasVoos.checklist_bloco2 || 0) + 
                    (voosData.estatisticasVoos.checklist_concluido || 0)
                  }
                  icon={DocumentTextIcon}
                  color="purple"
                  description="Todos os voos"
                />
              </div>

              {/* Voos em Andamento */}
              {voosData.voosEmAndamento.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Voos em Andamento ({voosData.voosEmAndamento.length})
                  </h3>
                  <div className="grid gap-4">
                    {voosData.voosEmAndamento.map((voo: any) => (
                      <VooEmAndamento 
                        key={voo.id} 
                        voo={voo} 
                        showPilotInfo={true}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Voos Recentes */}
              {voosData.voosRecentes.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Voos Recentes ({voosData.voosRecentes.length})
                  </h3>
                  <div className="grid gap-4">
                    {voosData.voosRecentes.map((voo: any) => (
                      <VooEmAndamento 
                        key={voo.id} 
                        voo={voo} 
                        showPilotInfo={true}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Estado vazio */}
              {!loadingVoos && voosData.voosEmAndamento.length === 0 && voosData.voosRecentes.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum voo encontrado</h3>
                  <p className="text-gray-500 mb-4">Clique em "Atualizar" para carregar os dados de voos</p>
                  <button
                    onClick={carregarDadosVoos}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Carregar Voos
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Aba de Analytics Comparativo */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              <ComparativeAnalyticsDashboard data={advancedData} />
            </div>
          )}

          {/* Push Notifications Manager */}
          {user?.id && (
            <div className="mt-8">
              <PushNotificationManager 
                userId={user.id}
                className=""
              />
            </div>
          )}
        </div>
      </SimpleDashboardLayout>
    </ProtectedRoute>
  );
}