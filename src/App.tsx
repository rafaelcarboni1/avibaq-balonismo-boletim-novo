import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import AdminRegister from "./pages/AdminRegister";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
