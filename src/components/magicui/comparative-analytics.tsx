/**
 * Comparative Analytics Dashboard
 * Componentes para análise comparativa de performance e tendências
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CalendarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  GlobeAltIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { AdvancedLineChart, GaugeChart, HeatmapChart, ScatterChart } from './advanced-charts';
import { MagicCard } from './magic-card';
import { NumberTicker } from './number-ticker';

interface ComparativeData {
  period: string;
  current: number;
  previous: number;
  target?: number;
  industry?: number;
}

interface TimeSeriesData {
  date: string;
  value: number;
  comparison?: number;
}

// Componente de Comparação de Períodos
export function PeriodComparison({ 
  title, 
  data, 
  metric = 'count',
  className = '' 
}: { 
  title: string; 
  data: ComparativeData[]; 
  metric?: string;
  className?: string;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  
  const formatValue = (value: number) => {
    switch (metric) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { 
          style: 'currency', 
          currency: 'BRL' 
        }).format(value);
      case 'hours':
        return `${value.toFixed(1)}h`;
      default:
        return value.toLocaleString('pt-BR');
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <MagicCard className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          {data.map((item, index) => (
            <button
              key={index}
              onClick={() => setSelectedPeriod(index)}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-colors
                ${selectedPeriod === index 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {item.period}
            </button>
          ))}
        </div>
      </div>

      {data[selectedPeriod] && (
        <motion.div
          key={selectedPeriod}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Métricas principais */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-900">
                <NumberTicker value={data[selectedPeriod].current} />
              </div>
              <div className="text-sm text-blue-600">Atual</div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                <NumberTicker value={data[selectedPeriod].previous} />
              </div>
              <div className="text-sm text-gray-600">Anterior</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                {calculateChange(data[selectedPeriod].current, data[selectedPeriod].previous) >= 0 ? (
                  <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                )}
                <span className={`text-xl font-bold ${
                  calculateChange(data[selectedPeriod].current, data[selectedPeriod].previous) >= 0 
                    ? 'text-green-900' 
                    : 'text-red-900'
                }`}>
                  {Math.abs(calculateChange(data[selectedPeriod].current, data[selectedPeriod].previous)).toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-gray-600">Variação</div>
            </div>
            
            {data[selectedPeriod].target && (
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-900">
                  <NumberTicker value={data[selectedPeriod].target!} />
                </div>
                <div className="text-sm text-purple-600">Meta</div>
              </div>
            )}
          </div>

          {/* Gráfico de comparação */}
          <div className="h-64">
            <AdvancedLineChart
              title=""
              data={[
                { name: 'Anterior', value: data[selectedPeriod].previous },
                { name: 'Atual', value: data[selectedPeriod].current },
                ...(data[selectedPeriod].target ? [{ name: 'Meta', value: data[selectedPeriod].target }] : [])
              ]}
              type="line"
              colors={['#3b82f6', '#10b981', '#f59e0b']}
              height={200}
            />
          </div>
        </motion.div>
      )}
    </MagicCard>
  );
}

