import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

import { PlusIcon, ClipboardDocumentListIcon, CalendarIcon, DocumentTextIcon, ShieldCheckIcon, ChartBarIcon, UserIcon, ClockIcon, WifiIcon, SignalSlashIcon } from '@heroicons/react/24/solid';
import { EnhancedDashboardLayout } from '../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../src/components/magicui/magic-card';
import { BentoGrid, BentoGridItem } from '../../src/components/magicui/bento-grid';
import SimpleKpiCard from '../../src/components/SimpleKpiCard';
import LoadingSkeleton from '../../src/components/magicui/loading-skeleton';

import { Button } from '../../src/components/ui/button';
import { supabase } from '../../src/integrations/supabase/client';
import { useUser } from '../../src/hooks/useUser';
import { useToast } from '../../src/hooks/use-toast';
import { useRouterDebug } from '../../src/hooks/useRouterDebug';
import VooEmAndamento from '../../src/components/VooEmAndamento';
import VoosStatistics from '../../src/components/VoosStatistics';
import VoosCharts from '../../src/components/VoosCharts';
import { formatDateSafe } from '../../src/utils/dateUtils';

// Lazy load dos componentes pesados
const AdvancedKPICard = dynamic(() => import('../../src/components/magicui/advanced-kpi-analytics').then(mod => ({ default: mod.AdvancedKPICard })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-32" />
});

const AdvancedLineChart = dynamic(() => import('../../src/components/magicui/advanced-charts').then(mod => ({ default: mod.AdvancedLineChart })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64" />
});

const GaugeChart = dynamic(() => import('../../src/components/magicui/advanced-charts').then(mod => ({ default: mod.GaugeChart })), {
  loading: () => <div className="animate-pulse bg-gray-200 rounded-lg h-64" />
});

interface DashboardStats {
  totalBaloes: number;
  voosEsteAno: number;
  voosEsteMes: number;
  convitesPendentes: number;
  proximoVoo: any;
  voosRecentes: any[];
  voosEmAndamento: any[];
  horasVoo: {
    ultimaSemana: number;
    ultimoMes: number;
    esteAno: number;
    total: number;
  };
}

interface OfflineData extends DashboardStats {
  timestamp: string;
  userId: string;
}

