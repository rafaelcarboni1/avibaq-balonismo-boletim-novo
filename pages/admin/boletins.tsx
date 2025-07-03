import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/integrations/supabase/client";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Badge } from "../../src/components/ui/badge";
import { toast } from "../../src/components/ui/sonner";
import { Plus, Edit, Trash2, Users, Eye } from "lucide-react";
import RequireAdmin from "../../src/components/RequireAdmin";
import { useUser } from "@/hooks/useUser";

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
  const { role, loading } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [boletimSelecionado, setBoletimSelecionado] = useState<Boletim | null>(null);

  useEffect(() => {
    fetchBoletins();
  }, []);

  const fetchBoletins = async () => {
    try {
      const { data, error } = await supabase
        .from("boletins")
        .select("*")
        .order("data", { ascending: false });

      if (error) throw error;
      setBoletins(data || []);
    } catch (error) {
      console.error("Erro ao buscar boletins:", error);
      toast.error("Erro ao carregar boletins");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este boletim?")) return;

    try {
      const { error } = await supabase.from("boletins").delete().eq("id", id);
      if (error) throw error;

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
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }
  if (role !== 'admin' && role !== 'tesouraria' && role !== 'meteo') {
    return <div className="max-w-2xl mx-auto mt-16 text-center text-lg text-red-600 font-semibold">Acesso restrito a administradores, tesouraria e meteorologia.</div>;
  }

  return (
    <RequireAdmin>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gerenciar Boletins</h1>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/admin/dashboard")} variant="outline">
              Voltar ao Dashboard
            </Button>
            <Button onClick={() => router.push("/admin/boletins/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Boletim
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Boletins Meteorológicos</CardTitle>
          </CardHeader>
          <CardContent>
            {boletins.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum boletim encontrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-2 text-left">Data</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Período</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Bandeira</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boletins.map((boletim) => (
                      <tr key={boletim.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">
                          {new Date(boletim.data).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 capitalize">
                          {boletim.periodo}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          <Badge className={getBandeiraColor(boletim.bandeira)}>
                            {boletim.bandeira}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          {boletim.publicado ? (
                            <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">Publicado</span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold">Rascunho</span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleVisualizar(boletim)}>
                              <Eye className="w-3 h-3 mr-1" /> Visualizar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => router.push(`/admin/boletins/${boletim.id}/edit`)}>
                              <Edit className="w-3 h-3 mr-1" /> Editar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(boletim.id)}>
                              <Trash2 className="w-3 h-3 mr-1" /> Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Visualização do Boletim */}
        {showModal && boletimSelecionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative">
              <button className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl" onClick={() => setShowModal(false)}>&times;</button>
              <h2 className="text-2xl font-bold mb-4">Detalhes do Boletim</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div><span className="font-semibold">Data:</span> {new Date(boletimSelecionado.data).toLocaleDateString("pt-BR")}</div>
                <div><span className="font-semibold">Período:</span> {boletimSelecionado.periodo}</div>
                <div><span className="font-semibold">Bandeira:</span> {boletimSelecionado.bandeira}</div>
                <div><span className="font-semibold">Status:</span> {boletimSelecionado.publicado ? "Publicado" : "Rascunho"}</div>
                <div className="md:col-span-2"><span className="font-semibold">Motivo:</span> {boletimSelecionado.motivo}</div>
                <div className="md:col-span-2"><span className="font-semibold">Status Resumido:</span> {boletimSelecionado.titulo_curto}</div>
              </div>
              {/* Anexos */}
              {boletimSelecionado.audios_urls && boletimSelecionado.audios_urls.length > 0 && (
                <div className="mb-4">
                  <div className="font-semibold mb-2">Áudios:</div>
                  <ul className="flex flex-wrap gap-2">
                    {boletimSelecionado.audios_urls.map((url: string, idx: number) => (
                      <li key={url} className="flex items-center gap-2">
                        <audio controls src={url} className="w-40" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {boletimSelecionado.fotos_urls && boletimSelecionado.fotos_urls.length > 0 && (
                <div className="mb-4">
                  <div className="font-semibold mb-2">Fotos:</div>
                  <div className="flex flex-wrap gap-2">
                    {boletimSelecionado.fotos_urls.map((url: string, idx: number) => (
                      <img key={url} src={url} alt={`Foto ${idx + 1}`} className="w-32 h-32 object-cover rounded border" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </RequireAdmin>
  );
} 