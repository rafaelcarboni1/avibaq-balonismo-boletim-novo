import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plane, Users, Calendar, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VoosStats {
  total_voos: number;
  voos_realizados: number;
  voos_cancelados: number;
  voos_pendentes: number;
  total_passageiros: number;
  taxa_cancelamento: number;
  voos_por_status: {
    rascunho: number;
    planejado: number;
    em_andamento: number;
    finalizado: number;
    cancelado: number;
  };
  motivos_cancelamento: {
    motivo: string;
    count: number;
  }[];
  utilizacao_baloes: {
    balao_id: string;
    prefixo: string;
    voos_count: number;
  }[];
}

const VoosStatistics: React.FC<{ periodo?: 'mes' | 'trimestre' | 'ano' }> = ({ periodo = 'mes' }) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['voos-statistics', periodo],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (periodo) {
        case 'mes':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        case 'trimestre':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          endDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
          break;
        case 'ano':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }

      // Buscar estatísticas gerais
      const { data: voosData } = await supabase
        .from('voos')
        .select('*')
        .gte('data_voo', startDate.toISOString())
        .lte('data_voo', endDate.toISOString());

      // Buscar passageiros transportados
      const { data: passageirosData } = await supabase
        .from('voos_baloes')
        .select('adultos_efetivos, criancas_efetivas')
        .in('voo_id', voosData?.map(v => v.id) || []);

      // Buscar motivos de cancelamento
      const { data: cancelamentosData } = await supabase
        .from('voos')
        .select('motivo_cancelamento')
        .eq('status', 'cancelado')
        .gte('data_voo', startDate.toISOString())
        .lte('data_voo', endDate.toISOString())
        .not('motivo_cancelamento', 'is', null);

      // Buscar utilização de balões
      const { data: utilizacaoData } = await supabase
        .from('voos_baloes')
        .select(`
          balao_id,
          baloes!inner(prefixo)
        `)
        .in('voo_id', voosData?.filter(v => v.status === 'finalizado').map(v => v.id) || []);

      if (!voosData) return null;

      const totalVoos = voosData.length;
      const voosRealizados = voosData.filter(v => v.status === 'finalizado').length;
      const voosCancelados = voosData.filter(v => v.status === 'cancelado').length;
      const voosPendentes = voosData.filter(v => ['rascunho', 'planejado', 'em_andamento'].includes(v.status)).length;
      
      const totalPassageiros = passageirosData?.reduce((sum, p) => 
        sum + (p.adultos_efetivos || 0) + (p.criancas_efetivas || 0), 0
      ) || 0;

      const taxaCancelamento = totalVoos > 0 ? (voosCancelados / totalVoos) * 100 : 0;

      const voosPorStatus = {
        rascunho: voosData.filter(v => v.status === 'rascunho').length,
        planejado: voosData.filter(v => v.status === 'planejado').length,
        em_andamento: voosData.filter(v => v.status === 'em_andamento').length,
        finalizado: voosData.filter(v => v.status === 'finalizado').length,
        cancelado: voosCancelados,
      };

      const motivosMap = new Map<string, number>();
      cancelamentosData?.forEach(c => {
        if (c.motivo_cancelamento) {
          motivosMap.set(c.motivo_cancelamento, (motivosMap.get(c.motivo_cancelamento) || 0) + 1);
        }
      });

      const motivos_cancelamento = Array.from(motivosMap.entries()).map(([motivo, count]) => ({
        motivo,
        count
      }));

      const utilizacaoMap = new Map<string, { prefixo: string; count: number }>();
      utilizacaoData?.forEach(u => {
        const key = u.balao_id;
        const prefixo = (u.baloes as any).prefixo;
        if (utilizacaoMap.has(key)) {
          utilizacaoMap.get(key)!.count++;
        } else {
          utilizacaoMap.set(key, { prefixo, count: 1 });
        }
      });

      const utilizacao_baloes = Array.from(utilizacaoMap.entries()).map(([balao_id, data]) => ({
        balao_id,
        prefixo: data.prefixo,
        voos_count: data.count
      }));

      return {
        total_voos: totalVoos,
        voos_realizados: voosRealizados,
        voos_cancelados: voosCancelados,
        voos_pendentes: voosPendentes,
        total_passageiros: totalPassageiros,
        taxa_cancelamento: taxaCancelamento,
        voos_por_status: voosPorStatus,
        motivos_cancelamento: motivos_cancelamento,
        utilizacao_baloes: utilizacao_baloes,
      } as VoosStats;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="h-32">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finalizado': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      case 'em_andamento': return 'bg-blue-100 text-blue-800';
      case 'planejado': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finalizado': return <CheckCircle className="h-4 w-4" />;
      case 'cancelado': return <XCircle className="h-4 w-4" />;
      case 'em_andamento': return <Plane className="h-4 w-4" />;
      case 'planejado': return <Calendar className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const sucessRate = stats.total_voos > 0 ? (stats.voos_realizados / stats.total_voos) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Voos</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_voos}</div>
            <p className="text-xs text-muted-foreground">
              no {periodo === 'mes' ? 'mês' : periodo === 'trimestre' ? 'trimestre' : 'ano'} atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voos Realizados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.voos_realizados}</div>
            <p className="text-xs text-muted-foreground">
              {sucessRate.toFixed(1)}% de sucesso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passageiros Transportados</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total_passageiros}</div>
            <p className="text-xs text-muted-foreground">
              {stats.voos_realizados > 0 ? (stats.total_passageiros / stats.voos_realizados).toFixed(1) : 0} média por voo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Cancelamento</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.taxa_cancelamento.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.voos_cancelados} voos cancelados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Voos</CardTitle>
          <CardDescription>Distribuição atual por status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(stats.voos_por_status).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </div>
                <div className="text-lg font-bold mt-1">{count}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso de Conclusão</span>
              <span>{sucessRate.toFixed(1)}%</span>
            </div>
            <Progress value={sucessRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Utilização de Balões */}
      {stats.utilizacao_baloes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Utilização de Balões</CardTitle>
            <CardDescription>Voos realizados por balão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.utilizacao_baloes
                .sort((a, b) => b.voos_count - a.voos_count)
                .map(balao => (
                  <div key={balao.balao_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{balao.prefixo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{balao.voos_count} voos</span>
                      <Progress 
                        value={(balao.voos_count / Math.max(...stats.utilizacao_baloes.map(b => b.voos_count))) * 100} 
                        className="w-20 h-2"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivos de Cancelamento */}
      {stats.motivos_cancelamento.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Motivos de Cancelamento</CardTitle>
            <CardDescription>Análise dos cancelamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.motivos_cancelamento
                .sort((a, b) => b.count - a.count)
                .map(motivo => (
                  <div key={motivo.motivo} className="flex items-center justify-between">
                    <span className="capitalize">{motivo.motivo.replace('_', ' ')}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{motivo.count}</Badge>
                      <Progress 
                        value={(motivo.count / Math.max(...stats.motivos_cancelamento.map(m => m.count))) * 100} 
                        className="w-20 h-2"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoosStatistics;