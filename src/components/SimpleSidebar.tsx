"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "../lib/utils";
import { supabase } from "../integrations/supabase/client";
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

interface SimpleSidebarProps {
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
  return [];
};

export default function SimpleSidebar({ 
  user, 
  role, 
  nome,
  children 
}: SimpleSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      router.push("/");
    }
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="h-full flex flex-col">
      {/* Header da sidebar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png"
            alt="AVIBAQ"
            className="h-10 w-10 rounded-lg"
          />
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-800">AVIBAQ</span>
              <span className="text-xs text-gray-600">Sistema Meteorológico</span>
            </div>
          )}
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          {(!isCollapsed || isMobile) && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-800 truncate">
                {userName}
              </span>
              <span className="text-xs text-gray-600 capitalize">
                {role || 'usuário'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {getNavLinks(role).map((link) => {
          if (link.adminOnly && role !== "admin") return null;
          
          const active = isActive(link.href);
          const Icon = link.icon;
          
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => {
                console.log('[SimpleSidebar] Navegando para:', link.href);
                console.log('[SimpleSidebar] URL atual:', router.pathname);
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl",
                active 
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" 
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-800"
              )}
            >
              <Icon className="h-5 w-5" />
              {(!isCollapsed || isMobile) && (
                <span className="text-sm font-medium">
                  {link.label}
                </span>
              )}
              {link.badge && (!isCollapsed || isMobile) && (
                <span className="ml-auto px-2 py-1 text-xs bg-red-500 text-white rounded-full">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          {(!isCollapsed || isMobile) && (
            <span className="text-sm font-medium">
              Logout
            </span>
          )}
        </button>
      </div>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="p-4">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronLeftIcon className="h-4 w-4 text-gray-600" />
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-30 shadow-lg",
          isCollapsed ? "w-20" : "w-72"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-gray-200 shadow-lg"
      >
        <Bars3Icon className="h-6 w-6 text-gray-700" />
      </button>

      {/* Mobile sidebar */}
      {isMobileOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-gray-900/30 z-40"
          />
          
          {/* Sidebar */}
          <aside className="lg:hidden fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 z-50 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
            
            <SidebarContent isMobile />
          </aside>
        </>
      )}

      {/* Main content */}
      <main 
        className={cn(
          "min-h-screen bg-gray-50",
          isCollapsed ? "lg:ml-20" : "lg:ml-72",
          "px-4 py-6 sm:px-6 lg:px-8"
        )}
      >
        {children}
      </main>
    </>
  );
}