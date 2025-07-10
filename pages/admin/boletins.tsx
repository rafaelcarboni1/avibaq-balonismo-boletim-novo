import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/integrations/supabase/client";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Badge } from "../../src/components/ui/badge";
import { toast } from "../../src/components/ui/sonner";
import { Plus, Edit, Trash2, Users, Eye, DocumentTextIcon } from "lucide-react";
import RequireAdmin from "../../src/components/RequireAdmin";
import { useUser } from "@/hooks/useUser";
import EnhancedDashboardLayout from "@/components/magicui/enhanced-dashboard-layout";
import { BentoGrid, BentoGridItem } from "@/components/magicui/bento-grid";
import EnhancedKpiCard from "@/components/magicui/enhanced-kpi-card";
import LoadingSkeleton from "@/components/magicui/loading-skeleton";
import { StaggerContainer, StaggerItem } from "@/components/magicui/smooth-transitions";
import { motion } from "framer-motion";

type Boletim = {
  id: string;
  data: string;
  periodo: string;
  bandeira: string;
  titulo_curto: string;
  motivo: string;
  publicado: boolean;
  created_at: string;
  audios_urls?: string[];
  fotos_urls?: string[];
};

export default function AdminBoletinsList() {
  const router = useRouter();
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const { role, loading, user } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [boletimSelecionado, setBoletimSelecionado] = useState<Boletim | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchBoletins(page);
  }, [page]);

  const fetchBoletins = async (pageNum = 1) => {
    try {
      const from = (pageNum - 1) * pageSize;
      const to = from + pageSize - 1;
      // Performance: Remove debug logs in production
      // console.log('DEBUG PAGINAÇÃO', { pageNum, from, to, pageSize });
      const { data, error, count } = await supabase
        .from("boletins")
        .select("*", { count: "exact" })
        .order("data", { ascending: false })
        .range(from, to);
      // console.log('RESULTADO SUPABASE', { data, count });
      if (error) throw error;
      setBoletins(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error("Erro ao buscar boletins:", error);
      toast.error("Erro ao carregar boletins");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este boletim?")) return;

    try {
      // Buscar dados do boletim antes de deletar para log
      const { data: boletim } = await supabase.from("boletins").select("*").eq("id", id).single();
      const { error } = await supabase.from("boletins").delete().eq("id", id);
      if (error) throw error;
      // Log de atividade
      try {
        await supabase.from('logs_atividade').insert({
          acao: `Boletim excluído por ${user?.email || 'usuário desconhecido'}`,
          detalhes: {
            boletimId: id,
            data: boletim?.data,
            periodo: boletim?.periodo,
            bandeira: boletim?.bandeira,
            titulo_curto: boletim?.titulo_curto
          },
          usuario_id: user?.id || null
        });
      } catch (logError) {
        console.error('Erro ao registrar log de atividade (exclusão boletim):', logError);
      }
      toast.success("Boletim excluído com sucesso!");
      fetchBoletins();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir boletim");
    }
  };

  const handleVisualizar = (boletim: Boletim) => {
    setBoletimSelecionado(boletim);
    setShowModal(true);
  };

  const getBandeiraColor = (bandeira: string) => {
    switch (bandeira) {
      case "verde": return "bg-green-100 text-green-800";
      case "amarela": return "bg-yellow-100 text-yellow-800";
      case "vermelha": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <EnhancedDashboardLayout title="Boletins" breadcrumbs={[{ label: "Boletins", icon: DocumentTextIcon }]}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200/50">
              <LoadingSkeleton variant="card" />
            </div>
          ))}
        </div>
      </EnhancedDashboardLayout>
    );
  }
  
  if (role !== 'admin' && role !== 'tesouraria' && role !== 'meteo') {
    return <div className="max-w-2xl mx-auto mt-16 text-center text-lg text-red-600 font-semibold">Acesso restrito a administradores, tesouraria e meteorologia.</div>;
  }

  return (
    <RequireAdmin>
      <EnhancedDashboardLayout 
        title="Gerenciar Boletins"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Boletins", icon: DocumentTextIcon }
        ]}
        headerActions={
          <div className="flex gap-3">
            <Button onClick={() => router.push("/admin/dashboard")} variant="outline">
              Voltar ao Dashboard
            </Button>
            <Button onClick={() => router.push("/admin/boletins/new")} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Novo Boletim
            </Button>
          </div>
        }
      >
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <EnhancedKpiCard 
              title="Total de Boletins"
              value={total}
              icon={DocumentTextIcon}
              color="blue"
              trend="neutral"
              trendValue="Total registrado"
              description="Boletins meteorológicos"
              delay={0}
            />
            <EnhancedKpiCard 
              title="Publicados"
              value={boletins.filter(b => b.publicado).length}
              icon={Eye}
              color="green"
              trend="up"
              trendValue="Ativos"
              description="Visíveis publicamente"
              delay={0.05}
            />
            <EnhancedKpiCard 
              title="Rascunhos"
              value={boletins.filter(b => !b.publicado).length}
              icon={Edit}
              color="yellow"
              trend="neutral"
              trendValue="Pendentes"
              description="Aguardando publicação"
              delay={0.1}
            />
            <EnhancedKpiCard 
              title="Este Mês"
              value={boletins.filter(b => new Date(b.created_at).getMonth() === new Date().getMonth()).length}
              icon={Plus}
              color="purple"
              trend="up"
              trendValue="Recentes"
              description="Criados recentemente"
              delay={0.15}
            />
          </div>

          {/* Lista de Boletins */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg"
          >
            <div className="p-6 border-b border-gray-200/50">
              <h2 className="text-xl font-semibold text-gray-900">Boletins Meteorológicos</h2>
              <p className="text-gray-600 mt-1">Gerencie todos os boletins meteorológicos</p>
            </div>
            
            <div className="p-6">
              {boletins.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum boletim encontrado</p>
                  <p className="text-gray-400 text-sm mt-2">Crie seu primeiro boletim meteorológico</p>
                </div>
              ) : (
                <StaggerContainer className="space-y-4">
                  {boletins.map((boletim, index) => (
                    <StaggerItem key={boletim.id}>
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl border border-gray-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${getBandeiraColor(boletim.bandeira).replace('bg-', 'bg-').replace(' text-', ' ').split(' ')[0]}`} />
                            <div>
                              <h3 className="font-semibold text-gray-900">{boletim.titulo_curto}</h3>
                              <p className="text-sm text-gray-600">{new Date(boletim.data).toLocaleDateString('pt-BR')} - {boletim.periodo}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <Badge className={getBandeiraColor(boletim.bandeira)}>
                              {boletim.bandeira.toUpperCase()}
                            </Badge>
                            <Badge variant={boletim.publicado ? "default" : "secondary"}>
                              {boletim.publicado ? "Publicado" : "Rascunho"}
                            </Badge>
                            
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/admin/boletins/${boletim.id}/edit`)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setBoletimSelecionado(boletim);
                                  setShowModal(true);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
              
              {/* Paginação */}
              {total > pageSize && (
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200/50">
                  <div className="text-sm text-gray-600">
                    Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, total)} de {total} boletins
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * pageSize >= total}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        {/* Modal de Confirmação de Exclusão */}
        {showModal && boletimSelecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Exclusão</h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir o boletim "{boletimSelecionado.titulo_curto}"? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDelete(boletimSelecionado.id)}
                >
                  Excluir
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </EnhancedDashboardLayout>
    </RequireAdmin>
  );
} 