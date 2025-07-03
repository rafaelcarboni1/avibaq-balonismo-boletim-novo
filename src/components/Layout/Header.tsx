import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

export const Header = () => {
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img src="https://elcbodhxzvoqpzamgown.supabase.co/storage/v1/object/public/public-assets/Logo%20AVIBAQ.png" alt="Logo AVIBAQ" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', background: '#fff' }} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">AVIBAQ</h1>
              <p className="text-sm text-gray-600">Associação de Pilotos e Empresas de Balonismo</p>
            </div>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Button variant="ghost" className="hover:text-primary" onClick={() => router.push("/")}>Início</Button>
            <Button variant="ghost" className="hover:text-primary" onClick={() => router.push("/historico")}>Histórico</Button>
            <Button variant="ghost" className="hover:text-primary" onClick={() => router.push("/quem-somos")}>Quem Somos</Button>
            <Button variant="outline" className="hover:text-primary" onClick={() => router.push("/admin/login")}>Área Admin</Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
