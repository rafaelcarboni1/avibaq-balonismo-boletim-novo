"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}

// Modal transition wrapper
interface ModalTransitionProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ModalTransition({ 
  children, 
  isOpen, 
  onClose, 
  className 
}: ModalTransitionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              duration: 0.3, 
              ease: "easeOut",
              type: "spring",
              damping: 20,
              stiffness: 300
            }}
            className={cn(
              "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "bg-white rounded-2xl shadow-2xl border border-gray-200/50",
              "max-w-md w-full mx-4",
              className
            )}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Slide transition for sidebars and drawers
interface SlideTransitionProps {
  children: React.ReactNode;
  isOpen: boolean;
  direction?: "left" | "right" | "up" | "down";
  className?: string;
}

export function SlideTransition({ 
  children, 
  isOpen, 
  direction = "left",
  className 
}: SlideTransitionProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "left": return { x: "-100%" };
      case "right": return { x: "100%" };
      case "up": return { y: "-100%" };
      case "down": return { y: "100%" };
      default: return { x: "-100%" };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case "left":
      case "right": return { x: 0 };
      case "up":
      case "down": return { y: 0 };
      default: return { x: 0 };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={getInitialPosition()}
          animate={getAnimatePosition()}
          exit={getInitialPosition()}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 200 
          }}
          className={cn("fixed z-50", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Fade transition for content changes
interface FadeTransitionProps {
  children: React.ReactNode;
  show: boolean;
  className?: string;
  delay?: number;
}

export function FadeTransition({ 
  children, 
  show, 
  className,
  delay = 0
}: FadeTransitionProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ 
            duration: 0.3, 
            delay,
            ease: "easeInOut" 
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Stagger children animation
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ 
  children, 
  className,
  staggerDelay = 0.1
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Individual stagger item
interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
  y?: number;
}

export function StaggerItem({ 
  children, 
  className,
  y = 20
}: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: "easeOut"
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale transition for buttons and interactive elements
interface ScaleTransitionProps {
  children: React.ReactNode;
  className?: string;
  whileHover?: number;
  whileTap?: number;
}

export function ScaleTransition({ 
  children, 
  className,
  whileHover = 1.05,
  whileTap = 0.95
}: ScaleTransitionProps) {
  return (
    <motion.div
      whileHover={{ scale: whileHover }}
      whileTap={{ scale: whileTap }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}