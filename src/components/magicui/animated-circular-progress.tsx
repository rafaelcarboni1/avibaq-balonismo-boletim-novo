"use client";

import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

interface AnimatedCircularProgressProps {
  max?: number;
  value?: number;
  min?: number;
  gaugePrimaryColor?: string;
  gaugeSecondaryColor?: string;
  className?: string;
}

export default function AnimatedCircularProgress({
  max = 100,
  min = 0,
  value = 0,
  gaugePrimaryColor = "#3b82f6",
  gaugeSecondaryColor = "#e5e7eb",
  className,
}: AnimatedCircularProgressProps) {
  const circumference = 2 * Math.PI * 45;
  const percentPx = circumference / 100;
  const currentPercent = ((value - min) / (max - min)) * 100;

  return (
    <div
      className={cn(
        "relative size-40 text-2xl font-semibold",
        className,
      )}
    >
      <svg
        fill="none"
        shapeRendering="crispEdges"
        height="100%"
        width="100%"
        viewBox="0 0 100 100"
        strokeWidth="2"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={gaugeSecondaryColor}
          strokeWidth="10"
          strokeLinecap="round"
          className="opacity-30"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke={gaugePrimaryColor}
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{
            strokeDasharray: `${currentPercent * percentPx} ${circumference}`,
          }}
          transition={{
            duration: 1,
            delay: 0.5,
            ease: "easeInOut",
          }}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-lg font-bold"
        >
          {Math.round(currentPercent)}%
        </motion.span>
      </div>
    </div>
  );
}