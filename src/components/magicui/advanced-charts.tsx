/**
 * Advanced Chart Components para Dashboards KPI
 * Componentes de gráficos avançados com animações e interatividade
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ChartDataPoint {
  name: string;
  value: number;
  extra?: any;
}

interface AdvancedChartProps {
  title: string;
  data: ChartDataPoint[];
  type: 'line' | 'area' | 'heatmap' | 'gauge' | 'scatter';
  colors?: string[];
  className?: string;
  height?: number;
  interactive?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

// Componente de Gráfico de Linha Avançado
export function AdvancedLineChart({ 
  title, 
  data, 
  colors = ['#3b82f6', '#10b981'], 
  className = '',
  height = 300,
  animate = true,
  showGrid = true
}: AdvancedChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;
  
  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - ((item.value - minValue) / range) * 80
  }));
  
  const pathD = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, '');
  
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200/50 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      
      <div className="relative" style={{ height }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Grid */}
          {showGrid && (
            <g className="opacity-20">
              {[0, 25, 50, 75, 100].map(y => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#94a3b8" strokeWidth="0.2" />
              ))}
              {data.map((_, index) => {
                const x = (index / (data.length - 1)) * 100;
                return <line key={index} x1={x} y1="0" x2={x} y2="100" stroke="#94a3b8" strokeWidth="0.2" />;
              })}
            </g>
          )}
          
          {/* Area gradiente */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors[0]} stopOpacity="0.3" />
              <stop offset="100%" stopColor={colors[0]} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {animate ? (
            <motion.path
              d={areaD}
              fill="url(#areaGradient)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          ) : (
            <path d={areaD} fill="url(#areaGradient)" />
          )}
          
          {/* Linha principal */}
          {animate ? (
            <motion.path
              d={pathD}
              fill="none"
              stroke={colors[0]}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          ) : (
            <path
              d={pathD}
              fill="none"
              stroke={colors[0]}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          
          {/* Pontos interativos */}
          {points.map((point, index) => (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={hoveredPoint === index ? "1.5" : "1"}
              fill={colors[0]}
              stroke="white"
              strokeWidth="0.5"
              className="cursor-pointer"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + 1, duration: 0.3 }}
              onMouseEnter={() => setHoveredPoint(index)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bg-white text-gray-900 border border-gray-200 shadow-lg text-xs rounded px-2 py-1 pointer-events-none z-10"
            style={{
              left: `${points[hoveredPoint].x}%`,
              top: `${points[hoveredPoint].y}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div>{data[hoveredPoint].name}</div>
            <div className="font-bold">{data[hoveredPoint].value}</div>
          </motion.div>
        )}
      </div>
      
      {/* Labels do eixo X */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {data.map((item, index) => (
          <span key={index} className={index % 2 === 0 ? '' : 'hidden sm:block'}>
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// Componente de Gauge/Medidor
export function GaugeChart({ 
  title, 
  value, 
  max = 100, 
  colors = ['#ef4444', '#f59e0b', '#10b981'], 
  className = '',
  unit = '%'
}: { 
  title: string; 
  value: number; 
  max?: number; 
  colors?: string[]; 
  className?: string;
  unit?: string;
}) {
  const percentage = (value / max) * 100;
  const angle = (percentage / 100) * 180;
  
  const getColor = () => {
    if (percentage < 30) return colors[0]; // Vermelho
    if (percentage < 70) return colors[1]; // Amarelo
    return colors[2]; // Verde
  };

  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200/50 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      
      <div className="relative w-48 h-24 mx-auto">
        <svg viewBox="0 0 200 100" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 20 80 A 80 80 0 0 1 180 80"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Colored segments */}
          <motion.path
            d={`M 20 80 A 80 80 0 0 1 ${20 + (160 * percentage / 100)} ${80 - Math.sin((angle * Math.PI) / 180) * 80}`}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          
          {/* Needle */}
          <motion.line
            x1="100"
            y1="80"
            x2={100 + Math.cos((angle - 90) * Math.PI / 180) * 60}
            y2={80 + Math.sin((angle - 90) * Math.PI / 180) * 60}
            stroke="#374151"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ rotate: -90 }}
            animate={{ rotate: angle - 90 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ transformOrigin: '100px 80px' }}
          />
          
          {/* Center dot */}
          <circle cx="100" cy="80" r="3" fill="#374151" />
        </svg>
        
        {/* Value display */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <div className="text-center">
            <motion.div 
              className="text-2xl font-bold text-gray-900"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              {value}{unit}
            </motion.div>
            <div className="text-xs text-gray-500">de {max}{unit}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de Heatmap
export function HeatmapChart({ 
  title, 
  data, 
  className = '',
  colors = ['#fef3c7', '#f59e0b', '#dc2626']
}: { 
  title: string; 
  data: { day: string; hour: number; value: number }[]; 
  className?: string;
  colors?: string[];
}) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const maxValue = Math.max(...data.map(d => d.value));
  
  const getColor = (value: number) => {
    const intensity = value / maxValue;
    if (intensity < 0.3) return colors[0];
    if (intensity < 0.7) return colors[1];
    return colors[2];
  };

  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200/50 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      
      <div className="overflow-x-auto">
        <div className="grid grid-cols-25 gap-1 min-w-max">
          {/* Header com horas */}
          <div></div>
          {hours.map(hour => (
            <div key={hour} className="text-xs text-gray-500 text-center p-1">
              {hour}h
            </div>
          ))}
          
          {/* Dados do heatmap */}
          {days.map(day => (
            <React.Fragment key={day}>
              <div className="text-xs text-gray-500 font-medium p-1 flex items-center">
                {day}
              </div>
              {hours.map(hour => {
                const dataPoint = data.find(d => d.day === day && d.hour === hour);
                const value = dataPoint?.value || 0;
                
                return (
                  <motion.div
                    key={`${day}-${hour}`}
                    className="w-6 h-6 rounded cursor-pointer"
                    style={{ backgroundColor: getColor(value) }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (hour + days.indexOf(day)) * 0.01 }}
                    title={`${day} ${hour}:00 - ${value} voos`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Legenda */}
      <div className="flex items-center justify-center mt-4 space-x-2 text-xs text-gray-500">
        <span>Menos</span>
        {colors.map((color, index) => (
          <div key={index} className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
        ))}
        <span>Mais</span>
      </div>
    </div>
  );
}

// Componente de Gráfico de Dispersão
export function ScatterChart({ 
  title, 
  data, 
  xLabel = 'X', 
  yLabel = 'Y',
  colors = ['#3b82f6'],
  className = ''
}: { 
  title: string; 
  data: { x: number; y: number; label?: string }[]; 
  xLabel?: string;
  yLabel?: string;
  colors?: string[];
  className?: string;
}) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  const maxX = Math.max(...data.map(d => d.x));
  const maxY = Math.max(...data.map(d => d.y));
  const minX = Math.min(...data.map(d => d.x));
  const minY = Math.min(...data.map(d => d.y));

  return (
    <div className={`bg-white rounded-2xl p-6 border border-gray-200/50 shadow-lg ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      
      <div className="relative w-full h-64">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Grid */}
          <g className="opacity-20">
            {[0, 25, 50, 75, 100].map(line => (
              <React.Fragment key={line}>
                <line x1="0" y1={line} x2="100" y2={line} stroke="#94a3b8" strokeWidth="0.2" />
                <line x1={line} y1="0" x2={line} y2="100" stroke="#94a3b8" strokeWidth="0.2" />
              </React.Fragment>
            ))}
          </g>
          
          {/* Points */}
          {data.map((point, index) => {
            const x = ((point.x - minX) / (maxX - minX)) * 100;
            const y = 100 - ((point.y - minY) / (maxY - minY)) * 100;
            
            return (
              <motion.circle
                key={index}
                cx={x}
                cy={y}
                r={hoveredPoint === index ? "2" : "1.5"}
                fill={colors[0]}
                fillOpacity="0.7"
                stroke={colors[0]}
                strokeWidth="0.5"
                className="cursor-pointer"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {hoveredPoint !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bg-white text-gray-900 border border-gray-200 shadow-lg text-xs rounded px-2 py-1 pointer-events-none z-10"
            style={{
              left: `${((data[hoveredPoint].x - minX) / (maxX - minX)) * 100}%`,
              top: `${100 - ((data[hoveredPoint].y - minY) / (maxY - minY)) * 100}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div>{data[hoveredPoint].label || `Ponto ${hoveredPoint + 1}`}</div>
            <div>{xLabel}: {data[hoveredPoint].x}</div>
            <div>{yLabel}: {data[hoveredPoint].y}</div>
          </motion.div>
        )}
      </div>
      
      {/* Axis labels */}
      <div className="flex justify-between items-end mt-2">
        <span className="text-xs text-gray-500 transform -rotate-90">{yLabel}</span>
        <span className="text-xs text-gray-500">{xLabel}</span>
      </div>
    </div>
  );
}

export default {
  AdvancedLineChart,
  GaugeChart,
  HeatmapChart,
  ScatterChart
};