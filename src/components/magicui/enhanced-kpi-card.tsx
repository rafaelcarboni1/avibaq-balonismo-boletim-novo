"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import NumberTicker from "./number-ticker";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";

interface EnhancedKpiCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: "green" | "blue" | "yellow" | "red" | "purple" | "indigo";
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  description?: string;
  className?: string;
  delay?: number;
}

const colorMap = {
  green: {
    bg: "from-emerald-50 to-emerald-100/50",
    icon: "bg-emerald-500 text-white",
    value: "text-emerald-600",
    trend: "text-emerald-600",
    border: "border-emerald-200",
    glow: "shadow-emerald-500/25"
  },
  blue: {
    bg: "from-blue-50 to-blue-100/50",
    icon: "bg-blue-500 text-white",
    value: "text-blue-600",
    trend: "text-blue-600",
    border: "border-blue-200",
    glow: "shadow-blue-500/25"
  },
  yellow: {
    bg: "from-yellow-50 to-yellow-100/50",
    icon: "bg-yellow-500 text-white",
    value: "text-yellow-600",
    trend: "text-yellow-600",
    border: "border-yellow-200",
    glow: "shadow-yellow-500/25"
  },
  red: {
    bg: "from-red-50 to-red-100/50",
    icon: "bg-red-500 text-white",
    value: "text-red-600",
    trend: "text-red-600",
    border: "border-red-200",
    glow: "shadow-red-500/25"
  },
  purple: {
    bg: "from-purple-50 to-purple-100/50",
    icon: "bg-purple-500 text-white",
    value: "text-purple-600",
    trend: "text-purple-600",
    border: "border-purple-200",
    glow: "shadow-purple-500/25"
  },
  indigo: {
    bg: "from-indigo-50 to-indigo-100/50",
    icon: "bg-indigo-500 text-white",
    value: "text-indigo-600",
    trend: "text-indigo-600",
    border: "border-indigo-200",
    glow: "shadow-indigo-500/25"
  }
};

export default function EnhancedKpiCard({
  title,
  value,
  icon: Icon,
  color,
  trend,
  trendValue,
  description,
  className,
  delay = 0,
}: EnhancedKpiCardProps) {
  const colors = colorMap[color];
  const numericValue = typeof value === 'string' ? parseInt(value) || 0 : value;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      className={cn(
        "relative overflow-hidden bg-gradient-to-br border backdrop-blur-sm transition-all duration-300",
        "rounded-2xl p-6 cursor-pointer group",
        colors.bg,
        colors.border,
        "hover:shadow-xl",
        colors.glow,
        className,
      )}
    >
      {/* Background gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Floating icon */}
      <div className="flex items-start justify-between mb-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.2, duration: 0.5 }}
          className={cn(
            "p-3 rounded-xl shadow-lg transition-all duration-300",
            colors.icon,
            "group-hover:scale-110 group-hover:rotate-6"
          )}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
        
        {/* Trend indicator */}
        {trend && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.4, duration: 0.5 }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend === "up" ? "bg-green-100 text-green-700" : 
              trend === "down" ? "bg-red-100 text-red-700" : 
              "bg-gray-100 text-gray-700"
            )}
          >
            {trend === "up" && <ArrowTrendingUpIcon className="h-3 w-3" />}
            {trend === "down" && <ArrowTrendingDownIcon className="h-3 w-3" />}
            {trendValue}
          </motion.div>
        )}
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3, duration: 0.5 }}
          className="text-sm font-medium text-gray-600 tracking-wide"
        >
          {title}
        </motion.p>
        
        <div className={cn("text-3xl font-bold tracking-tight", colors.value)}>
          {typeof value === 'number' ? (
            <NumberTicker 
              value={numericValue} 
              delay={delay + 0.5}
              className={colors.value}
            />
          ) : (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: delay + 0.5, duration: 0.5 }}
            >
              {value}
            </motion.span>
          )}
        </div>
        
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.6, duration: 0.5 }}
            className="text-xs text-gray-500 mt-2"
          >
            {description}
          </motion.p>
        )}
      </div>
      
      {/* Subtle border glow */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5 group-hover:ring-black/10 transition-all duration-300" />
    </motion.div>
  );
}