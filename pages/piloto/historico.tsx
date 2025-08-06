import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Calendar, Clock, MapPin, Users, Plane, Filter, Download, Eye, ChevronLeft } from 'lucide-react';

import { EnhancedDashboardLayout } from '../../src/components/magicui/enhanced-dashboard-layout';
import { Button } from '../../src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Badge } from '../../src/components/ui/badge';
import { Input } from '../../src/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../src/components/ui/select';
import { Separator } from '../../src/components/ui/separator';
import LoadingSkeleton from '../../src/components/magicui/loading-skeleton';

import { supabase } from '../../src/integrations/supabase/client';
import { useUser } from '../../src/hooks/useUser';
import { useToast } from '../../src/hooks/use-toast';
import { formatDateSafe } from '../../src/utils/dateUtils';

interface VooHistorico {
  id: string;
  data_voo: string;
  periodo: 'manha' | 'tarde';
  status: string;
  adultos_previstos: number;
  criancas_previstas: number;
  adultos_transportados: number | null;
  criancas_transportadas: number | null;
  local_decolagem_previsto: string | null;
  local_pouso: string | null;
  duracao_minutos: number | null;
  altitude_maxima: number | null;
  observacoes_pos_voo: string | null;
  motivo_cancelamento: string | null;
  // observacoes_cancelamento: string | null; // Coluna não existe no banco
  created_at: string;
  baloes: Array<{
    id: string;
    nome: string;
  }>;
  anexos: Array<{
    id: string;
    tipo: string;
    nome_arquivo: string;
    url_storage: string;
  }>;
}

interface Filtros {
  dataInicio: string;
  dataFim: string;
  status: string;
  periodo: string;
}

const statusMap = {
  'finalizado': { label: 'Finalizado', variant: 'default', color: 'bg-green-100 text-green-800' },
  'cancelado': { label: 'Cancelado', variant: 'destructive', color: 'bg-red-100 text-red-800' },
  'checklist_concluido': { label: 'Checklist Concluído', variant: 'default', color: 'bg-blue-100 text-blue-800' },
} as const;

const periodoMap = {
  'manha': 'Manhã',
  'tarde': 'Tarde'
};

