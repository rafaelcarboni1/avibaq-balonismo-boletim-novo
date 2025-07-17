import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { PlusIcon, UsersIcon, CalendarIcon, DocumentTextIcon, BriefcaseIcon, ChartBarIcon, CurrencyDollarIcon, BuildingOfficeIcon, ClockIcon } from '@heroicons/react/24/solid';
import { EnhancedDashboardLayout } from '../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../src/components/magicui/magic-card';
import { BentoGrid, BentoGridItem } from '../../src/components/magicui/bento-grid';
import EnhancedKpiCard from '../../src/components/magicui/enhanced-kpi-card';
import LoadingSkeleton from '../../src/components/magicui/loading-skeleton';
import AnimatedChart from '../../src/components/magicui/animated-chart';
import { Button } from '../../src/components/ui/button';
import { supabase } from '../../src/integrations/supabase/client';
import { useUser } from '../../src/hooks/useUser';
import { useToast } from '../../src/hooks/use-toast';
import VooEmAndamento from '../../src/components/VooEmAndamento';
import VoosStatistics from '../../src/components/VoosStatistics';
import VoosCharts from '../../src/components/VoosCharts';

// Lazy load dos componentes pesados
const AdvancedKPICard = dynamic(() => import('../../src/components/magicui/advanced-kpi-analytics').then(mod => ({ default: mod.AdvancedKPICard })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-32" />
});

const AdvancedLineChart = dynamic(() => import('../../src/components/magicui/advanced-charts').then(mod => ({ default: mod.AdvancedLineChart })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64" />
});

const HeatmapChart = dynamic(() => import('../../src/components/magicui/advanced-charts').then(mod => ({ default: mod.HeatmapChart })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64" />
});

interface DashboardStats {
  totalPilotos: number;
  pilotosAtivos: number;
  voosEsteAno: number;
  voosEsteMes: number;
  proximoVoo: any;
  voosRecentes: any[];
  voosEmAndamento: any[];
}

