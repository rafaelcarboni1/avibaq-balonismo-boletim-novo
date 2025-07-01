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
          {/* Rotas Admin Boletins */}
          <Route path="/admin/boletins" element={<AdminBoletinsList />} />
          <Route path="/admin/boletins/new" element={<AdminBoletimForm />} />
          <Route path="/admin/boletins/:id/edit" element={<AdminBoletimForm />} />
          <Route path="/admin" element={<Navigate to="/admin/boletins" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
