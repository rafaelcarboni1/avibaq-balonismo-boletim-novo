import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PlusIcon, ClipboardDocumentListIcon, CalendarIcon, DocumentTextIcon, ShieldCheckIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { EnhancedDashboardLayout } from '../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../src/components/magicui/magic-card';
import { BentoGrid, BentoGridItem } from '../../src/components/magicui/bento-grid';
import { NumberTicker } from '../../src/components/magicui/number-ticker';
import { OfflineIndicator } from '../../src/components/magicui/offline-indicator';
import { AdvancedKPICard } from '../../src/components/magicui/advanced-kpi-analytics';
import { AdvancedLineChart, GaugeChart } from '../../src/components/magicui/advanced-charts';
import { supabase } from '../../src/integrations/supabase/client';
import { useUser } from '../../src/hooks/useUser';
import { useToast } from '../../src/hooks/use-toast';

interface DashboardStats {
  totalBaloes: number;
  voosEsteAno: number;
  voosEsteMes: number;
  convitesPendentes: number;
  proximoVoo: any;
  voosRecentes: any[];
}

export default function PilotoDashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalBaloes: 0,
    voosEsteAno: 0,
    voosEsteMes: 0,
    convitesPendentes: 0,
    proximoVoo: null,
    voosRecentes: []
  });
  const [loading, setLoading] = useState(true);

  // Verificar se usuário está autenticado e é piloto
  useEffect(() => {
    if (!userLoading && (!user || user.role !== 'piloto')) {
      router.push('/piloto/login');
      return;
    }
  }, [user, userLoading, router]);

  // Carregar dados do dashboard
  useEffect(() => {
    if (user) {
      carregarDashboard();
    }
  }, [user]);

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
        voosRecentesResult
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
          .select('*, agencia:membros!voos_agencia_id_fkey(nome)')
          .eq('piloto_id', membro.id)
          .gte('data_voo', new Date().toISOString().split('T')[0])
          .order('data_voo', { ascending: true })
          .limit(1)
          .single(),
        
        // Voos recentes (últimos 5)
        supabase
          .from('voos')
          .select('*, agencia:membros!voos_agencia_id_fkey(nome)')
          .eq('piloto_id', membro.id)
          .order('data_voo', { ascending: false })
          .limit(5)
      ]);

      setStats({
        totalBaloes: baloesResult.data?.length || 0,
        voosEsteAno: voosAnoResult.data?.length || 0,
        voosEsteMes: voosMesResult.data?.length || 0,
        convitesPendentes: convitesResult.data?.length || 0,
        proximoVoo: proximoVooResult.data || null,
        voosRecentes: voosRecentesResult.data || []
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

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      'rascunho': { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
      'planejado': { label: 'Planejado', color: 'bg-blue-100 text-blue-800' },
      'checklist_bloco1': { label: 'Checklist 1/3', color: 'bg-yellow-100 text-yellow-800' },
      'checklist_bloco2': { label: 'Checklist 2/3', color: 'bg-yellow-100 text-yellow-800' },
      'checklist_concluido': { label: 'Checklist OK', color: 'bg-green-100 text-green-800' },
      'finalizado': { label: 'Finalizado', color: 'bg-emerald-100 text-emerald-800' },
      'cancelado': { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout title="Dashboard" loading={true}>
        <div>Carregando...</div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Dashboard do Piloto">
      <div className="space-y-8">
        {/* Indicador offline */}
        <OfflineIndicator showDetails={true} />
        
        {/* Estatísticas principais */}
        <BentoGrid className="grid-cols-2 lg:grid-cols-4 gap-6">
          <BentoGridItem className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Balões Ativos</p>
                  <NumberTicker 
                    value={stats.totalBaloes} 
                    className="text-2xl font-bold text-blue-900"
                  />
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-gradient-to-br from-green-50 to-green-100">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Voos Este Ano</p>
                  <NumberTicker 
                    value={stats.voosEsteAno} 
                    className="text-2xl font-bold text-green-900"
                  />
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Voos Este Mês</p>
                  <NumberTicker 
                    value={stats.voosEsteMes} 
                    className="text-2xl font-bold text-purple-900"
                  />
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-gradient-to-br from-amber-50 to-amber-100">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Convites Pendentes</p>
                  <NumberTicker 
                    value={stats.convitesPendentes} 
                    className="text-2xl font-bold text-amber-900"
                  />
                </div>
                <div className="h-12 w-12 bg-amber-500 rounded-lg flex items-center justify-center">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </BentoGridItem>
        </BentoGrid>

        {/* Ações rápidas */}
        <MagicCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/piloto/planejamento')}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors group"
            >
              <PlusIcon className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Planejar Voo</p>
              <p className="text-sm text-gray-600">Criar novo planejamento</p>
            </button>

            <button
              onClick={() => router.push('/piloto/meus-baloes')}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors group"
            >
              <svg className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <p className="font-medium">Meus Balões</p>
              <p className="text-sm text-gray-600">Gerenciar frota</p>
            </button>

            <button
              onClick={() => router.push('/piloto/convites')}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors group"
            >
              <ClipboardDocumentListIcon className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Convites</p>
              <p className="text-sm text-gray-600">Ver convites de agências</p>
            </button>

            <button
              onClick={() => router.push('/piloto/historico')}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors group"
            >
              <DocumentTextIcon className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Histórico</p>
              <p className="text-sm text-gray-600">Ver voos anteriores</p>
            </button>
          </div>
        </MagicCard>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Próximo voo */}
          <MagicCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Próximo Voo</h3>
            {stats.proximoVoo ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {new Date(stats.proximoVoo.data_voo).toLocaleDateString('pt-BR')}
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
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Finalizar Voo
                    </button>
                  )}
                  {['checklist_bloco1', 'checklist_bloco2'].includes(stats.proximoVoo.status) && (
                    <button
                      onClick={() => router.push(`/piloto/checklist/${stats.proximoVoo.id}`)}
                      className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                    >
                      Continuar Checklist
                    </button>
                  )}
                  {stats.proximoVoo.status === 'planejado' && (
                    <button
                      onClick={() => router.push(`/piloto/checklist/${stats.proximoVoo.id}`)}
                      className="bg-primary text-white px-3 py-1 rounded text-sm hover:bg-primary/90 transition-colors"
                    >
                      Iniciar Checklist
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
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
          <MagicCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Voos Recentes</h3>
            {stats.voosRecentes.length > 0 ? (
              <div className="space-y-3">
                {stats.voosRecentes.map((voo) => (
                  <div key={voo.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(voo.data_voo).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-600">
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
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum voo realizado ainda</p>
              </div>
            )}
          </MagicCard>
        </div>

        {/* KPIs Avançados de Performance do Piloto */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
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
    </EnhancedDashboardLayout>
  );
}