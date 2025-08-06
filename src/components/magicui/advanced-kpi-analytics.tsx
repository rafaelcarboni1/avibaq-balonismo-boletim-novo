/**
 * Advanced KPI Analytics Components
 * Componentes para análise avançada de KPIs de segurança, performance e operações
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { NumberTicker } from './number-ticker';

interface KPIMetric {
  value: number;
  target?: number;
  previousValue?: number;
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | 'time';
}

interface AdvancedKPICardProps {
  title: string;
  metric: KPIMetric;
  icon?: React.ElementType;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'gray';
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  className?: string;
  alert?: boolean;
}

// Mapa de cores para os KPIs
const colorMap = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    accent: 'text-green-600',
    icon: 'bg-green-500'
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    accent: 'text-red-600',
    icon: 'bg-red-500'
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    accent: 'text-blue-600',
    icon: 'bg-blue-500'
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-900',
    accent: 'text-yellow-600',
    icon: 'bg-yellow-500'
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-900',
    accent: 'text-purple-600',
    icon: 'bg-purple-500'
  },
  gray: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-900',
    accent: 'text-gray-600',
    icon: 'bg-gray-500'
  }
};

// Formatar valores conforme o tipo
function formatValue(value: number, format: string = 'number', unit: string = ''): string {
  switch (format) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(value);
    case 'time':
      const hours = Math.floor(value);
      const minutes = Math.round((value - hours) * 60);
      return `${hours}h ${minutes}m`;
    default:
      return `${value.toLocaleString('pt-BR')}${unit}`;
  }
}

// Calcular tendência
function calculateTrend(current: number, previous: number): { direction: 'up' | 'down' | 'neutral', percentage: number } {
  if (!previous || previous === 0) return { direction: 'neutral', percentage: 0 };
  
  const change = ((current - previous) / previous) * 100;
  
  if (Math.abs(change) < 1) return { direction: 'neutral', percentage: change };
  return { 
    direction: change > 0 ? 'up' : 'down', 
    percentage: Math.abs(change) 
  };
}

// Componente de KPI Avançado
export function AdvancedKPICard({
  title,
  metric,
  icon: Icon = ChartBarIcon,
  color = 'blue',
  trend,
  description,
  className = '',
  alert = false
}: AdvancedKPICardProps) {
  const colors = colorMap[color];
  const formattedValue = formatValue(metric.value, metric.format, metric.unit);
  
  // Calcular tendência automática se previousValue estiver disponível
  const calculatedTrend = metric.previousValue ? 
    calculateTrend(metric.value, metric.previousValue) : 
    null;
  
  const trendDirection = trend || calculatedTrend?.direction || 'neutral';
  const trendPercentage = calculatedTrend?.percentage || 0;
  
  // Calcular progresso em relação ao target
  const progress = metric.target ? (metric.value / metric.target) * 100 : null;
  const isOnTarget = progress ? progress >= 95 : true; // 95% ou mais = no target

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-lg
        ${colors.bg} ${colors.border} ${alert ? 'ring-2 ring-red-400 animate-pulse' : ''}
        ${className}
      `}
    >
      {/* Alert indicator */}
      {alert && (
        <div className="absolute top-2 right-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* Conteúdo principal */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-sm font-medium ${colors.accent}`}>{title}</h3>
              {metric.target && (
                <div className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${isOnTarget ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                `}>
                  {isOnTarget ? 'No target' : 'Abaixo do target'}
                </div>
              )}
            </div>
            
            {/* Valor principal */}
            <div className={`text-3xl font-bold ${colors.text} mb-1`}>
              <NumberTicker value={metric.value} />
              {metric.unit && !['percentage', 'currency', 'time'].includes(metric.format || '') && (
                <span className="text-lg ml-1">{metric.unit}</span>
              )}
            </div>
            
            {/* Tendência */}
            <div className="flex items-center gap-2 text-sm">
              {trendDirection !== 'neutral' && (
                <div className={`
                  flex items-center gap-1 px-2 py-1 rounded-full
                  ${trendDirection === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                `}>
                  {trendDirection === 'up' ? (
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                  )}
                  <span className="font-medium">
                    {trendPercentage > 0 ? `${trendPercentage.toFixed(1)}%` : 'Estável'}
                  </span>
                </div>
              )}
              
              {description && (
                <span className={colors.accent}>{description}</span>
              )}
            </div>
            
            {/* Barra de progresso do target */}
            {metric.target && progress && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>Meta: {formatValue(metric.target, metric.format, metric.unit)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${
                      progress >= 95 ? 'bg-green-500' : 
                      progress >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Ícone */}
          <div className={`
            flex-shrink-0 w-12 h-12 ${colors.icon} rounded-lg 
            flex items-center justify-center ml-4
          `}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Componente de Painel de KPIs de Segurança
export function SafetyKPIPanel({ 
  flightStats, 
  className = '' 
}: { 
  flightStats: any; 
  className?: string;
}) {
  const safetyScore = 98.5; // Score calculado baseado em múltiplos fatores
  const incidentRate = 0.02; // Taxa de incidentes por 100 voos
  const complianceRate = 96.8; // Taxa de compliance com checklists
  const weatherCancellations = 5; // Cancelamentos por condições meteorológicas (bom indicador)

  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <ShieldCheckIcon className="h-6 w-6 text-green-600" />
        KPIs de Segurança
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdvancedKPICard
          title="Safety Score"
          metric={{
            value: safetyScore,
            target: 95,
            previousValue: 97.8,
            format: 'percentage'
          }}
          icon={ShieldCheckIcon}
          color="green"
          description="Último mês"
          alert={safetyScore < 95}
        />
        
        <AdvancedKPICard
          title="Taxa de Incidentes"
          metric={{
            value: incidentRate,
            target: 0.05,
            previousValue: 0.03,
            format: 'percentage'
          }}
          icon={ExclamationTriangleIcon}
          color="red"
          description="Por 100 voos"
          alert={incidentRate > 0.05}
        />
        
        <AdvancedKPICard
          title="Compliance Checklist"
          metric={{
            value: complianceRate,
            target: 95,
            previousValue: 94.2,
            format: 'percentage'
          }}
          icon={CheckCircleIcon}
          color="blue"
          description="Checklists completos"
        />
        
        <AdvancedKPICard
          title="Cancelamentos Clima"
          metric={{
            value: weatherCancellations,
            previousValue: 3,
            unit: ' voos'
          }}
          icon={ClockIcon}
          color="yellow"
          description="Último mês"
        />
      </div>
    </div>
  );
}

// Componente de Painel de KPIs Operacionais
export function OperationalKPIPanel({ 
  operationalStats, 
  className = '' 
}: { 
  operationalStats: any; 
  className?: string;
}) {
  const utilizationRate = 73.5; // Taxa de utilização da frota
  const avgFlightDuration = 2.3; // Duração média dos voos
  const onTimePerformance = 89.2; // Performance de pontualidade
  const revenuePerFlight = 1850; // Receita média por voo

  return (
    <div className={`space-y-6 ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <ChartBarIcon className="h-6 w-6 text-blue-600" />
        KPIs Operacionais
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdvancedKPICard
          title="Utilização da Frota"
          metric={{
            value: utilizationRate,
            target: 75,
            previousValue: 68.9,
            format: 'percentage'
          }}
          icon={ChartBarIcon}
          color="blue"
          description="Horas de voo/disponível"
        />
        
        <AdvancedKPICard
          title="Duração Média Voo"
          metric={{
            value: avgFlightDuration,
            previousValue: 2.1,
            format: 'time'
          }}
          icon={ClockIcon}
          color="purple"
          description="Tempo de voo"
        />
        
        <AdvancedKPICard
          title="Performance Pontual"
          metric={{
            value: onTimePerformance,
            target: 85,
            previousValue: 86.7,
            format: 'percentage'
          }}
          icon={CheckCircleIcon}
          color="green"
          description="Voos no horário"
        />
        
        <AdvancedKPICard
          title="Receita por Voo"
          metric={{
            value: revenuePerFlight,
            previousValue: 1720,
            format: 'currency'
          }}
          icon={CurrencyDollarIcon}
          color="yellow"
          description="Receita média"
        />
      </div>
    </div>
  );
}

// Hook para calcular KPIs avançados
export function useAdvancedKPIs(rawData: any) {
  const [kpis, setKpis] = useState({
    safety: {
      safetyScore: 0,
      incidentRate: 0,
      complianceRate: 0,
      weatherCancellations: 0
    },
    operational: {
      utilizationRate: 0,
      avgFlightDuration: 0,
      onTimePerformance: 0,
      revenuePerFlight: 0
    },
    financial: {
      revenue: 0,
      costs: 0,
      profit: 0,
      roi: 0
    }
  });

  useEffect(() => {
    if (rawData) {
      // Aqui você faria os cálculos reais baseados nos dados
      // Por agora, valores simulados para demonstração
      setKpis({
        safety: {
          safetyScore: 98.5,
          incidentRate: 0.02,
          complianceRate: 96.8,
          weatherCancellations: 5
        },
        operational: {
          utilizationRate: 73.5,
          avgFlightDuration: 2.3,
          onTimePerformance: 89.2,
          revenuePerFlight: 1850
        },
        financial: {
          revenue: 125000,
          costs: 89000,
          profit: 36000,
          roi: 28.8
        }
      });
    }
  }, [rawData]);

  return kpis;
}

export default {
  AdvancedKPICard,
  SafetyKPIPanel,
  OperationalKPIPanel,
  useAdvancedKPIs
};