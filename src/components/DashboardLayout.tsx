import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircleIcon, HomeIcon, DocumentTextIcon, UsersIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/admin/boletins", label: "Boletins", icon: DocumentTextIcon },
  { href: "/admin/associados", label: "Associados", icon: UsersIcon },
  { href: "/admin/usuarios", label: "Usuários", icon: Cog6ToothIcon, adminOnly: true },
  { href: "/admin/minha-conta", label: "Minha Conta", icon: UserCircleIcon },
];

export function DashboardLayout({ children, title }) {
  const { user, role, nome } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const router = useRouter();
  const userName = nome || user?.user_metadata?.full_name || user?.email || "Usuário";

  // Detecta rota ativa
  const isActive = (href) => typeof window !== 'undefined' && window.location.pathname.startsWith(href);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm ring-1 ring-black/5 flex items-center px-6 z-20 justify-between">
        {/* Esquerda: Logo + AVIBAQ */}
        <div className="flex items-center gap-3">
          <img
            src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png"
            alt="Logomarca AVIBAQ"
            className="h-10 w-10"
          />
          <span className="ml-2 text-lg font-semibold tracking-wide">AVIBAQ</span>
        </div>
        {/* Centro: Breadcrumb/título (opcional) */}
        {title && <div className="hidden md:block text-lg font-medium text-gray-700">{title}</div>}
        {/* Direita: Saudação + Avatar */}
        <div className="flex items-center gap-3 relative">
          <span className="text-sm text-gray-600">Bem-vindo, {userName}</span>
          <button className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300 hover:ring-2 hover:ring-primary transition" onClick={() => setAvatarOpen(v => !v)}>
            <UserCircleIcon className="w-7 h-7 text-primary" />
          </button>
          {avatarOpen && (
            <div className="absolute right-0 top-12 bg-white shadow-lg ring-1 ring-black/10 rounded-lg py-2 w-44 z-50">
              <Link href="/admin/minha-conta" className="block px-4 py-2 text-gray-700 hover:bg-primary hover:text-white transition-colors">Minha Conta</Link>
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-700 transition-colors" onClick={() => { setAvatarOpen(false); router.push("/admin/logout"); }}>
                <ArrowLeftOnRectangleIcon className="w-5 h-5 inline mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
        {/* Botão menu mobile */}
        <button className="md:hidden p-2 ml-2" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </header>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-[220px] bg-white ring-1 ring-black/5 shadow-md pt-20 px-2 fixed h-full z-10">
        <nav className="flex flex-col gap-1 mt-2">
          {navLinks.map(link => {
            if (link.adminOnly && role !== "admin") return null;
            const active = typeof window !== 'undefined' && window.location.pathname.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-primary hover:text-white transition-colors ${active ? "bg-primary text-white" : ""}`}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon className="w-6 h-6" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setDrawerOpen(false)} />
          {/* Drawer */}
          <div className="relative w-64 bg-white h-full shadow-lg p-6 transition-transform duration-300 transform translate-x-0">
            <button className="absolute top-2 right-2 p-2" onClick={() => setDrawerOpen(false)} aria-label="Fechar menu">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <nav className="flex flex-col gap-1 mt-8">
              {navLinks.map(link => {
                if (link.adminOnly && role !== "admin") return null;
                const active = typeof window !== 'undefined' && window.location.pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-gray-700 hover:bg-primary hover:text-white transition-colors ${active ? "bg-primary text-white" : ""}`}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
      {/* Main */}
      <main className="flex-1 lg:ml-[220px] pt-20 max-w-7xl mx-auto px-4 w-full">{children}</main>
    </div>
  );
} 