// Componente de Análise de Tendências
export function TrendAnalysis({ 
  title, 
  timeSeriesData, 
  className = '' 
}: { 
  title: string; 
  timeSeriesData: TimeSeriesData[]; 
  className?: string;
}) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  const filterDataByRange = (range: string) => {
    const now = new Date();
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[range] || 30;
    
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    return timeSeriesData.filter(item => 
      new Date(item.date) >= cutoffDate
    );
  };

  const filteredData = filterDataByRange(timeRange);
  
  // Calcular tendência geral
  const calculateTrend = () => {
    if (filteredData.length < 2) return 'neutral';
    
    const first = filteredData[0].value;
    const last = filteredData[filteredData.length - 1].value;
    const change = ((last - first) / first) * 100;
    
    if (Math.abs(change) < 5) return 'neutral';
    return change > 0 ? 'up' : 'down';
  };

  const trend = calculateTrend();
  
  return (
    <MagicCard className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`
                px-3 py-1 rounded-lg text-sm font-medium transition-colors
                ${timeRange === range 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {range === '1y' ? '1 ano' : range}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Indicador de tendência */}
        <div className="flex items-center gap-4">
          <div className={`
            flex items-center gap-2 px-4 py-2 rounded-lg
            ${trend === 'up' ? 'bg-green-100 text-green-800' : 
              trend === 'down' ? 'bg-red-100 text-red-800' : 
              'bg-gray-100 text-gray-800'}
          `}>
            {trend === 'up' && <ArrowTrendingUpIcon className="h-5 w-5" />}
            {trend === 'down' && <ArrowTrendingDownIcon className="h-5 w-5" />}
            <span className="font-medium">
              Tendência {trend === 'up' ? 'Crescente' : trend === 'down' ? 'Decrescente' : 'Estável'}
            </span>
          </div>
        </div>

        {/* Gráfico de linha com tendência */}
        <AdvancedLineChart
          title=""
          data={filteredData.map(item => ({
            name: new Date(item.date).toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit' 
            }),
            value: item.value
          }))}
          type="line"
          colors={['#3b82f6']}
          height={250}
        />
      </div>
    </MagicCard>
  );
}

// Componente de Benchmark com o Setor
export function IndustryBenchmark({ 
  title, 
  metrics, 
  className = '' 
}: { 
  title: string; 
  metrics: { name: string; company: number; industry: number; unit?: string }[];
  className?: string;
}) {
  return (
    <MagicCard className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <GlobeAltIcon className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => {
          const performance = (metric.company / metric.industry) * 100;
          const isAboveAverage = performance > 100;
          
          return (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">{metric.name}</span>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    isAboveAverage ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {performance.toFixed(1)}% do setor
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Sua empresa: {metric.company.toFixed(1)}{metric.unit || ''}</span>
                  <span>Média do setor: {metric.industry.toFixed(1)}{metric.unit || ''}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    {/* Barra da empresa */}
                    <motion.div
                      className={`h-full rounded-full ${
                        isAboveAverage ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(performance, 100)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                    />
                    
                    {/* Linha da média do setor */}
                    <div 
                      className="absolute top-0 w-0.5 h-full bg-gray-600"
                      style={{ left: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </MagicCard>
  );
}

// Componente de Análise de Performance por Piloto/Agência
export function PerformanceRanking({ 
  title, 
  rankings, 
  className = '' 
}: { 
  title: string; 
  rankings: { name: string; score: number; change: number; avatar?: string }[];
  className?: string;
}) {
  return (
    <MagicCard className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <UserGroupIcon className="h-6 w-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      <div className="space-y-3">
        {rankings.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white
                ${index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  index === 2 ? 'bg-amber-600' : 'bg-blue-500'}
              `}>
                {index + 1}
              </div>
              
              <div>
                <div className="font-medium text-gray-900">{item.name}</div>
                <div className="text-sm text-gray-600">Score: {item.score.toFixed(1)}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`
                flex items-center gap-1 text-sm font-medium
                ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}
              `}>
                {item.change >= 0 ? (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                {Math.abs(item.change).toFixed(1)}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </MagicCard>
  );
}

// Componente principal de Analytics Comparativo
export function ComparativeAnalyticsDashboard({ 
  data, 
  className = '' 
}: { 
  data: any; 
  className?: string;
}) {
  // Dados simulados para demonstração
  const periodData: ComparativeData[] = [
    { period: 'Este Mês', current: 45, previous: 38, target: 50 },
    { period: 'Este Ano', current: 520, previous: 445, target: 600 },
    { period: 'Últimos 90d', current: 135, previous: 128, target: 150 }
  ];

  const trendData: TimeSeriesData[] = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    value: Math.floor(Math.random() * 20) + 30 + (i * 0.5)
  }));

  const benchmarkMetrics = [
    { name: 'Taxa de Segurança', company: 98.5, industry: 96.2, unit: '%' },
    { name: 'Utilização da Frota', company: 73.5, industry: 78.1, unit: '%' },
    { name: 'Satisfação do Cliente', company: 4.8, industry: 4.5, unit: '/5' },
    { name: 'Tempo Médio de Voo', company: 2.3, industry: 2.1, unit: 'h' }
  ];

  const pilotRankings = [
    { name: 'João Silva', score: 95.8, change: 2.1 },
    { name: 'Maria Santos', score: 94.2, change: -0.5 },
    { name: 'Pedro Costa', score: 92.7, change: 1.8 },
    { name: 'Ana Oliveira', score: 91.3, change: 0.3 },
    { name: 'Carlos Lima', score: 89.9, change: -1.2 }
  ];

  return (
    <div className={`space-y-8 ${className}`}>
      <div className="flex items-center gap-2">
        <ChartBarIcon className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Analytics Comparativo</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PeriodComparison
          title="Voos Realizados"
          data={periodData}
          metric="count"
        />
        
        <TrendAnalysis
          title="Tendência de Voos"
          timeSeriesData={trendData}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <IndustryBenchmark
          title="Benchmark do Setor"
          metrics={benchmarkMetrics}
        />
        
        <PerformanceRanking
          title="Ranking de Pilotos"
          rankings={pilotRankings}
        />
      </div>
    </div>
  );
}

export default {
  PeriodComparison,
  TrendAnalysis,
  IndustryBenchmark,
  PerformanceRanking,
  ComparativeAnalyticsDashboard
};