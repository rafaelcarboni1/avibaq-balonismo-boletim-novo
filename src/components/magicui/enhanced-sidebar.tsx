"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { designTokens } from "../../lib/design-tokens";
import { supabase } from "../../integrations/supabase/client";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  HomeIcon,
  DocumentTextIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  KeyIcon,
  Bars3Icon,
  XMarkIcon,
  CloudIcon,
  CalendarIcon,
  EnvelopeIcon,
  TruckIcon,
  MapIcon
} from "@heroicons/react/24/outline";

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: string;
}

interface EnhancedSidebarProps {
  user?: any;
  role?: string;
  nome?: string;
  children?: React.ReactNode;
}

// Navigation links based on user role
const getNavLinks = (role?: string): NavigationItem[] => {
  if (role === 'admin' || role === 'meteo' || role === 'tesouraria') {
    return [
      { href: "/admin/dashboard", label: "Dashboard", icon: HomeIcon },
      { href: "/admin/boletins", label: "Boletins", icon: DocumentTextIcon },
      { href: "/admin/associados", label: "Associados", icon: UsersIcon },
      { href: "/admin/usuarios", label: "Usuários", icon: Cog6ToothIcon, adminOnly: true },
      { href: "/admin/permissoes", label: "Permissões", icon: KeyIcon, adminOnly: true },
      { href: "/admin/minha-conta", label: "Minha Conta", icon: UserCircleIcon },
    ];
  } else if (role === 'piloto') {
    return [
      { href: "/piloto/dashboard", label: "Dashboard", icon: HomeIcon },
      { href: "/piloto/meus-baloes", label: "Meus Balões", icon: CloudIcon },
      { href: "/piloto/planejamento", label: "Planejamento", icon: CalendarIcon },
      { href: "/piloto/convites", label: "Convites", icon: EnvelopeIcon },
      { href: "/piloto/minha-conta", label: "Minha Conta", icon: UserCircleIcon },
    ];
  } else if (role === 'agencia') {
    return [
      { href: "/agencia/dashboard", label: "Dashboard", icon: HomeIcon },
      { href: "/agencia/frota", label: "Frota", icon: TruckIcon },
      { href: "/agencia/pilotos", label: "Pilotos", icon: UsersIcon },
      { href: "/agencia/planejamento", label: "Planejamento", icon: MapIcon },
      { href: "/agencia/minha-conta", label: "Minha Conta", icon: UserCircleIcon },
    ];
  }
  // Default empty array for unknown roles
  return [];
};

// Variants para animações otimizadas
const menuItemVariants = {
  collapsed: { opacity: 0, width: 0 },
  expanded: { opacity: 1, width: "auto" }
};

// Otimizado: transições mais rápidas e menos propriedades animadas

export default function EnhancedSidebar({ 
  user, 
  role, 
  nome,
  children 
}: EnhancedSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const router = useRouter();
  
  const userName = nome || user?.user_metadata?.full_name || user?.email || "Usuário";

  // Detecta rota ativa
  const isActive = (href: string) => {
    return router.pathname.startsWith(href);
  };

  // Fecha sidebar mobile ao navegar
  useEffect(() => {
    const handleRouteChange = () => setIsMobileOpen(false);
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  const handleLogout = async () => {
    setIsMobileOpen(false);
    try {
      // Perform logout using Supabase
      await supabase.auth.signOut();
      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Even if there's an error, redirect to home
      router.push("/");
    }
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="h-full flex flex-col">
      {/* Header da sidebar */}
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center gap-3">
          <motion.img
            src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png"
            alt="AVIBAQ"
            className="h-10 w-10 rounded-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <span className="text-lg font-bold text-gray-800">AVIBAQ</span>
                <span className="text-xs text-gray-600">Sistema Meteorológico</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-200/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.div
                variants={menuItemVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="flex flex-col min-w-0"
              >
                <span className="text-sm font-medium text-gray-800 truncate">
                  {userName}
                </span>
                <span className="text-xs text-gray-600 capitalize">
                  {role || 'usuário'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {getNavLinks(role).map((link, index) => {
          if (link.adminOnly && role !== "admin") return null;
          
          const active = isActive(link.href);
          const Icon = link.icon;
          
          return (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              style={{ willChange: 'transform, opacity' }}
            >
              <Link
                href={link.href}
                onMouseEnter={() => setHoveredItem(link.href)}
                onMouseLeave={() => setHoveredItem(null)}
                onClick={() => {
                  console.log('[EnhancedSidebar] Navegando para:', link.href);
                  console.log('[EnhancedSidebar] URL atual:', router.pathname);
                }}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group",
                  active 
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-400/25" 
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-800"
                )}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    hoveredItem === link.href && "scale-110"
                  )} />
                  
                  <AnimatePresence>
                    {(!isCollapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium"
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {link.badge && (!isCollapsed || isMobile) && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-auto px-2 py-1 text-xs bg-red-500 text-white rounded-full"
                    >
                      {link.badge}
                    </motion.span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-gray-200/50">
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-center gap-3 px-3 py-3 w-full rounded-xl transition-all duration-200",
            "text-red-600 hover:bg-red-50 hover:text-red-700"
          )}
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                variants={menuItemVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="text-sm font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="p-4">
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
            )}
          </motion.button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:flex fixed left-0 top-0 h-full bg-white/80 backdrop-blur-xl border-r border-gray-200/50 z-30 shadow-xl"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg"
      >
        <Bars3Icon className="h-6 w-6 text-gray-700" />
      </button>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-40"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="lg:hidden fixed left-0 top-0 h-full w-80 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 z-50 shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
              
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main 
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen",
          isCollapsed ? "lg:ml-20" : "lg:ml-[280px]",
          "px-4 py-6 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100/50"
        )}
      >
        {children}
      </main>
    </>
  );
}