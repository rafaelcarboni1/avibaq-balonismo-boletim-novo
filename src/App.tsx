import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Historico from "./pages/Historico";
import QuemSomos from "./pages/QuemSomos";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import Acessibilidade from "./pages/Acessibilidade";
import NotFound from "./pages/NotFound";
import AdminBoletinsList from "./pages/AdminBoletinsList";
import AdminBoletimForm from "./pages/AdminBoletimForm";
import Descadastrar from "./pages/Descadastrar";
import AdminLogin from "./pages/AdminLogin";
import RequireAdmin from "@/components/RequireAdmin";
import AdminSetPassword from "./pages/AdminSetPassword";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminRegister from "./pages/AdminRegister";

const queryClient = new QueryClient();

function AuthRedirector() {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    async function checkInvite() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      // Se está autenticado e veio de um convite (url com access_token ou route raiz após convite)
      if (user && location.pathname === "/") {
        // Redireciona para definir senha
        navigate("/admin/definir-senha");
      }
    }
    checkInvite();
    // eslint-disable-next-line
  }, [location]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthRedirector />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/historico" element={<Historico />} />
          <Route path="/quem-somos" element={<QuemSomos />} />
          <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
          <Route path="/acessibilidade" element={<Acessibilidade />} />
          <Route path="/descadastrar" element={<Descadastrar />} />
          {/* Rotas Admin Boletins */}
          <Route path="/admin/boletins" element={<RequireAdmin><AdminBoletinsList /></RequireAdmin>} />
          <Route path="/admin/boletins/new" element={<RequireAdmin><AdminBoletimForm /></RequireAdmin>} />
          <Route path="/admin/boletins/:id/edit" element={<RequireAdmin><AdminBoletimForm /></RequireAdmin>} />
          <Route path="/admin/cadastrar-admin" element={<RequireAdmin><AdminRegister /></RequireAdmin>} />
          <Route path="/admin" element={<Navigate to="/admin/boletins" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/definir-senha" element={<AdminSetPassword />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