export default function PilotoHistorico() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();

  const [voos, setVoos] = useState<VooHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: '',
    dataFim: '',
    status: 'todos',
    periodo: 'todos'
  });
  const [stats, setStats] = useState({
    totalVoos: 0,
    totalPassageiros: 0,
    horasVoo: 0,
    voosMes: 0
  });

  useEffect(() => {
    console.log('[DEBUG] useEffect triggered:', { user, userLoading });
    if (!userLoading && user?.users_table_id) {
      fetchVoosHistorico();
    }
  }, [user?.users_table_id, userLoading]);

  const fetchVoosHistorico = async () => {
    try {
      if (!user?.users_table_id) {
        console.log('[DEBUG] User users_table_id não disponível:', { user: user?.email, users_table_id: user?.users_table_id });
        return;
      }

      setLoading(true);
      console.log('[DEBUG] Iniciando busca para user.users_table_id:', user.users_table_id);
      console.log('[DEBUG] Timestamp da busca:', new Date().toISOString());
      console.log('[DEBUG] Filtros aplicados:', filtros);

      // Buscar membro do piloto usando users_table_id
      let membro = null;
      let membroError = null;

      // Primeiro tentar por user_id
      const { data: membroPorUserId, error: errorPorUserId } = await supabase
        .from('membros')
        .select('id, status, tipo, created_at, updated_at, user_id')
        .eq('user_id', user.users_table_id)
        .eq('tipo', 'piloto')
        .single();

      if (membroPorUserId && !errorPorUserId) {
        membro = membroPorUserId;
        console.log('[DEBUG] Membro encontrado por user_id:', membro.id);
      } else {
        // Fallback: buscar por email
        console.log('[DEBUG] Tentando busca por email como fallback:', user?.email);
        const { data: membroPorEmail, error: errorPorEmail } = await supabase
          .from('membros')
          .select('id, status, tipo, created_at, updated_at, user_id, email')
          .eq('email', user?.email)
          .eq('tipo', 'piloto')
          .single();

        if (membroPorEmail && !errorPorEmail) {
          membro = membroPorEmail;
          console.log('[DEBUG] Membro encontrado por email. User_id atual:', membroPorEmail.user_id);
          
          // Se encontrou por email mas user_id está null, tentar atualizar
          if (!membroPorEmail.user_id && user?.users_table_id) {
            console.log('[DEBUG] Tentando vincular user_id ao membro...');
            await supabase
              .from('membros')
              .update({ user_id: user.users_table_id })
              .eq('id', membroPorEmail.id);
            console.log('[DEBUG] Vinculação user_id tentada');
          }
        } else {
          membroError = errorPorEmail || errorPorUserId;
        }
      }

      console.log('[DEBUG] Resultado busca membro:', { membro, membroError });
      console.log('[DEBUG] Query membro executada:', {
        table: 'membros',
        filters: { user_id: user.users_table_id, tipo: 'piloto' },
        select: 'id, status, tipo, created_at, updated_at, user_id',
        fallback_used: membro && !membroPorUserId ? 'email' : 'user_id'
      });

      if (membroError || !membro) {
        console.error('[ERROR] Erro ao buscar membro:', membroError);
        
        let errorMessage = "Erro ao carregar dados do piloto";
        let errorDescription = "Não foi possível encontrar suas informações de piloto.";
        
        if (membroError) {
          if (membroError.code === 'PGRST116') {
            errorDescription = "Você não está cadastrado como piloto no sistema.";
          } else if (membroError.code === '42501') {
            errorDescription = "Você não tem permissão para acessar estes dados.";
          } else {
            errorDescription = `Erro técnico: ${membroError.message}`;
          }
        } else if (!membro) {
          errorDescription = "Cadastro de piloto não encontrado. Entre em contato com o administrador.";
        }
        
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive"
        });
        return;
      }

      // Buscar voos históricos
      let query = supabase
        .from('voos')
        .select(`
          id,
          data_voo,
          periodo,
          status,
          adultos_previstos,
          criancas_previstas,
          adultos_transportados,
          criancas_transportadas,
          local_decolagem_previsto,
          local_pouso,
          duracao_minutos,
          altitude_maxima,
          observacoes_pos_voo,
          motivo_cancelamento,
          created_at,
          piloto_id
        `)
        .eq('piloto_id', membro.id)
        .in('status', ['finalizado', 'cancelado', 'checklist_concluido'])
        .order('data_voo', { ascending: false })
        .order('periodo', { ascending: false });

      console.log('[DEBUG] Piloto ID sendo usado na busca:', membro.id);
      console.log('[DEBUG] Query base construída:', {
        table: 'voos',
        piloto_id: membro.id,
        status_filter: ['finalizado', 'cancelado', 'checklist_concluido'],
        order: [{ field: 'data_voo', ascending: false }, { field: 'periodo', ascending: false }]
      });

      // Aplicar filtros
      const filtrosAplicados = [];
      if (filtros.dataInicio) {
        query = query.gte('data_voo', filtros.dataInicio);
        filtrosAplicados.push(`data_voo >= ${filtros.dataInicio}`);
      }
      if (filtros.dataFim) {
        query = query.lte('data_voo', filtros.dataFim);
        filtrosAplicados.push(`data_voo <= ${filtros.dataFim}`);
      }
      if (filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
        filtrosAplicados.push(`status = ${filtros.status}`);
      }
      if (filtros.periodo !== 'todos') {
        query = query.eq('periodo', filtros.periodo);
        filtrosAplicados.push(`periodo = ${filtros.periodo}`);
      }

      console.log('[DEBUG] Filtros aplicados na query:', filtrosAplicados);
      console.log('[DEBUG] Query final antes da execução:', {
        baseFilters: `piloto_id = ${membro.id}`,
        statusFilter: 'status IN (finalizado, cancelado, checklist_concluido)',
        additionalFilters: filtrosAplicados
      });

      const { data: voosData, error: voosError } = await query;

      console.log('[DEBUG] Query executada com sucesso');
      console.log('[DEBUG] Resultado voos:', { 
        voosData: voosData ? {
          count: voosData.length,
          firstItem: voosData[0] || null,
          allIds: voosData.map(v => v.id)
        } : null, 
        voosError 
      });
      if (voosData && voosData.length > 0) {
        console.log('[DEBUG] Comparação de IDs:', {
          membroId: membro.id,
          voosEncontrados: voosData.length,
          primeiroVoo: {
            id: voosData[0].id,
            status: voosData[0].status,
            data_voo: voosData[0].data_voo
          }
        });
      } else {
        console.log('[DEBUG] Nenhum voo encontrado para membro:', membro.id);
      }

      if (voosError) {
        console.error('[ERROR] Erro na query voos:', voosError);
        
        let errorMessage = "Erro ao carregar histórico";
        let errorDescription = "Não foi possível carregar seus voos.";
        
        if (voosError.code === '42501') {
          errorMessage = "Acesso negado";
          errorDescription = "Você não tem permissão para visualizar estes voos. Verifique se suas políticas de acesso estão configuradas corretamente.";
        } else if (voosError.code === 'PGRST116') {
          errorMessage = "Nenhum voo encontrado";
          errorDescription = "Não foram encontrados voos para este piloto com os filtros aplicados.";
        } else if (voosError.code === '08006') {
          errorMessage = "Erro de conexão";
          errorDescription = "Problema de conexão com o banco de dados. Tente novamente em alguns instantes.";
        } else {
          errorDescription = `Erro técnico: ${voosError.message}. Código: ${voosError.code || 'N/A'}`;
        }
        
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive"
        });
        return;
      }

      // Processar dados dos voos (simplificado sem balões e anexos por enquanto)
      const voosProcessados = voosData?.map(voo => ({
        ...voo,
        baloes: [], // Temporariamente vazio
        anexos: [] // Temporariamente vazio
      })) || [];

      console.log('[DEBUG] Voos processados:', {
        total: voosProcessados.length,
        statusDistribution: voosProcessados.reduce((acc, voo) => {
          acc[voo.status] = (acc[voo.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        dateRange: voosProcessados.length > 0 ? {
          oldest: voosProcessados[voosProcessados.length - 1]?.data_voo,
          newest: voosProcessados[0]?.data_voo
        } : null,
        sampleVoo: voosProcessados[0] || null
      });
      console.log('[DEBUG] Total de voos encontrados:', voosProcessados.length);

      setVoos(voosProcessados);

      // Calcular estatísticas
      const totalVoos = voosProcessados.length;
      const totalPassageiros = voosProcessados.reduce((sum, voo) => 
        sum + (voo.adultos_transportados || 0) + (voo.criancas_transportadas || 0), 0
      );
      const horasVoo = voosProcessados.reduce((sum, voo) => 
        sum + (voo.duracao_minutos || 0), 0
      ) / 60;
      
      const agora = new Date();
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const voosMes = voosProcessados.filter(voo => 
        new Date(voo.data_voo) >= inicioMes
      ).length;

      const statsCalculadas = {
        totalVoos,
        totalPassageiros,
        horasVoo: Math.round(horasVoo * 10) / 10,
        voosMes
      };

      console.log('[DEBUG] Estatísticas calculadas:', {
        ...statsCalculadas,
        detalhes: {
          voosComDuracao: voosProcessados.filter(v => v.duracao_minutos).length,
          voosComPassageiros: voosProcessados.filter(v => v.adultos_transportados || v.criancas_transportadas).length,
          inicioMesReferencia: inicioMes.toISOString(),
          voosNoMes: voosProcessados.filter(voo => new Date(voo.data_voo) >= inicioMes).map(v => ({ id: v.id, data: v.data_voo }))
        }
      });

      setStats(statsCalculadas);

    } catch (error) {
      console.error('[ERROR] Erro inesperado na fetchVoosHistorico:', error);
      console.error('[ERROR] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      console.error('[ERROR] Contexto do erro:', {
        userId: user?.id,
        timestamp: new Date().toISOString(),
        filtros: filtros
      });
      toast({
        title: "Erro",
        description: `Erro inesperado ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      console.log('[DEBUG] Finalizando fetchVoosHistorico, setLoading(false)');
      setLoading(false);
    }
  };

  const handleFiltroChange = (key: keyof Filtros, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const aplicarFiltros = () => {
    console.log('[DEBUG] Aplicando filtros:', filtros);
    fetchVoosHistorico();
  };

  const limparFiltros = () => {
    console.log('[DEBUG] Limpando filtros');
    const filtrosLimpos = {
      dataInicio: '',
      dataFim: '',
      status: 'todos',
      periodo: 'todos'
    };
    setFiltros(filtrosLimpos);
    console.log('[DEBUG] Filtros limpos, aguardando 100ms para refetch');
    setTimeout(() => {
      console.log('[DEBUG] Executando fetchVoosHistorico após limpar filtros');
      fetchVoosHistorico();
    }, 100);
  };

  if (userLoading || loading) {
    return (
      <EnhancedDashboardLayout>
        <div className="space-y-6">
          <LoadingSkeleton height="h-32" />
          <LoadingSkeleton height="h-64" />
          <LoadingSkeleton height="h-64" />
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/piloto/dashboard')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Histórico de Voos</h1>
              <p className="text-sm text-gray-600">Seus voos finalizados e cancelados</p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plane className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Voos</p>
                  <p className="text-2xl font-bold">{stats.totalVoos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Passageiros</p>
                  <p className="text-2xl font-bold">{stats.totalPassageiros}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horas de Voo</p>
                  <p className="text-2xl font-bold">{stats.horasVoo}h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Este Mês</p>
                  <p className="text-2xl font-bold">{stats.voosMes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Data Início
                </label>
                <Input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Data Fim
                </label>
                <Input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Status
                </label>
                <Select 
                  value={filtros.status} 
                  onValueChange={(value) => handleFiltroChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="checklist_concluido">Checklist Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Período
                </label>
                <Select 
                  value={filtros.periodo} 
                  onValueChange={(value) => handleFiltroChange('periodo', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={aplicarFiltros} size="sm">
                Aplicar Filtros
              </Button>
              <Button onClick={limparFiltros} variant="outline" size="sm">
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Voos */}
        <div className="space-y-4">
          {voos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <Plane className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Nenhum voo encontrado</h3>
                    <p className="text-gray-600">
                      {filtros.dataInicio || filtros.dataFim || filtros.status !== 'todos' || filtros.periodo !== 'todos'
                        ? 'Tente ajustar os filtros para encontrar seus voos.'
                        : 'Você ainda não possui voos finalizados ou cancelados.'
                      }
                    </p>
                    {!loading && voos.length === 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Dica:</strong> Se você deveria ter voos aqui, verifique:
                        </p>
                        <ul className="text-sm text-blue-700 mt-2 text-left list-disc list-inside">
                          <li>Se você está logado com a conta correta</li>
                          <li>Se seus voos estão com status 'finalizado', 'cancelado' ou 'checklist_concluido'</li>
                          <li>Se há problemas de permissão (verifique o console do navegador)</li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => router.push('/piloto/planejamento')}
                      className="mt-2"
                    >
                      Planejar Novo Voo
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('[DEBUG] Recarregando dados manualmente');
                        fetchVoosHistorico();
                      }}
                      variant="outline"
                      className="mt-2"
                    >
                      Recarregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            voos.map((voo) => (
              <Card key={voo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {formatDateSafe(voo.data_voo)} - {periodoMap[voo.periodo]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {voo.duracao_minutos ? `${voo.duracao_minutos} min` : 'Duração não informada'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      className={statusMap[voo.status as keyof typeof statusMap]?.color}
                    >
                      {statusMap[voo.status as keyof typeof statusMap]?.label || voo.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Passageiros</p>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>
                          {voo.status === 'finalizado' 
                            ? `${(voo.adultos_transportados || 0) + (voo.criancas_transportadas || 0)} transportados`
                            : `${voo.adultos_previstos + voo.criancas_previstas} previstos`
                          }
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Decolagem</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {voo.local_decolagem_previsto || 'Não informado'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Pouso</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {voo.local_pouso || 'Não informado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {voo.baloes.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Balões utilizados:</p>
                      <div className="flex flex-wrap gap-2">
                        {voo.baloes.map((balao) => (
                          <Badge key={balao.id} variant="outline">
                            {balao.nome}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {voo.status === 'cancelado' && voo.motivo_cancelamento && (
                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Motivo do cancelamento:
                      </p>
                      <p className="text-sm text-red-700">{voo.motivo_cancelamento}</p>
                      {/* Observações de cancelamento removidas - coluna não existe no banco */}
                    </div>
                  )}

                  {voo.observacoes_pos_voo && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        Observações pós-voo:
                      </p>
                      <p className="text-sm text-blue-700">{voo.observacoes_pos_voo}</p>
                    </div>
                  )}

                  {voo.anexos.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Anexos ({voo.anexos.length}):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {voo.anexos.map((anexo) => (
                          <Button
                            key={anexo.id}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => window.open(anexo.url_storage, '_blank')}
                          >
                            <Download className="h-3 w-3 mr-1" />
                            {anexo.tipo}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Criado em {formatDateSafe(voo.created_at)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/piloto/pos-voo/${voo.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </EnhancedDashboardLayout>
  );
}