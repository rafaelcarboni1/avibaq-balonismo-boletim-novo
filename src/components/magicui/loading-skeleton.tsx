"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  variant?: "card" | "text" | "avatar" | "chart" | "table" | "custom";
  lines?: number;
  width?: string;
  height?: string;
  rounded?: boolean;
}

const shimmerVariants = {
  initial: { x: "-100%" },
  animate: {
    x: "100%",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear"
    }
  }
};

export default function LoadingSkeleton({
  className,
  variant = "text",
  lines = 3,
  width = "100%",
  height = "1rem",
  rounded = true
}: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            {/* Content */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            {/* Footer */}
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        );

      case "avatar":
        return <Skeleton className="h-12 w-12 rounded-full" />;

      case "chart":
        return (
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-end space-x-2">
                  <Skeleton 
                    className="w-8" 
                    style={{ height: `${Math.random() * 100 + 40}px` }} 
                  />
                  <Skeleton 
                    className="w-8" 
                    style={{ height: `${Math.random() * 100 + 40}px` }} 
                  />
                  <Skeleton 
                    className="w-8" 
                    style={{ height: `${Math.random() * 100 + 40}px` }} 
                  />
                  <Skeleton 
                    className="w-8" 
                    style={{ height: `${Math.random() * 100 + 40}px` }} 
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "table":
        return (
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            {/* Rows */}
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((col) => (
                  <Skeleton key={col} className="h-3 w-full" />
                ))}
              </div>
            ))}
          </div>
        );

      case "text":
        return (
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  "h-4",
                  i === lines - 1 ? "w-3/5" : "w-full"
                )}
              />
            ))}
          </div>
        );

      case "custom":
        return (
          <Skeleton
            className={className}
            style={{ width, height }}
          />
        );

      default:
        return <Skeleton className="h-4 w-full" />;
    }
  };

  return (
    <div className={cn("animate-pulse", className)}>
      {renderSkeleton()}
    </div>
  );
}

// Base Skeleton component with shimmer effect
function Skeleton({ 
  className, 
  style 
}: { 
  className?: string; 
  style?: React.CSSProperties 
}) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-gray-200 rounded-lg",
        className
      )}
      style={style}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear"
        }}
      />
    </div>
  );
}