export default function PilotoDashboard() {
  const router = useRouterDebug();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalBaloes: 0,
    voosEsteAno: 0,
    voosEsteMes: 0,
    convitesPendentes: 0,
    proximoVoo: null,
    voosRecentes: [],
    voosEmAndamento: [],
    horasVoo: {
      ultimaSemana: 0,
      ultimoMes: 0,
      esteAno: 0,
      total: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'voos'>('overview');
  const [isOnline, setIsOnline] = useState(true);
  const [offlineData, setOfflineData] = useState<OfflineData | null>(null);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Recarregar dados quando voltar online
      if (user?.role === 'piloto') {
        carregarDashboard();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Carregar dados offline do localStorage
  useEffect(() => {
    if (!isOnline) {
      loadOfflineData();
    }
  }, [isOnline]);

  // Verificar autenticação e carregar dados
  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      router.push('/piloto/login');
      return;
    }

    // Só redireciona se o role estiver carregado E for diferente de piloto
    if (user.role && user.role !== 'piloto') {
      console.log('[Dashboard] Redirecionando - role:', user.role);
      router.push('/');
      return;
    }

    // Se chegou até aqui, usuário está autenticado e é piloto
    if (user.role === 'piloto') {
      if (isOnline) {
        carregarDashboard();
      } else {
        loadOfflineData();
      }
    }
  }, [user, userLoading, isOnline]); // Removido router das dependências

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      
      // Buscar membro associado ao usuário
      const { data: membro, error: membroError } = await supabase
        .from('membros')
        .select('id')
        .eq('user_id', user?.id)
        .eq('tipo', 'piloto')
        .single();

      if (membroError || !membro) {
        toast({
          title: "Erro",
          description: "Piloto não encontrado no sistema",
          variant: "destructive"
        });
        return;
      }

      // Carregar estatísticas em paralelo
      const [
        baloesResult,
        voosAnoResult,
        voosMesResult,
        convitesResult,
        proximoVooResult,
        voosRecentesResult,
        voosEmAndamentoResult,
        voosComDuracaoResult
      ] = await Promise.all([
        // Total de balões ativos
        supabase
          .from('baloes')
          .select('id')
          .eq('proprietario_id', membro.id)
          .eq('ativo', true),
        
        // Voos este ano
        supabase
          .from('voos')
          .select('id')
          .eq('piloto_id', membro.id)
          .gte('data_voo', new Date().getFullYear() + '-01-01'),
        
        // Voos este mês
        supabase
          .from('voos')
          .select('id')
          .eq('piloto_id', membro.id)
          .gte('data_voo', new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-01'),
        
        // Convites pendentes
        supabase
          .from('vinculos_agencia_piloto')
          .select('id')
          .eq('piloto_id', membro.id)
          .eq('status', 'pendente'),
        
        // Próximo voo
        supabase
          .from('voos')
          .select('*, agencia:membros!voos_agencia_id_fkey(nome_completo)')
          .eq('piloto_id', membro.id)
          .gte('data_voo', new Date().toISOString().split('T')[0])
          .order('data_voo', { ascending: true })
          .limit(1)
          .single(),
        
        // Voos recentes (últimos 5) - apenas finalizados e cancelados
        supabase
          .from('voos')
          .select('*, agencia:membros!voos_agencia_id_fkey(nome_completo)')
          .eq('piloto_id', membro.id)
          .in('status', ['finalizado', 'cancelado'])
          .order('data_voo', { ascending: false })
          .limit(5),
        
        // Voos em andamento (rascunho até checklist_concluido)
        supabase
          .from('voos')
          .select('*, agencia:membros!voos_agencia_id_fkey(nome_completo)')
          .eq('piloto_id', membro.id)
          .in('status', ['rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido'])
          .order('data_voo', { ascending: true }),
        
        // Voos finalizados com duração para cálculo de horas
        supabase
          .from('voos')
          .select('data_voo, duracao_minutos')
          .eq('piloto_id', membro.id)
          .eq('status', 'finalizado')
          .not('duracao_minutos', 'is', null)
      ]);

      // Debug logs para investigar o problema
      console.log('[Dashboard Debug] Membro ID:', membro.id);
      console.log('[Dashboard Debug] Voos em andamento result:', voosEmAndamentoResult);
      console.log('[Dashboard Debug] Voos em andamento data:', voosEmAndamentoResult.data);
      console.log('[Dashboard Debug] Voos em andamento error:', voosEmAndamentoResult.error);
      
      // Calcular horas de voo por período
      const voosComDuracao = voosComDuracaoResult.data || [];
      const agora = new Date();
      const umaSemanaAtras = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
      const umMesAtras = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
      const inicioAno = new Date(agora.getFullYear(), 0, 1);

      const horasVoo = {
        ultimaSemana: Math.round(voosComDuracao
          .filter(voo => new Date(voo.data_voo) >= umaSemanaAtras)
          .reduce((sum, voo) => sum + (voo.duracao_minutos || 0), 0) / 60 * 10) / 10,
        ultimoMes: Math.round(voosComDuracao
          .filter(voo => new Date(voo.data_voo) >= umMesAtras)
          .reduce((sum, voo) => sum + (voo.duracao_minutos || 0), 0) / 60 * 10) / 10,
        esteAno: Math.round(voosComDuracao
          .filter(voo => new Date(voo.data_voo) >= inicioAno)
          .reduce((sum, voo) => sum + (voo.duracao_minutos || 0), 0) / 60 * 10) / 10,
        total: Math.round(voosComDuracao
          .reduce((sum, voo) => sum + (voo.duracao_minutos || 0), 0) / 60 * 10) / 10
      };
      
      const statsData = {
        totalBaloes: baloesResult.data?.length || 0,
        voosEsteAno: voosAnoResult.data?.length || 0,
        voosEsteMes: voosMesResult.data?.length || 0,
        convitesPendentes: convitesResult.data?.length || 0,
        proximoVoo: proximoVooResult.data || null,
        voosRecentes: voosRecentesResult.data || [],
        voosEmAndamento: voosEmAndamentoResult.data || [],
        horasVoo
      };
      
      console.log('[Dashboard Debug] Stats finais:', statsData);
      setStats(statsData);
      
      // Salvar dados offline para uso posterior
      saveOfflineData(statsData);

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      
      // Se falhou e estamos offline, tentar carregar dados salvos
      if (!isOnline) {
        loadOfflineData();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do dashboard",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Funções de gerenciamento offline
  const saveOfflineData = (data: DashboardStats) => {
    try {
      const offlineData = {
        ...data,
        timestamp: new Date().toISOString(),
        userId: user?.id
      };
      localStorage.setItem('piloto_dashboard_offline', JSON.stringify(offlineData));
    } catch (error) {
      console.error('Erro ao salvar dados offline:', error);
    }
  };

  const loadOfflineData = () => {
    try {
      const savedData = localStorage.getItem('piloto_dashboard_offline');
      if (!savedData) {
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(savedData);
      
      // Verificar se os dados são do usuário atual
      if (parsed.userId !== user?.id) {
        setLoading(false);
        return;
      }

      // Verificar idade dos dados (máximo 24 horas)
      const dataAge = new Date().getTime() - new Date(parsed.timestamp).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 horas

      if (dataAge > maxAge) {
        localStorage.removeItem('piloto_dashboard_offline');
        setLoading(false);
        return;
      }

      // Carregar dados offline
      const offlineStats = {
        totalBaloes: parsed.totalBaloes || 0,
        voosEsteAno: parsed.voosEsteAno || 0,
        voosEsteMes: parsed.voosEsteMes || 0,
        convitesPendentes: parsed.convitesPendentes || 0,
        proximoVoo: parsed.proximoVoo || null,
        voosRecentes: parsed.voosRecentes || [],
        voosEmAndamento: parsed.voosEmAndamento || [],
        horasVoo: parsed.horasVoo || {
          ultimaSemana: 0,
          ultimoMes: 0,
          esteAno: 0,
          total: 0
        }
      };

      setStats(offlineStats);
      setOfflineData(parsed); // Usar os dados completos com timestamp
      
      toast({
        title: "Modo offline",
        description: "Dados carregados do cache local. Algumas informações podem estar desatualizadas.",
        variant: "default"
      });

    } catch (error) {
      console.error('Erro ao carregar dados offline:', error);
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
        title="Dashboard do Piloto" 
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
      title="Dashboard do Piloto"
      breadcrumbs={[
        { label: "Dashboard", icon: DocumentTextIcon }
      ]}
    >
      <div className="space-y-8">
        
        {/* Notificação de modo offline */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <SignalSlashIcon className="h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800">
                  Modo Offline Ativo
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Você pode continuar trabalhando nos checklists e pós-voo. Os dados serão sincronizados automaticamente quando a conexão for restaurada.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Header com status de conexão */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard do Piloto</h1>
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                isOnline 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isOnline ? (
                  <WifiIcon className="h-3 w-3" />
                ) : (
                  <SignalSlashIcon className="h-3 w-3" />
                )}
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </div>
            </div>
            <p className="text-gray-600 mt-1">
              Bem-vindo de volta, {user?.nome || 'Piloto'}!
              {!isOnline && offlineData && (
                <span className="text-amber-600 ml-2">
                  (Dados em cache - última atualização: {new Date(offlineData.timestamp || '').toLocaleString()})
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/piloto/planejamento')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                isOnline 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
              disabled={!isOnline}
              title={!isOnline ? 'Funcionalidade disponível apenas online' : ''}
            >
              <PlusIcon className="h-5 w-5" />
              <span>Novo Voo</span>
            </button>
          </div>
        </div>
        
        {/* Navegação por abas */}
        <div className="flex gap-4 border-b border-gray-200">
          {[
            { key: 'overview', label: 'Visão Geral', icon: ChartBarIcon },
            { key: 'voos', label: 'Meus Voos', icon: CalendarIcon },
            { key: 'analytics', label: 'Performance', icon: ShieldCheckIcon }
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
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Estatísticas Avançadas */}
            <VoosStatistics periodo="mes" />
            
            {/* Gráficos e Visualizações */}
            <VoosCharts />

            {/* KPIs Avançados de Performance do Piloto */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ChartBarIcon className="h-6 w-6 text-blue-500" />
                Performance Analytics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AdvancedKPICard
                  title="Safety Score"
                  metric={{
                    value: 96.8,
                    target: 95,
                    previousValue: 94.2,
                    format: 'percentage'
                  }}
                  icon={ShieldCheckIcon}
                  color="green"
                  description="Score de segurança"
                />
                
                <AdvancedKPICard
                  title="Tempo Médio de Voo"
                  metric={{
                    value: 2.4,
                    previousValue: 2.1,
                    format: 'time'
                  }}
                  icon={CalendarIcon}
                  color="blue"
                  description="Duração média"
                />
                
                <AdvancedKPICard
                  title="Taxa de Compliance"
                  metric={{
                    value: 98.5,
                    target: 95,
                    previousValue: 97.8,
                    format: 'percentage'
                  }}
                  icon={ClipboardDocumentListIcon}
                  color="purple"
                  description="Checklists completos"
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GaugeChart
                  title="Performance Geral"
                  value={94.2}
                  max={100}
                  colors={['#ef4444', '#f59e0b', '#10b981']}
                />
                
                <AdvancedLineChart
                  title="Voos por Mês - Últimos 6 Meses"
                  data={[
                    { name: 'Jan', value: 8 },
                    { name: 'Fev', value: 12 },
                    { name: 'Mar', value: 15 },
                    { name: 'Abr', value: 18 },
                    { name: 'Mai', value: 22 },
                    { name: 'Jun', value: 25 }
                  ]}
                  type="line"
                  colors={['#3b82f6']}
                  height={250}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'voos' && (
          <div className="space-y-8">
            {/* Seção Voos Pendentes - Destaque para voos que precisam ser continuados */}
            {stats.voosEmAndamento.filter(voo => ['rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido'].includes(voo.status)).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-orange-500" />
                  Voos Pendentes ({stats.voosEmAndamento.filter(voo => ['rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido'].includes(voo.status)).length})
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Voos que precisam ser continuados ou finalizados
                </p>
                <div className="grid gap-4">
                  {stats.voosEmAndamento
                    .filter(voo => ['rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido'].includes(voo.status))
                    .map((voo) => (
                    <div key={voo.id} className="bg-white rounded-xl border border-orange-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {formatDateSafe(voo.data_voo)}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              voo.status === 'planejado' ? 'bg-blue-100 text-blue-800' :
                              voo.status === 'checklist_bloco1' ? 'bg-yellow-100 text-yellow-800' :
                              voo.status === 'checklist_bloco2' ? 'bg-yellow-100 text-yellow-800' :
                              voo.status === 'checklist_concluido' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {getStatusDisplay(voo.status).label}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Período:</strong> {voo.periodo === 'manha' ? 'Manhã' : 'Tarde'} • {voo.horario_previsto}</p>
                            <p><strong>Local:</strong> {voo.local_decolagem_previsto}</p>
                            {voo.agencia && (
                              <p><strong>Agência:</strong> {voo.agencia.nome}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        {voo.status === 'checklist_concluido' && (
                          <button
                            onClick={() => router.push(`/piloto/pos-voo/${voo.id}`)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              isOnline 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                            title={!isOnline ? 'Funciona offline - dados serão sincronizados quando voltar online' : ''}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Finalizar Voo
                            {!isOnline && <SignalSlashIcon className="h-3 w-3 opacity-70" />}
                          </button>
                        )}
                        {['checklist_bloco1', 'checklist_bloco2'].includes(voo.status) && (
                          <button
                            onClick={() => router.push(`/piloto/checklist/${voo.id}`)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              isOnline 
                                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                                : 'bg-yellow-600 text-white hover:bg-yellow-700'
                            }`}
                            title={!isOnline ? 'Funciona offline - dados serão sincronizados quando voltar online' : ''}
                          >
                            <ClipboardDocumentListIcon className="h-4 w-4" />
                            Continuar Checklist
                            {!isOnline && <SignalSlashIcon className="h-3 w-3 opacity-70" />}
                          </button>
                        )}
                        {voo.status === 'planejado' && (
                          <button
                            onClick={() => router.push(`/piloto/checklist/${voo.id}`)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              isOnline 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                            title={!isOnline ? 'Funciona offline - dados serão sincronizados quando voltar online' : ''}
                          >
                            <ClipboardDocumentListIcon className="h-4 w-4" />
                            Iniciar Checklist
                            {!isOnline && <SignalSlashIcon className="h-3 w-3 opacity-70" />}
                          </button>
                        )}
                        {voo.status === 'rascunho' && (
                          <button
                            onClick={() => router.push(`/piloto/checklist/${voo.id}`)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              isOnline 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                            title={!isOnline ? 'Funciona offline - dados serão sincronizados quando voltar online' : ''}
                          >
                            <ClipboardDocumentListIcon className="h-4 w-4" />
                            Iniciar Checklist
                            {!isOnline && <SignalSlashIcon className="h-3 w-3 opacity-70" />}
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/piloto/planejamento?edit=${voo.id}`)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                            isOnline 
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!isOnline}
                          title={!isOnline ? 'Edição disponível apenas online' : ''}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



            <div className="grid lg:grid-cols-2 gap-6">
              {/* Próximo voo */}
              <MagicCard className="p-6 bg-white">
                <h3 className="text-lg font-semibold mb-4">Próximo Voo</h3>
                {stats.proximoVoo ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {formatDateSafe(stats.proximoVoo.data_voo)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {stats.proximoVoo.periodo === 'manha' ? 'Manhã' : 'Tarde'} • {stats.proximoVoo.horario_previsto}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusDisplay(stats.proximoVoo.status).color}`}>
                        {getStatusDisplay(stats.proximoVoo.status).label}
                      </span>
                    </div>
                    <p className="text-sm">{stats.proximoVoo.local_decolagem_previsto}</p>
                    {stats.proximoVoo.agencia && (
                      <p className="text-sm text-gray-600">
                        Agência: {stats.proximoVoo.agencia.nome}
                      </p>
                    )}
                    
                    <div className="flex gap-2 mt-4">
                      {stats.proximoVoo.status === 'checklist_concluido' && (
                        <button
                          onClick={() => router.push(`/piloto/pos-voo/${stats.proximoVoo.id}`)}
                          className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                            isOnline 
                              ? 'bg-green-600 text-white hover:bg-green-700' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                          title={!isOnline ? 'Funciona offline - dados serão sincronizados quando voltar online' : ''}
                        >
                          Finalizar Voo
                          {!isOnline && <SignalSlashIcon className="h-3 w-3 opacity-70" />}
                        </button>
                      )}
                      {['checklist_bloco1', 'checklist_bloco2'].includes(stats.proximoVoo.status) && (
                        <button
                          onClick={() => router.push(`/piloto/checklist/${stats.proximoVoo.id}`)}
                          className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                            isOnline 
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                              : 'bg-yellow-600 text-white hover:bg-yellow-700'
                          }`}
                          title={!isOnline ? 'Funciona offline - dados serão sincronizados quando voltar online' : ''}
                        >
                          Continuar Checklist
                          {!isOnline && <SignalSlashIcon className="h-3 w-3 opacity-70" />}
                        </button>
                      )}
                      {stats.proximoVoo.status === 'planejado' && (
                        <button
                          onClick={() => router.push(`/piloto/checklist/${stats.proximoVoo.id}`)}
                          className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                            isOnline 
                              ? 'bg-blue-600 text-white hover:bg-blue-700' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                          title={!isOnline ? 'Funciona offline - dados serão sincronizados quando voltar online' : ''}
                        >
                          Iniciar Checklist
                          {!isOnline && <SignalSlashIcon className="h-3 w-3 opacity-70" />}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhum voo agendado</p>
                    <button
                      onClick={() => router.push('/piloto/planejamento')}
                      className="mt-2 text-primary hover:underline text-sm"
                    >
                      Planejar novo voo
                    </button>
                  </div>
                )}
              </MagicCard>

              {/* Voos recentes */}
              <MagicCard className="p-6 bg-white">
                <h3 className="text-lg font-semibold mb-4">Voos Recentes</h3>
                {stats.voosRecentes.length > 0 ? (
                  <div className="space-y-3">
                    {stats.voosRecentes.map((voo) => (
                      <div key={voo.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow">
                        <div>
                          <p className="font-medium text-sm">
                            {formatDateSafe(voo.data_voo)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {voo.periodo === 'manha' ? 'Manhã' : 'Tarde'} • {voo.local_decolagem_previsto}
                          </p>
                          {voo.agencia && (
                            <p className="text-xs text-gray-500">{voo.agencia.nome}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusDisplay(voo.status).color}`}>
                          {getStatusDisplay(voo.status).label}
                        </span>
                      </div>
                    ))}
                    <div className="text-center mt-4">
                      <button
                        onClick={() => router.push('/piloto/historico')}
                        className="text-primary hover:underline text-sm"
                      >
                        Ver todos os voos
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhum voo realizado ainda</p>
                  </div>
                )}
              </MagicCard>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Destaque: Horas de Voo */}
            <div className="mb-8">
              <MagicCard className="p-8 bg-gradient-to-br from-blue-600 to-purple-700 text-white relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <ClockIcon className="h-32 w-32" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <ClockIcon className="h-8 w-8 text-blue-200" />
                    <h2 className="text-2xl font-bold">Horas de Voo</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-3xl font-bold text-white mb-1">{stats.horasVoo.ultimaSemana}h</p>
                        <p className="text-blue-100 text-sm font-medium">Última Semana</p>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-3xl font-bold text-white mb-1">{stats.horasVoo.ultimoMes}h</p>
                        <p className="text-blue-100 text-sm font-medium">Último Mês</p>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-3xl font-bold text-white mb-1">{stats.horasVoo.esteAno}h</p>
                        <p className="text-blue-100 text-sm font-medium">Este Ano</p>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-white/30 rounded-xl p-4 backdrop-blur-sm border-2 border-yellow-300/50">
                        <p className="text-4xl font-bold text-yellow-200 mb-1">{stats.horasVoo.total}h</p>
                        <p className="text-yellow-100 text-sm font-medium">🏆 Total</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-100">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="text-sm">
                        {stats.horasVoo.ultimoMes > 0 ? 
                          `Média de ${Math.round(stats.horasVoo.ultimoMes / 4 * 10) / 10}h por semana` : 
                          'Comece voando para ver suas estatísticas'
                        }
                      </span>
                    </div>
                    
                    <button
                      onClick={() => router.push('/piloto/historico')}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors backdrop-blur-sm border border-white/30"
                    >
                      Ver Histórico Completo
                    </button>
                  </div>
                </div>
              </MagicCard>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <SimpleKpiCard 
                title="Voos Pendentes"
                value={stats.voosEmAndamento.filter(voo => ['rascunho', 'planejado', 'checklist_bloco1', 'checklist_bloco2', 'checklist_concluido'].includes(voo.status)).length}
                icon={ClipboardDocumentListIcon}
                color="orange"
                description="Precisam ser continuados"
              />

              <SimpleKpiCard 
                title="Balões Ativos"
                value={stats.totalBaloes} 
                icon={UserIcon}
                color="blue"
                description="Balões cadastrados"
              />

              <SimpleKpiCard 
                title="Voos Este Ano"
                value={stats.voosEsteAno}
                icon={CalendarIcon}
                color="green"
                description="Total de voos realizados"
              />

              <SimpleKpiCard 
                title="Convites Pendentes"
                value={stats.convitesPendentes}
                icon={ClipboardDocumentListIcon}
                color="yellow"
                description="Convites de agências"
              />
            </div>

            {/* Estatísticas Simples */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MagicCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Resumo de Voos</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Este Ano:</span>
                    <span className="font-semibold">{stats.voosEsteAno} voos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Este Mês:</span>
                    <span className="font-semibold">{stats.voosEsteMes} voos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balões Ativos:</span>
                    <span className="font-semibold">{stats.totalBaloes}</span>
                  </div>
                </div>
              </MagicCard>
              
              <MagicCard className="p-6">
                <h3 className="text-lg font-semibold mb-4">Status Atual</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Convites Pendentes:</span>
                    <span className={`font-semibold ${stats.convitesPendentes > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {stats.convitesPendentes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold ${stats.voosEsteMes > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                      {stats.voosEsteMes > 0 ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </MagicCard>
            </div>

            {/* Bento Grid Layout */}
            <BentoGrid className="md:auto-rows-[20rem]">

            {/* Ações rápidas */}
            <BentoGridItem
              className="md:col-span-2"
              title="Ações Rápidas"
              description={
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      console.log('[PilotoDashboard] Navegando para planejamento');
                      router.push('/piloto/planejamento');
                    }}
                    className="flex items-center gap-2 p-4 h-auto flex-col"
                    variant="outline"
                  >
                    <PlusIcon className="h-6 w-6" />
                    <span className="font-medium">Planejar Voo</span>
                    <span className="text-sm text-gray-500">Criar novo planejamento</span>
                  </Button>
                  
                  <Button
                    onClick={() => {
                      console.log('[PilotoDashboard] Navegando para meus-baloes');
                      router.push('/piloto/meus-baloes');
                    }}
                    className="flex items-center gap-2 p-4 h-auto flex-col"
                    variant="outline"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="font-medium">Meus Balões</span>
                    <span className="text-sm text-gray-500">Gerenciar frota</span>
                  </Button>
                  
                  <Button
                    onClick={() => {
                      console.log('[PilotoDashboard] Navegando para convites');
                      router.push('/piloto/convites');
                    }}
                    className="flex items-center gap-2 p-4 h-auto flex-col"
                    variant="outline"
                  >
                    <ClipboardDocumentListIcon className="h-6 w-6" />
                    <span className="font-medium">Convites</span>
                    <span className="text-sm text-gray-500">Ver convites de agências</span>
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/piloto/historico')}
                    className="flex items-center gap-2 p-4 h-auto flex-col"
                    variant="outline"
                  >
                    <DocumentTextIcon className="h-6 w-6" />
                    <span className="font-medium">Histórico</span>
                    <span className="text-sm text-gray-500">Ver voos anteriores</span>
                  </Button>
                </div>
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl items-center justify-center">
                  <PlusIcon className="h-10 w-10 text-white" />
                </div>
              }
              icon={<PlusIcon className="h-6 w-6 text-blue-500" />}
            />

            </BentoGrid>
          </div>
        )}
      </div>
    </EnhancedDashboardLayout>
  );
}