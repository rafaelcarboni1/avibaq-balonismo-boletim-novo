import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PlusIcon, UsersIcon, CalendarIcon, DocumentTextIcon, BriefcaseIcon, ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { EnhancedDashboardLayout } from '../../src/components/magicui/enhanced-dashboard-layout';
import { MagicCard } from '../../src/components/magicui/magic-card';
import { BentoGrid, BentoGridItem } from '../../src/components/magicui/bento-grid';
import { NumberTicker } from '../../src/components/magicui/number-ticker';
import { OfflineIndicator } from '../../src/components/magicui/offline-indicator';
import { AdvancedKPICard } from '../../src/components/magicui/advanced-kpi-analytics';
import { AdvancedLineChart, HeatmapChart } from '../../src/components/magicui/advanced-charts';
import { supabase } from '../../src/integrations/supabase/client';
import { useUser } from '../../src/hooks/useUser';
import { useToast } from '../../src/hooks/use-toast';

interface DashboardStats {
  totalPilotos: number;
  pilotosAtivos: number;
  voosEsteAno: number;
  voosEsteMes: number;
  proximoVoo: any;
  voosRecentes: any[];
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
    voosRecentes: []
  });
  const [loading, setLoading] = useState(true);

  // Verificar se usuário está autenticado e é agência
  useEffect(() => {
    if (!userLoading) {
      if (!user) {
        router.push('/agencia/login');
        return;
      }
      if (user.role && user.role !== 'agencia') {
        router.push('/');
        return;
      }
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
        voosRecentesResult
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
        
        // Voos recentes (últimos 5)
        supabase
          .from('voos')
          .select('*, piloto:membros!voos_piloto_id_fkey(nome)')
          .eq('agencia_id', membro.id)
          .order('data_voo', { ascending: false })
          .limit(5)
      ]);

      setStats({
        totalPilotos: pilotosResult.data?.length || 0,
        pilotosAtivos: pilotosAtivosResult.data?.length || 0,
        voosEsteAno: voosAnoResult.data?.length || 0,
        voosEsteMes: voosMesResult.data?.length || 0,
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
    <EnhancedDashboardLayout title="Dashboard da Agência">
      <div className="space-y-8">
        {/* Indicador offline */}
        <OfflineIndicator showDetails={true} />
        
        {/* Estatísticas principais */}
        <BentoGrid className="grid-cols-2 lg:grid-cols-4 gap-6">
          <BentoGridItem className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Pilotos</p>
                  <NumberTicker 
                    value={stats.totalPilotos} 
                    className="text-2xl font-bold text-blue-900"
                  />
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-gradient-to-br from-green-50 to-green-100">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Pilotos Ativos</p>
                  <NumberTicker 
                    value={stats.pilotosAtivos} 
                    className="text-2xl font-bold text-green-900"
                  />
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <BriefcaseIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Voos Este Ano</p>
                  <NumberTicker 
                    value={stats.voosEsteAno} 
                    className="text-2xl font-bold text-purple-900"
                  />
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </BentoGridItem>

          <BentoGridItem className="bg-gradient-to-br from-amber-50 to-amber-100">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Voos Este Mês</p>
                  <NumberTicker 
                    value={stats.voosEsteMes} 
                    className="text-2xl font-bold text-amber-900"
                  />
                </div>
                <div className="h-12 w-12 bg-amber-500 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
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
              onClick={() => router.push('/agencia/planejamento')}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors group"
            >
              <PlusIcon className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Planejar Voo</p>
              <p className="text-sm text-gray-600">Criar planejamento para piloto</p>
            </button>

            <button
              onClick={() => router.push('/agencia/pilotos')}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors group"
            >
              <UsersIcon className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Gerenciar Pilotos</p>
              <p className="text-sm text-gray-600">Convidar e gerenciar equipe</p>
            </button>

            <button
              onClick={() => router.push('/agencia/frota')}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors group"
            >
              <BriefcaseIcon className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Frota</p>
              <p className="text-sm text-gray-600">Visualizar frota de pilotos</p>
            </button>

            <button
              onClick={() => router.push('/agencia/historico')}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors group"
            >
              <DocumentTextIcon className="h-8 w-8 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <p className="font-medium">Relatórios</p>
              <p className="text-sm text-gray-600">Ver histórico e estatísticas</p>
            </button>
          </div>
        </MagicCard>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Próximo voo */}
          <MagicCard className="p-6">
            <h3 className="text-lg font-semibold mb-4">Próximo Voo Agendado</h3>
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
                {stats.proximoVoo.piloto && (
                  <p className="text-sm text-gray-600">
                    Piloto: {stats.proximoVoo.piloto.nome}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  Passageiros: {stats.proximoVoo.adultos_previstos + stats.proximoVoo.criancas_previstas} previstos
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum voo agendado</p>
                <button
                  onClick={() => router.push('/agencia/planejamento')}
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
                      {voo.piloto && (
                        <p className="text-xs text-gray-500">Piloto: {voo.piloto.nome}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {voo.adultos_previstos + voo.criancas_previstas} passageiros
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusDisplay(voo.status).color}`}>
                      {getStatusDisplay(voo.status).label}
                    </span>
                  </div>
                ))}
                <div className="text-center mt-4">
                  <button
                    onClick={() => router.push('/agencia/historico')}
                    className="text-primary hover:underline text-sm"
                  >
                    Ver todos os voos
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhum voo planejado ainda</p>
              </div>
            )}
          </MagicCard>
        </div>

        {/* Status da equipe */}
        <MagicCard className="p-6">
          <h3 className="text-lg font-semibold mb-4">Status da Equipe</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <NumberTicker 
                value={stats.pilotosAtivos} 
                className="text-2xl font-bold text-green-900"
              />
              <p className="text-sm text-green-700 font-medium">Pilotos Ativos</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <NumberTicker 
                value={stats.totalPilotos - stats.pilotosAtivos} 
                className="text-2xl font-bold text-yellow-900"
              />
              <p className="text-sm text-yellow-700 font-medium">Convites Pendentes</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <NumberTicker 
                value={stats.voosEsteMes} 
                className="text-2xl font-bold text-blue-900"
              />
              <p className="text-sm text-blue-700 font-medium">Voos Este Mês</p>
            </div>
          </div>
        </MagicCard>

        {/* Analytics Avançados para Agência */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-purple-600" />
            Business Analytics
          </h2>
          
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
      </div>
    </EnhancedDashboardLayout>
  );
}