export default function AgenciaDashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalPilotos: 0,
    pilotosAtivos: 0,
    voosEsteAno: 0,
    voosEsteMes: 0,
    proximoVoo: null,
    voosRecentes: [],
    voosEmAndamento: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'business' | 'team'>('overview');

  // Verificar autenticação e carregar dados
  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.push('/agencia/login');
      return;
    }

    if (user.role && user.role !== 'agencia') {
      console.log('[AgenciaDashboard] Redirecionando - role:', user.role);
      router.push('/');
      return;
    }

    // Se chegou até aqui, usuário está autenticado e é agência
    if (user.role === 'agencia') {
      carregarDashboard();
    }
  }, [user, userLoading, router]);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      
      // Buscar membro associado ao usuário
      const { data: membro, error: membroError } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user?.id)
        .eq('tipo', 'agencia')
        .single();

      if (membroError || !membro) {
        toast({
          title: "Erro",
          description: "Agência não encontrada no sistema",
          variant: "destructive"
        });
        return;
      }

      // Carregar estatísticas em paralelo
      const [
        pilotosResult,
        pilotosAtivosResult,
        voosAnoResult,
        voosMesResult,
        proximoVooResult,
        voosRecentesResult,
        voosEmAndamentoResult
      ] = await Promise.all([
        // Total de pilotos vinculados
        supabase
          .from('vinculos_agencia_piloto')
          .select('id')
          .eq('agencia_id', membro.id),
        
        // Pilotos ativos (status aceito)
        supabase
          .from('vinculos_agencia_piloto')
          .select('id')
          .eq('agencia_id', membro.id)
          .eq('status', 'aceito'),
        
        // Voos este ano
        supabase
          .from('voos')
          .select('id')
          .eq('agencia_id', membro.id)
          .gte('data_voo', new Date().getFullYear() + '-01-01'),
        
        // Voos este mês
        supabase
          .from('voos')
          .select('id')
          .eq('agencia_id', membro.id)
          .gte('data_voo', new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-01'),
        
        // Próximo voo
        supabase
          .from('voos')
          .select('*, piloto:membros!voos_piloto_id_fkey(nome)')
          .eq('agencia_id', membro.id)
          .gte('data_voo', new Date().toISOString().split('T')[0])
          .order('data_voo', { ascending: true })
          .limit(1)
          .single(),
        
        // Voos recentes (últimos 5) - apenas finalizados e cancelados
        supabase
          .from('voos')
          .select('*, piloto:membros!voos_piloto_id_fkey(nome)')
          .eq('agencia_id', membro.id)
          .in('status', ['finalizado', 'cancelado'])
          .order('data_voo', { ascending: false })
          .limit(5),
        
        // Voos em andamento da agência (rascunho até checklist_concluido)
        supabase
          .from('voos')
          .select('*, piloto:membros!voos_piloto_id_fkey(nome)')
          .eq('agencia_id', membro.id)
          .in('status', ['rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido'])
          .order('data_voo', { ascending: true })
      ]);

      setStats({
        totalPilotos: pilotosResult.data?.length || 0,
        pilotosAtivos: pilotosAtivosResult.data?.length || 0,
        voosEsteAno: voosAnoResult.data?.length || 0,
        voosEsteMes: voosMesResult.data?.length || 0,
        proximoVoo: proximoVooResult.data || null,
        voosRecentes: voosRecentesResult.data || [],
        voosEmAndamento: voosEmAndamentoResult.data || []
      });

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Memoizar o mapeamento de status para evitar recriação
  const statusDisplayMap = useMemo(() => ({
    'rascunho': { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
    'planejado': { label: 'Planejado', color: 'bg-blue-100 text-blue-800' },
    'checklist_bloco1': { label: 'Checklist 1/3', color: 'bg-yellow-100 text-yellow-800' },
    'checklist_bloco2': { label: 'Checklist 2/3', color: 'bg-yellow-100 text-yellow-800' },
    'checklist_concluido': { label: 'Checklist OK', color: 'bg-green-100 text-green-800' },
    'finalizado': { label: 'Finalizado', color: 'bg-emerald-100 text-emerald-800' },
    'cancelado': { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  }), []);

  const getStatusDisplay = (status: string) => {
    return statusDisplayMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout 
        title="Dashboard da Agência" 
        breadcrumbs={[
          { label: "Dashboard", icon: DocumentTextIcon }
        ]}
        loading={true}
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200/50">
                <LoadingSkeleton variant="card" />
              </div>
            ))}
          </div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout 
      title="Dashboard da Agência"
      breadcrumbs={[
        { label: "Dashboard", icon: DocumentTextIcon }
      ]}
    >
      <div className="space-y-8">
        
        {/* Navegação por abas */}
        <div className="flex gap-4 border-b border-gray-200">
          {[
            { key: 'overview', label: 'Visão Geral', icon: ChartBarIcon },
            { key: 'team', label: 'Equipe', icon: UsersIcon },
            { key: 'business', label: 'Business', icon: CurrencyDollarIcon }
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
              <EnhancedKpiCard 
                title="Total Pilotos"
                value={stats.totalPilotos} 
                icon={UsersIcon}
                color="blue"
                trend="up"
                trendValue="+2 este mês"
                description="Pilotos vinculados"
                delay={0}
              />

              <EnhancedKpiCard 
                title="Pilotos Ativos"
                value={stats.pilotosAtivos}
                icon={BriefcaseIcon}
                color="green"
                trend="up"
                trendValue="87% ativo"
                description="Pilotos trabalhando"
                delay={0.05}
              />

              <EnhancedKpiCard 
                title="Voos Este Ano"
                value={stats.voosEsteAno}
                icon={CalendarIcon}
                color="purple"
                trend="up"
                trendValue="+22% vs 2023"
                description="Operações anuais"
                delay={0.1}
              />

              <EnhancedKpiCard 
                title="Voos Este Mês"
                value={stats.voosEsteMes}
                icon={DocumentTextIcon}
                color="yellow"
                trend={stats.voosEsteMes > 0 ? "up" : "neutral"}
                trendValue={stats.voosEsteMes > 0 ? "Ativo" : "Inativo"}
                description="Operações mensais"
                delay={0.15}
              />
            </div>

            {/* Gráficos e Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatedChart
                title="Receita por Mês"
                type="line"
                data={[
                  { name: 'Jan', value: 32000 },
                  { name: 'Fev', value: 28000 },
                  { name: 'Mar', value: 35000 },
                  { name: 'Abr', value: 42000 },
                  { name: 'Mai', value: 48000 },
                  { name: 'Jun', value: stats.voosEsteMes * 2500 },
                ]}
                colors={["#8b5cf6"]}
              />
              
              <AnimatedChart
                title="Distribuição da Equipe"
                type="pie"
                data={[
                  { name: 'Pilotos Ativos', value: stats.pilotosAtivos },
                  { name: 'Convites Pendentes', value: stats.totalPilotos - stats.pilotosAtivos },
                ]}
                colors={["#10b981", "#f59e0b"]}
              />
            </div>
            
            {/* Seção Voos em Andamento da Equipe */}
            {stats.voosEmAndamento.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <ClockIcon className="h-6 w-6 text-blue-500" />
                  Voos em Andamento da Equipe ({stats.voosEmAndamento.length})
                </h3>
                <div className="grid gap-4">
                  {stats.voosEmAndamento.map((voo) => (
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
          </div>
        )}

        {/* Aba de Equipe */}
        {activeTab === 'team' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <EnhancedKpiCard 
                title="Pilotos Ativos"
                value={stats.pilotosAtivos} 
                icon={UsersIcon}
                color="green"
                trend="up"
                trendValue="87% da equipe"
                description="Trabalhando ativamente"
                delay={0}
              />
              
              <EnhancedKpiCard 
                title="Convites Pendentes"
                value={stats.totalPilotos - stats.pilotosAtivos}
                icon={PlusIcon}
                color="yellow"
                trend={stats.totalPilotos - stats.pilotosAtivos > 0 ? "up" : "neutral"}
                trendValue={stats.totalPilotos - stats.pilotosAtivos > 0 ? "Aguardando" : "Em dia"}
                description="Respostas pendentes"
                delay={0.05}
              />
              
              <EnhancedKpiCard 
                title="Voos Este Mês"
                value={stats.voosEsteMes}
                icon={CalendarIcon}
                color="blue"
                trend={stats.voosEsteMes > 0 ? "up" : "neutral"}
                trendValue="Por piloto ativo"
                description="Produtividade da equipe"
                delay={0.1}
              />
            </div>
          </div>
        )}

        {/* Aba de Business Analytics */}
        {activeTab === 'business' && (
          <div className="space-y-8">
            {/* Estatísticas de Voos */}
            <VoosStatistics periodo="trimestre" />
            
            {/* Gráficos de Voos */}
            <VoosCharts />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AdvancedKPICard
                title="Receita Mensal"
                metric={{
                  value: 45750,
                  target: 50000,
                  previousValue: 38200,
                  format: 'currency'
                }}
                icon={CurrencyDollarIcon}
                color="green"
                description="Receita este mês"
              />
              
              <AdvancedKPICard
                title="Taxa de Ocupação"
                metric={{
                  value: 78.5,
                  target: 80,
                  previousValue: 73.2,
                  format: 'percentage'
                }}
                icon={CalendarIcon}
                color="blue"
                description="Voos vs. Capacidade"
              />
              
              <AdvancedKPICard
                title="Satisfação Cliente"
                metric={{
                  value: 4.8,
                  target: 4.5,
                  previousValue: 4.6,
                  unit: '/5'
                }}
                icon={UsersIcon}
                color="yellow"
                description="Avaliação média"
              />
              
              <AdvancedKPICard
                title="ROI Operacional"
                metric={{
                  value: 28.3,
                  target: 25,
                  previousValue: 24.1,
                  format: 'percentage'
                }}
                icon={ChartBarIcon}
                color="purple"
                description="Retorno sobre investimento"
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedLineChart
                title="Receita por Mês - Últimos 12 Meses"
                data={[
                  { name: 'Jan', value: 32000 },
                  { name: 'Fev', value: 28000 },
                  { name: 'Mar', value: 35000 },
                  { name: 'Abr', value: 42000 },
                  { name: 'Mai', value: 48000 },
                  { name: 'Jun', value: 45750 }
                ]}
                type="line"
                colors={['#8b5cf6']}
                height={300}
              />
              
              <HeatmapChart
                title="Demanda por Horário da Semana"
                data={[
                  { day: 'Seg', hour: 9, value: 2 },
                  { day: 'Seg', hour: 15, value: 3 },
                  { day: 'Ter', hour: 10, value: 1 },
                  { day: 'Qua', hour: 14, value: 2 },
                  { day: 'Qui', hour: 16, value: 4 },
                  { day: 'Sex', hour: 9, value: 3 },
                  { day: 'Sex', hour: 17, value: 5 },
                  { day: 'Sáb', hour: 8, value: 8 },
                  { day: 'Sáb', hour: 10, value: 12 },
                  { day: 'Sáb', hour: 14, value: 15 },
                  { day: 'Sáb', hour: 16, value: 18 },
                  { day: 'Dom', hour: 9, value: 10 },
                  { day: 'Dom', hour: 11, value: 14 },
                  { day: 'Dom', hour: 15, value: 16 }
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </EnhancedDashboardLayout>
  );
}