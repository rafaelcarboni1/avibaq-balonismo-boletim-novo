"use client";

import { motion } from "framer-motion";
import { useUser } from "../../hooks/useUser";
import EnhancedSidebar from "./enhanced-sidebar";
import AnimatedBreadcrumbs from "./animated-breadcrumbs";
import { cn } from "../../lib/utils";
import { designTokens } from "../../lib/design-tokens";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  headerActions?: React.ReactNode;
  loading?: boolean;
}

const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    scale: 0.98 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as any
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3
    }
  }
};

const headerVariants = {
  initial: { opacity: 0, y: -20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      delay: 0.1
    }
  }
};

export default function EnhancedDashboardLayout({
  children,
  title,
  breadcrumbs = [],
  className,
  headerActions,
  loading = false
}: EnhancedDashboardLayoutProps) {
  const { user, role, nome } = useUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
      {/* Enhanced Sidebar */}
      <EnhancedSidebar user={user} role={role} nome={nome}>
        <div className="max-w-7xl mx-auto px-0">
          {/* Header */}
          {(title || breadcrumbs.length > 0 || headerActions) && (
            <motion.header
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8"
            >
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-6 shadow-lg shadow-gray-500/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                      <AnimatedBreadcrumbs items={breadcrumbs} />
                    )}
                    
                    {/* Page Title */}
                    {title && (
                      <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="text-3xl font-bold text-gray-900 tracking-tight"
                      >
                        {title}
                      </motion.h1>
                    )}
                  </div>
                  
                  {/* Header Actions */}
                  {headerActions && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="flex items-center gap-3"
                    >
                      {headerActions}
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.header>
          )}

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={cn("relative", className)}
          >
            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-100/20 to-blue-100/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
            </div>
            
            {/* Content wrapper */}
            <div className="relative">
              {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                children
              )}
            </div>
          </motion.main>
        </div>
      </EnhancedSidebar>
    </div>
  );
}

export { EnhancedDashboardLayout };