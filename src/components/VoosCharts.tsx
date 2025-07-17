import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VoosChartData {
  voos_por_mes: {
    mes: string;
    total: number;
    realizados: number;
    cancelados: number;
  }[];
  performance_pilotos: {
    piloto_nome: string;
    total_voos: number;
    voos_realizados: number;
    taxa_sucesso: number;
    passageiros_transportados: number;
  }[];
  distribuicao_status: {
    status: string;
    count: number;
    color: string;
  }[];
  timeline_voos: {
    data: string;
    voos: number;
    passageiros: number;
  }[];
}

const VoosCharts: React.FC = () => {
  const [periodo, setPeriodo] = React.useState<'6meses' | '12meses'>('6meses');
  
  const { data: chartData, isLoading } = useQuery({
    queryKey: ['voos-charts', periodo],
    queryFn: async () => {
      const now = new Date();
      const mesesAtras = periodo === '6meses' ? 6 : 12;
      const startDate = subMonths(now, mesesAtras);
      
      // Buscar dados dos últimos meses
      const { data: voosData } = await supabase
        .from('voos')
        .select(`
          *,
          users!voos_piloto_id_fkey(nome),
          voos_baloes(adultos_efetivos, criancas_efetivas)
        `)
        .gte('data_voo', startDate.toISOString())
        .order('data_voo', { ascending: true });

      if (!voosData) return null;

      // Processar dados por mês
      const voosPorMes = [];
      for (let i = 0; i < mesesAtras; i++) {
        const mesData = subMonths(now, mesesAtras - i);
        const inicioMes = startOfMonth(mesData);
        const fimMes = endOfMonth(mesData);
        
        const voosDoMes = voosData.filter(v => {
          const dataVoo = new Date(v.data_voo);
          return dataVoo >= inicioMes && dataVoo <= fimMes;
        });

        voosPorMes.push({
          mes: format(mesData, 'MMM/yy', { locale: ptBR }),
          total: voosDoMes.length,
          realizados: voosDoMes.filter(v => v.status === 'finalizado').length,
          cancelados: voosDoMes.filter(v => v.status === 'cancelado').length,
        });
      }

      // Performance por piloto
      const performancePilotos = new Map<string, {
        nome: string;
        total: number;
        realizados: number;
        passageiros: number;
      }>();

      voosData.forEach(voo => {
        const pilotoNome = voo.users?.nome || 'Piloto não identificado';
        const key = pilotoNome;
        
        if (!performancePilotos.has(key)) {
          performancePilotos.set(key, { nome: pilotoNome, total: 0, realizados: 0, passageiros: 0 });
        }
        
        const piloto = performancePilotos.get(key)!;
        piloto.total++;
        
        if (voo.status === 'finalizado') {
          piloto.realizados++;
          const passageiros = voo.voos_baloes?.reduce((sum, b) => 
            sum + (b.adultos_efetivos || 0) + (b.criancas_efetivas || 0), 0
          ) || 0;
          piloto.passageiros += passageiros;
        }
      });

      const performance_pilotos = Array.from(performancePilotos.values())
        .filter(p => p.total > 0)
        .map(p => ({
          piloto_nome: p.nome,
          total_voos: p.total,
          voos_realizados: p.realizados,
          taxa_sucesso: p.total > 0 ? (p.realizados / p.total) * 100 : 0,
          passageiros_transportados: p.passageiros,
        }))
        .sort((a, b) => b.total_voos - a.total_voos);

      // Distribuição por status
      const statusCount = new Map<string, number>();
      voosData.forEach(voo => {
        statusCount.set(voo.status, (statusCount.get(voo.status) || 0) + 1);
      });

      const statusColors = {
        'finalizado': '#10b981',
        'cancelado': '#ef4444',
        'em_andamento': '#3b82f6',
        'planejado': '#f59e0b',
        'rascunho': '#6b7280'
      };

      const distribuicao_status = Array.from(statusCount.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        count,
        color: statusColors[status as keyof typeof statusColors] || '#6b7280'
      }));

      // Timeline de voos (últimos 30 dias)
      const timeline_voos = [];
      const ultimos30Dias = Array.from({ length: 30 }, (_, i) => {
        const data = new Date();
        data.setDate(data.getDate() - (29 - i));
        return data;
      });

      ultimos30Dias.forEach(data => {
        const voosNoDia = voosData.filter(v => {
          const dataVoo = new Date(v.data_voo);
          return dataVoo.toDateString() === data.toDateString();
        });

        const passageirosNoDia = voosNoDia
          .filter(v => v.status === 'finalizado')
          .reduce((sum, v) => {
            const passageiros = v.voos_baloes?.reduce((s, b) => 
              s + (b.adultos_efetivos || 0) + (b.criancas_efetivas || 0), 0
            ) || 0;
            return sum + passageiros;
          }, 0);

        timeline_voos.push({
          data: format(data, 'dd/MM', { locale: ptBR }),
          voos: voosNoDia.length,
          passageiros: passageirosNoDia,
        });
      });

      return {
        voos_por_mes: voosPorMes,
        performance_pilotos: performance_pilotos,
        distribuicao_status: distribuicao_status,
        timeline_voos: timeline_voos,
      } as VoosChartData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  if (isLoading || !chartData) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="h-96">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Controle de Período */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Análise de Voos</h2>
        <Select value={periodo} onValueChange={(value: '6meses' | '12meses') => setPeriodo(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6meses">Últimos 6 meses</SelectItem>
            <SelectItem value="12meses">Últimos 12 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Voos por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Voos por Mês</CardTitle>
            <CardDescription>Evolução mensal dos voos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.voos_por_mes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="Total" />
                <Bar dataKey="realizados" fill="#10b981" name="Realizados" />
                <Bar dataKey="cancelados" fill="#ef4444" name="Cancelados" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Proporção atual dos voos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.distribuicao_status}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ status, count }) => `${status} (${count})`}
                >
                  {chartData.distribuicao_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Timeline de Voos (últimos 30 dias) */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline dos Últimos 30 Dias</CardTitle>
            <CardDescription>Voos e passageiros por dia</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.timeline_voos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="voos" stroke="#3b82f6" name="Voos" />
                <Line type="monotone" dataKey="passageiros" stroke="#10b981" name="Passageiros" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance por Piloto */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Piloto</CardTitle>
            <CardDescription>Estatísticas dos pilotos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {chartData.performance_pilotos.map((piloto, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{piloto.piloto_nome}</div>
                    <div className="text-sm text-gray-600">
                      {piloto.total_voos} voos • {piloto.voos_realizados} realizados • {piloto.passageiros_transportados} passageiros
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={piloto.taxa_sucesso >= 80 ? "default" : piloto.taxa_sucesso >= 60 ? "secondary" : "destructive"}
                    >
                      {piloto.taxa_sucesso.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
              {chartData.performance_pilotos.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  Nenhum dado de performance disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoosCharts;