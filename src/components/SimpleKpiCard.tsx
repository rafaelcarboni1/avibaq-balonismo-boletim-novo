"use client";

import { cn } from "../lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

interface SimpleKpiCardProps {
  title: string;
  value: string | number;
  icon?: React.ElementType;
  trend?: {
    value: number;
    label: string;
    direction: "up" | "down" | "neutral";
  };
  description?: string;
  className?: string;
  loading?: boolean;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "gray" | "orange";
}

const colorVariants = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    trend: "text-blue-600"
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-600",
    trend: "text-green-600"
  },
  yellow: {
    bg: "bg-yellow-50",
    icon: "text-yellow-600",
    trend: "text-yellow-600"
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-600",
    trend: "text-red-600"
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    trend: "text-purple-600"
  },
  gray: {
    bg: "bg-gray-50",
    icon: "text-gray-600",
    trend: "text-gray-600"
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-600",
    trend: "text-orange-600"
  }
};

export default function SimpleKpiCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
  loading = false,
  color = "blue"
}: SimpleKpiCardProps) {
  const colors = colorVariants[color];

  if (loading) {
    return (
      <div className={cn(
        "bg-white rounded-xl border border-gray-200 p-6 shadow-sm",
        className
      )}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 truncate">
          {title}
        </h3>
        {Icon && (
          <div className={cn(
            "p-2 rounded-lg",
            colors.bg
          )}>
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <span className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>

      {/* Trend and Description */}
      <div className="flex items-center justify-between">
        {trend && (
          <div className="flex items-center space-x-1">
            {trend.direction === "up" && (
              <ArrowUpIcon className="h-4 w-4 text-green-500" />
            )}
            {trend.direction === "down" && (
              <ArrowDownIcon className="h-4 w-4 text-red-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              trend.direction === "up" ? "text-green-600" : 
              trend.direction === "down" ? "text-red-600" : 
              "text-gray-600"
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>
            <span className="text-sm text-gray-500">
              {trend.label}
            </span>
          </div>
        )}
        
        {description && !trend && (
          <span className="text-sm text-gray-500">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

export { SimpleKpiCard };