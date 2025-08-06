"use client";

import { useUser } from "../hooks/useUser";
import SimpleSidebar from "./SimpleSidebar";
import SimpleBreadcrumbs from "./SimpleBreadcrumbs";
import { cn } from "../lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
}

interface SimpleDashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  headerActions?: React.ReactNode;
  loading?: boolean;
}

export default function SimpleDashboardLayout({
  children,
  title,
  breadcrumbs = [],
  className,
  headerActions,
  loading = false
}: SimpleDashboardLayoutProps) {
  const { user, role, nome } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Sidebar */}
      <SimpleSidebar user={user} role={role} nome={nome}>
        <div className="max-w-7xl mx-auto px-0">
          
          {/* Header */}
          {(title || breadcrumbs.length > 0 || headerActions) && (
            <header className="mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                      <SimpleBreadcrumbs items={breadcrumbs} />
                    )}
                    
                    {/* Page Title */}
                    {title && (
                      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {title}
                      </h1>
                    )}
                  </div>
                  
                  {/* Header Actions */}
                  {headerActions && (
                    <div className="flex items-center gap-3">
                      {headerActions}
                    </div>
                  )}
                </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className={cn("relative", className)}>
            {/* Content wrapper */}
            <div className="relative">
              {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                children
              )}
            </div>
          </main>
        </div>
      </SimpleSidebar>
    </div>
  );
}

export { SimpleDashboardLayout };