
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AVIBAQ</h1>
              <p className="text-sm text-gray-600">Associação de Pilotos e Empresas de Balonismo</p>
            </div>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Início
            </Button>
            <Button variant="ghost" onClick={() => navigate("/historico")}>
              Histórico
            </Button>
            <Button variant="ghost" onClick={() => navigate("/quem-somos")}>
              Quem Somos
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Área Admin
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
