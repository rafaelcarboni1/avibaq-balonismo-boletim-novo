import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Calendar, Clock, MapPin, Users, Plane, Filter, Download, Eye, ChevronLeft, User } from 'lucide-react';

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
  created_at: string;
  piloto: {
    id: string;
    nome: string;
    user_id: string;
  };
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
  piloto: string;
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

export default function AgenciaHistorico() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();

  const [voos, setVoos] = useState<VooHistorico[]>([]);
  const [pilotos, setPilotos] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({
    dataInicio: '',
    dataFim: '',
    status: 'todos',
    periodo: 'todos',
    piloto: 'todos'
  });
  const [stats, setStats] = useState({
    totalVoos: 0,
    totalPassageiros: 0,
    horasVoo: 0,
    voosMes: 0
  });

  useEffect(() => {
    console.log('[DEBUG] useEffect triggered:', { user, userLoading });
    if (!userLoading && user) {
      fetchVoosHistorico();
      fetchPilotos();
    }
  }, [user, userLoading]);

  const fetchPilotos = async () => {
    try {
      if (!user?.id) return;

      // Buscar agência
      const { data: agencia, error: agenciaError } = await supabase
        .from('membros')
        .select('id, agencia_id')
        .eq('user_id', user.id)
        .eq('tipo', 'agencia')
        .single();

      if (agenciaError || !agencia) {
        console.error('[ERROR] Erro ao buscar agência:', agenciaError);
        return;
      }

      // Buscar pilotos da agência
      const { data: pilotosData, error: pilotosError } = await supabase
        .from('membros')
        .select(`
          id,
          nome,
          user_id
        `)
        .eq('agencia_id', agencia.agencia_id)
        .eq('tipo', 'piloto')
        .eq('status', 'ativo');

      if (pilotosError) {
        console.error('[ERROR] Erro ao buscar pilotos:', pilotosError);
        return;
      }

      setPilotos(pilotosData || []);
    } catch (error) {
      console.error('Erro ao buscar pilotos:', error);
    }
  };

  const fetchVoosHistorico = async () => {
    try {
      if (!user?.id) {
        console.log('[DEBUG] User não disponível:', user);
        return;
      }

      setLoading(true);
      console.log('[DEBUG] Iniciando busca para user.id:', user.id);

      // Buscar agência
      const { data: agencia, error: agenciaError } = await supabase
        .from('membros')
        .select('id, agencia_id')
        .eq('user_id', user.id)
        .eq('tipo', 'agencia')
        .single();

      console.log('[DEBUG] Resultado busca agência:', { agencia, agenciaError });

      if (agenciaError || !agencia) {
        console.error('[ERROR] Erro ao buscar agência:', agenciaError);
        toast({
          title: "Erro",
          description: "Agência não encontrada",
          variant: "destructive"
        });
        return;
      }

      // Buscar pilotos da agência
      const { data: pilotosData, error: pilotosError } = await supabase
        .from('membros')
        .select('id')
        .eq('agencia_id', agencia.agencia_id)
        .eq('tipo', 'piloto');

      if (pilotosError || !pilotosData || pilotosData.length === 0) {
        console.error('[ERROR] Erro ao buscar pilotos da agência:', pilotosError);
        toast({
          title: "Erro",
          description: "Nenhum piloto encontrado para esta agência",
          variant: "destructive"
        });
        return;
      }

      const pilotosIds = pilotosData.map(p => p.id);
      console.log('[DEBUG] IDs dos pilotos da agência:', pilotosIds);

      // Buscar voos históricos dos pilotos da agência
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
          piloto_id,
          membros!inner(
            id,
            nome,
            user_id
          )
        `)
        .in('piloto_id', pilotosIds)
        .in('status', ['finalizado', 'cancelado', 'checklist_concluido'])
        .order('data_voo', { ascending: false })
        .order('periodo', { ascending: false });

      // Aplicar filtros
      if (filtros.dataInicio) {
        query = query.gte('data_voo', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        query = query.lte('data_voo', filtros.dataFim);
      }
      if (filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
      }
      if (filtros.periodo !== 'todos') {
        query = query.eq('periodo', filtros.periodo);
      }
      if (filtros.piloto !== 'todos') {
        query = query.eq('piloto_id', filtros.piloto);
      }

      const { data: voosData, error: voosError } = await query;

      console.log('[DEBUG] Query executada:', query);
      console.log('[DEBUG] Resultado voos:', { voosData, voosError });

      if (voosError) {
        console.error('[ERROR] Erro na query voos:', voosError);
        toast({
          title: "Erro",
          description: `Erro ao carregar histórico de voos: ${voosError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Processar dados dos voos
      const voosProcessados = voosData?.map(voo => ({
        ...voo,
        piloto: {
          id: voo.membros.id,
          nome: voo.membros.nome,
          user_id: voo.membros.user_id
        },
        baloes: [], // Temporariamente vazio
        anexos: [] // Temporariamente vazio
      })) || [];

      console.log('[DEBUG] Voos processados:', voosProcessados);
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

      setStats({
        totalVoos,
        totalPassageiros,
        horasVoo: Math.round(horasVoo * 10) / 10,
        voosMes
      });

    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (key: keyof Filtros, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const aplicarFiltros = () => {
    fetchVoosHistorico();
  };

  const limparFiltros = () => {
    setFiltros({
      dataInicio: '',
      dataFim: '',
      status: 'todos',
      periodo: 'todos',
      piloto: 'todos'
    });
    setTimeout(() => fetchVoosHistorico(), 100);
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
              onClick={() => router.push('/agencia/dashboard')}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatórios de Voos</h1>
              <p className="text-sm text-gray-600">Histórico de voos de todos os pilotos da agência</p>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Piloto
                </label>
                <Select 
                  value={filtros.piloto} 
                  onValueChange={(value) => handleFiltroChange('piloto', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {pilotos.map((piloto) => (
                      <SelectItem key={piloto.id} value={piloto.id}>
                        {piloto.nome}
                      </SelectItem>
                    ))}
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
                      {filtros.dataInicio || filtros.dataFim || filtros.status !== 'todos' || filtros.periodo !== 'todos' || filtros.piloto !== 'todos'
                        ? 'Tente ajustar os filtros para encontrar os voos.'
                        : 'Ainda não há voos finalizados ou cancelados na agência.'
                      }
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push('/agencia/planejamento')}
                    className="mt-2"
                  >
                    Planejar Novo Voo
                  </Button>
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
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Piloto: {voo.piloto.nome}
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
                        onClick={() => router.push(`/agencia/voo-detalhes/${voo.id}`)}
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