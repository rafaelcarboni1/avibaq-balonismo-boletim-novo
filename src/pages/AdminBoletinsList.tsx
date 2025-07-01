import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";

const bandeiraColors = {
  verde: "bg-green-500 text-white",
  amarela: "bg-yellow-500 text-black",
  vermelha: "bg-red-500 text-white",
};

export default function AdminBoletinsList() {
  const [boletins, setBoletins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function fetchBoletins() {
    setLoading(true);
    const { data, error } = await supabase
      .from("boletins")
      .select("id, data, periodo, bandeira, status_voo, titulo_curto, audios_urls, fotos_urls")
      .order("data", { ascending: false })
      .order("periodo", { ascending: false });
    if (error) toast.error("Erro ao buscar boletins");
    setBoletins(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchBoletins();
  }, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Tem certeza que deseja excluir este boletim?")) return;
    const { error } = await supabase.from("boletins").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir boletim");
    toast.success("Boletim excluído");
    fetchBoletins();
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Boletins</h1>
        <Button onClick={() => navigate("/admin/boletins/new")}>+ Novo Boletim</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Bandeira</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Anexos</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boletins.map((b) => (
            <TableRow key={b.id}>
              <TableCell>{b.data.split('-').reverse().join('/')}</TableCell>
              <TableCell>{b.periodo === "manha" ? "Manhã" : "Tarde"}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded ${bandeiraColors[b.bandeira]}`}>{b.bandeira}</span>
              </TableCell>
              <TableCell>{b.status_voo.replace("_", " ").toUpperCase()}</TableCell>
              <TableCell>
                {b.audios_urls?.length > 0 ? `🎤 ${b.audios_urls.length}` : ''}
                {b.audios_urls?.length > 0 && b.fotos_urls?.length > 0 ? ' / ' : ''}
                {b.fotos_urls?.length > 0 ? `📷 ${b.fotos_urls.length}` : ''}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => navigate(`/admin/boletins/${b.id}/edit`)}>Editar</Button>
                <Button size="sm" variant="destructive" className="ml-2" onClick={() => handleDelete(b.id)}>Excluir</Button>
              </TableCell>
            </TableRow>
          ))}
          {boletins.length === 0 && !loading && (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Nenhum boletim cadastrado</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 