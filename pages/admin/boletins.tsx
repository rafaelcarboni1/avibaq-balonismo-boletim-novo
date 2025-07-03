import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/integrations/supabase/client";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Badge } from "../../src/components/ui/badge";
import { toast } from "../../src/components/ui/sonner";
import { Plus, Edit, Trash2, Users } from "lucide-react";
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
};

export default function AdminBoletinsList() {
  const router = useRouter();
  const [boletins, setBoletins] = useState<Boletim[]>([]);
  const { role, loading } = useUser();

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
            <Button onClick={() => router.push("/admin/associados")} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Associados
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
                          <Badge variant={boletim.publicado ? "default" : "secondary"}>
                            {boletim.publicado ? "Publicado" : "Rascunho"}
                          </Badge>
                        </td>
                        <td className="border border-gray-200 px-4 py-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/boletins/${boletim.id}/edit`)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(boletim.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Excluir
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
      </div>
    </RequireAdmin>
  );
} 