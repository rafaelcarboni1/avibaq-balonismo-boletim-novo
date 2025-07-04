import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Badge } from "../../src/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../src/components/ui/dialog";
import { Textarea } from "../../src/components/ui/textarea";
import { toast } from "../../src/components/ui/sonner";
import { CheckCircle, XCircle, Download, Calendar, User, Building, ChevronLeft, ChevronRight } from "lucide-react";
import RequireAdmin from "../../src/components/RequireAdmin";
import { useUser } from "../../src/hooks/useUser";
import { Resend } from 'resend';

type Membro = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  tipo: 'piloto' | 'agencia';
  cpf?: string;
  cnpj?: string;
  nome_empresa?: string;
  rbac103?: string;
  rbac91?: string;
  qtd_baloes?: number;
  volumes_baloes?: any;
  observacoes?: string;
  comprovante_url?: string;
  status: 'pendente' | 'ativo' | 'recusado';
  pagamento_inscricao: 'aguardando' | 'ok';
  ultima_mensalidade?: string;
  created_at: string;
  mensalidades_pagas?: string[];
};

export default function AdminAssociados() {
  const router = useRouter();
  const { user, role, loading } = useUser();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [selectedMembro, setSelectedMembro] = useState<Membro | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [showRecusaDialog, setShowRecusaDialog] = useState(false);
  const [showPagamentoDialog, setShowPagamentoDialog] = useState(false);
  const [mesPagamento, setMesPagamento] = useState("");
  const [anoPagamento, setAnoPagamento] = useState("");
  const [showVisualizarDialog, setShowVisualizarDialog] = useState(false);
  const [showInscricaoDialog, setShowInscricaoDialog] = useState(false);
  const [showMensalidadeDialog, setShowMensalidadeDialog] = useState(false);
  const [mensalidadesPagas, setMensalidadesPagas] = useState<string[]>([]);
  const [mensalidadesPossiveis, setMensalidadesPossiveis] = useState<string[]>([]);
  const [anoMensalidade, setAnoMensalidade] = useState<number>(2025);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Membro | null>(null);

  useEffect(() => {
    fetchMembros();
  }, []);

  const fetchMembros = async () => {
    try {
      const { data, error } = await supabase
        .from("membros")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembros(data || []);
    } catch (error) {
      console.error("Erro ao buscar membros:", error);
      toast.error("Erro ao carregar associados");
    }
  };

  const handleAprovar = async (membro: Membro) => {
    try {
      const { error } = await supabase
        .from("membros")
        .update({
          status: "ativo",
          pagamento_inscricao: "ok",
          updated_at: new Date().toISOString(),
        })
        .eq("id", membro.id);
      if (error) throw error;
      // Gravar log de atividade com tratamento de erro explícito
      const { error: logError } = await supabase.from('logs_atividade').insert({
        acao: `Aprovado por ${user?.email}`,
        detalhes: { membroId: membro.id, nome: membro.nome_completo },
        usuario_id: user?.id || null
      });
      if (logError) {
        console.error('Erro ao registrar log de atividade:', logError);
        toast.error('Erro ao registrar log de atividade!');
      }
      // Enviar e-mail via Resend
      try {
        await fetch('/api/send-aprovado', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: membro.email,
            nome: membro.nome_completo
          })
        });
      } catch (e) {
        // Não bloquear aprovação se e-mail falhar
        console.error('Erro ao enviar e-mail de aprovação:', e);
      }
      toast.success("Associado aprovado com sucesso!");
      fetchMembros();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      toast.error("Erro ao aprovar associado");
    }
  };

  const handleRecusar = async () => {
    if (!selectedMembro || !motivoRecusa.trim()) {
      toast.error("Digite o motivo da recusa");
      return;
    }

    try {
      const { error } = await supabase
        .from("membros")
        .update({
          status: "recusado",
          observacoes: `${selectedMembro.observacoes || ""}\n\nMOTIVO DA RECUSA: ${motivoRecusa}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedMembro.id);

      if (error) throw error;

      toast.success("Associado recusado");
      setShowRecusaDialog(false);
      setMotivoRecusa("");
      setSelectedMembro(null);
      fetchMembros();

      // TODO: Enviar e-mail de recusa
      console.log("Enviar e-mail de recusa para:", selectedMembro.email);
    } catch (error) {
      console.error("Erro ao recusar:", error);
      toast.error("Erro ao recusar associado");
    }
  };

  const handleRegistrarPagamento = async () => {
    if (!selectedMembro || !mesPagamento || !anoPagamento) {
      toast.error("Preencha mês e ano");
      return;
    }

    try {
      const dataPagamento = new Date(parseInt(anoPagamento), parseInt(mesPagamento) - 1, 1);
      
      const { error } = await supabase
        .from("membros")
        .update({
          ultima_mensalidade: dataPagamento.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedMembro.id);

      if (error) throw error;

      toast.success("Pagamento registrado com sucesso!");
      setShowPagamentoDialog(false);
      setMesPagamento("");
      setAnoPagamento("");
      setSelectedMembro(null);
      fetchMembros();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast.error("Erro ao registrar pagamento");
    }
  };

  const downloadComprovante = async (membro: Membro) => {
    if (!membro.comprovante_url) {
      toast.error("Comprovante não disponível");
      return;
    }

    try {
      // Corrigir path: remover prefixo do bucket e barra inicial
      let path = membro.comprovante_url;
      if (path.startsWith('membros-docs/')) {
        path = path.replace('membros-docs/', '');
      }
      if (path.startsWith('/')) {
        path = path.slice(1);
      }
      const { data, error } = await supabase.storage
        .from("membros-docs")
        .download(path);

      if (error) {
        toast.error("Erro ao baixar comprovante: " + error.message);
        return;
      }

      // Garante que data é um Blob
      if (!(data instanceof Blob)) {
        toast.error("Arquivo não encontrado ou formato inválido.");
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `comprovante_${membro.nome_completo.replace(/\s+/g, '_')}.${path.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Erro ao baixar comprovante:", error);
      toast.error("Erro ao baixar comprovante: " + (error?.message || error));
    }
  };

  const getStatusMensalidade = (membro: Membro) => {
    const inicio = new Date(2025, 6); // Julho/2025
    const hoje = new Date();
    const mesAtual = new Date(hoje.getFullYear(), hoje.getMonth());
    if (mesAtual < inicio) {
      return { status: "nao_iniciado", label: "N/E" };
    }
    // Gera todos os meses de 07/2025 até o mês atual
    const meses: string[] = [];
    let atual = new Date(inicio.getFullYear(), inicio.getMonth());
    while (atual <= mesAtual) {
      meses.push(`${('0'+(atual.getMonth()+1)).slice(-2)}/${atual.getFullYear()}`);
      atual.setMonth(atual.getMonth() + 1);
    }
    const pagos = membro.mensalidades_pagas || [];
    const todosPagos = meses.every(mes => pagos.includes(mes));
    if (todosPagos) {
      return { status: "em_dia", label: "Em dia" };
    } else {
      return { status: "em_aberto", label: "Em aberto" };
    }
  };

  const membrosPendentes = membros.filter(m => m.status === "pendente");
  const membrosAtivos = membros.filter(m => m.status === "ativo");
  const membrosRecusados = membros.filter(m => m.status === "recusado");

  const handleVisualizar = (membro: Membro) => {
    setSelectedMembro(membro);
    setShowVisualizarDialog(true);
  };

  const handleMensalidade = (membro: Membro) => {
    setSelectedMembro(membro);
    const anoAtual = new Date().getFullYear();
    setAnoMensalidade(2025); // padrão para 2025
    // Garante que mensalidadesPagas está sincronizado
    setMensalidadesPagas(membro.mensalidades_pagas || []);
    setShowMensalidadeDialog(true);
  };

  const handleSalvarMensalidades = async () => {
    // Atualização otimista: atualiza localmente antes do fetch
    const novoMembros = membros.map(m =>
      m.id === selectedMembro.id ? { ...m, mensalidades_pagas: mensalidadesPagas } : m
    );
    setMembros(novoMembros);
    setSelectedMembro(prev => prev ? { ...prev, mensalidades_pagas: mensalidadesPagas } : prev);
    await atualizarMensalidades(selectedMembro.id, mensalidadesPagas);
    setShowMensalidadeDialog(false);
  };

  const handleInscricao = (membro: Membro) => {
    setSelectedMembro(membro);
    setShowInscricaoDialog(true);
  };

  const handleSalvarInscricao = async () => {
    await registrarPagamentoInscricao(selectedMembro.id);
    setShowInscricaoDialog(false);
    // Atualizar lista de membros se necessário
  };

  const mesesNomes = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  const renderMembrosTable = (membrosList: Membro[]) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-4 py-2 text-left">Nome</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Tipo</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Data</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Inscrição</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Mensalidade</th>
            <th className="border border-gray-200 px-4 py-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {membrosList.map((membro) => {
            const statusMensalidade = getStatusMensalidade(membro);
            return (
              <tr key={membro.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2">
                  <div>
                    <div className="font-medium">{membro.nome_completo}</div>
                    <div className="text-sm text-gray-500">{membro.email}</div>
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <div className="flex items-center gap-2">
                    {membro.tipo === "piloto" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Building className="w-4 h-4" />
                    )}
                    <span className="capitalize">{membro.tipo}</span>
                  </div>
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {new Date(membro.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {membro.pagamento_inscricao === "ok" ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Pago
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Pendente
                    </Badge>
                  )}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  {statusMensalidade.status === "em_dia" ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Em dia
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Em aberto
                    </Badge>
                  )}
                </td>
                <td className="border border-gray-200 px-4 py-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVisualizar(membro)}
                    >
                      Visualizar
                    </Button>
                    
                    {membro.status === "pendente" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            handleAprovar(membro);
                            setShowVisualizarDialog(false);
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedMembro(membro);
                            setShowRecusaDialog(true);
                          }}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Recusar
                        </Button>
                      </>
                    )}
                    
                    {membro.status === "ativo" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMembro(membro);
                          setShowPagamentoDialog(true);
                        }}
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Registrar Pagamento
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = ['Nome', 'Tipo', 'Status', 'Pagamento Inscrição', 'Última Mensalidade'];
    const rows = membros.map(m => [
      m.nome_completo,
      m.tipo,
      m.status,
      m.pagamento_inscricao,
      m.ultima_mensalidade || ''
    ]);
    const csvContent = [headers, ...rows].map(e => e.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `associados_avibaq_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Função para atualizar mensalidades pagas
  async function atualizarMensalidades(id: string, meses: string[]) {
    const { error } = await supabase
      .from("membros")
      .update({ mensalidades_pagas: meses, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar mensalidades: " + error.message);
      throw error;
    } else {
      toast.success("Mensalidades atualizadas com sucesso!");
      // Atualizar lista de membros após salvar
    }
  }

  // Função para registrar pagamento da taxa de inscrição
  async function registrarPagamentoInscricao(id: string) {
    const { error } = await supabase
      .from("membros")
      .update({ pagamento_inscricao: "ok", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao registrar pagamento da inscrição: " + error.message);
      throw error;
    } else {
      toast.success("Pagamento da inscrição registrado!");
      // fetchMembros(); // Remover chamada direta aqui, pois fetchMembros está no componente
    }
  }

  // Função para iniciar edição
  const handleEditar = () => {
    setEditData(selectedMembro);
    setEditMode(true);
  };

  // Função para cancelar edição
  const handleCancelarEdicao = () => {
    setEditMode(false);
    setEditData(null);
  };

  // Função para salvar edição
  const handleSalvarEdicao = async () => {
    if (!editData) return;
    try {
      const { error } = await supabase
        .from('membros')
        .update({
          nome_completo: editData.nome_completo,
          telefone: editData.telefone,
          nome_empresa: editData.nome_empresa,
          cpf: editData.cpf,
          cnpj: editData.cnpj,
          rbac103: editData.rbac103,
          rbac91: editData.rbac91,
          qtd_baloes: editData.qtd_baloes,
          volumes_baloes: editData.volumes_baloes,
          observacoes: editData.observacoes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editData.id);
      if (error) throw error;
      toast.success('Dados do associado atualizados com sucesso!');
      setEditMode(false);
      setEditData(null);
      setShowVisualizarDialog(false);
      fetchMembros();
    } catch (error) {
      toast.error('Erro ao atualizar dados do associado.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (role !== 'admin' && role !== 'tesouraria') {
    return <div className="max-w-2xl mx-auto mt-16 text-center text-lg text-red-600 font-semibold">Acesso restrito a administradores e tesouraria.</div>;
  }

  return (
    <RequireAdmin>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gerenciar Associados</h1>
          <Button onClick={() => router.push("/admin/dashboard")}>Voltar ao Dashboard</Button>
        </div>

        <Tabs defaultValue="pendentes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pendentes">
              Pendentes ({membrosPendentes.length})
            </TabsTrigger>
            <TabsTrigger value="ativos">
              Ativos ({membrosAtivos.length})
            </TabsTrigger>
            <TabsTrigger value="recusados">
              Recusados ({membrosRecusados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Associados Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                {membrosPendentes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum associado pendente</p>
                ) : (
                  renderMembrosTable(membrosPendentes)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ativos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Associados Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                {membrosAtivos.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum associado ativo</p>
                ) : (
                  renderMembrosTable(membrosAtivos)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recusados" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Associados Recusados</CardTitle>
              </CardHeader>
              <CardContent>
                {membrosRecusados.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum associado recusado</p>
                ) : (
                  renderMembrosTable(membrosRecusados)
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Recusa */}
        <Dialog open={showRecusaDialog} onOpenChange={setShowRecusaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recusar Associado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Digite o motivo da recusa para <strong>{selectedMembro?.nome_completo}</strong>:</p>
              <Textarea
                value={motivoRecusa}
                onChange={(e) => setMotivoRecusa(e.target.value)}
                placeholder="Motivo da recusa..."
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRecusaDialog(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleRecusar}>
                  Confirmar Recusa
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Pagamento */}
        <Dialog open={showPagamentoDialog} onOpenChange={setShowPagamentoDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pagamento de Mensalidade</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Registrar pagamento para <strong>{selectedMembro?.nome_completo}</strong>:</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mês</label>
                  <select
                    value={mesPagamento}
                    onChange={(e) => setMesPagamento(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Selecione</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                      <option key={mes} value={mes}>
                        {new Date(2024, mes - 1).toLocaleDateString("pt-BR", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ano</label>
                  <select
                    value={anoPagamento}
                    onChange={(e) => setAnoPagamento(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Selecione</option>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPagamentoDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleRegistrarPagamento}>
                  Registrar Pagamento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Botão Exportar CSV */}
        <div className="flex justify-end mb-4">
          {(role === 'admin' || role === 'tesouraria') && (
            <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Exportar CSV
            </Button>
          )}
        </div>

        {/* Modal de Visualização do Associado */}
        {showVisualizarDialog && selectedMembro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative">
              <button className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl" onClick={() => { setShowVisualizarDialog(false); setEditMode(false); setEditData(null); }}>&times;</button>
              <h2 className="text-2xl font-bold mb-4">Detalhes do Associado</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Nome */}
                <div>
                  <span className="font-semibold">Nome:</span>
                  {editMode ? (
                    <input type="text" className="border rounded px-2 py-1 w-full" value={editData?.nome_completo || ''} onChange={e => setEditData({ ...editData, nome_completo: e.target.value })} />
                  ) : (
                    <span> {selectedMembro.nome_completo}</span>
                  )}
                </div>
                {/* E-mail (não editável) */}
                <div><span className="font-semibold">E-mail:</span> {selectedMembro.email}</div>
                {/* Telefone */}
                <div>
                  <span className="font-semibold">Telefone:</span>
                  {editMode ? (
                    <input type="text" className="border rounded px-2 py-1 w-full" value={editData?.telefone || ''} onChange={e => setEditData({ ...editData, telefone: e.target.value })} />
                  ) : (
                    <span> {selectedMembro.telefone}</span>
                  )}
                </div>
                {/* Tipo (não editável) */}
                <div><span className="font-semibold">Tipo:</span> {selectedMembro.tipo}</div>
                <div><span className="font-semibold">Status:</span> {selectedMembro.status}</div>
                <div><span className="font-semibold">Pagamento Inscrição:</span> {selectedMembro.pagamento_inscricao}</div>
                <div><span className="font-semibold">Última Mensalidade:</span> {selectedMembro.ultima_mensalidade || '-'}</div>
                {/* Empresa */}
                {selectedMembro.nome_empresa !== undefined && (
                  <div>
                    <span className="font-semibold">Empresa:</span>
                    {editMode ? (
                      <input type="text" className="border rounded px-2 py-1 w-full" value={editData?.nome_empresa || ''} onChange={e => setEditData({ ...editData, nome_empresa: e.target.value })} />
                    ) : (
                      <span> {selectedMembro.nome_empresa}</span>
                    )}
                  </div>
                )}
                {/* CPF */}
                {selectedMembro.cpf !== undefined && (
                  <div>
                    <span className="font-semibold">CPF:</span>
                    {editMode ? (
                      <input type="text" className="border rounded px-2 py-1 w-full" value={editData?.cpf || ''} onChange={e => setEditData({ ...editData, cpf: e.target.value })} />
                    ) : (
                      <span> {selectedMembro.cpf}</span>
                    )}
                  </div>
                )}
                {/* CNPJ */}
                {selectedMembro.cnpj !== undefined && (
                  <div>
                    <span className="font-semibold">CNPJ:</span>
                    {editMode ? (
                      <input type="text" className="border rounded px-2 py-1 w-full" value={editData?.cnpj || ''} onChange={e => setEditData({ ...editData, cnpj: e.target.value })} />
                    ) : (
                      <span> {selectedMembro.cnpj}</span>
                    )}
                  </div>
                )}
                {/* RBAC 103 */}
                {selectedMembro.rbac103 !== undefined && (
                  <div>
                    <span className="font-semibold">RBAC 103:</span>
                    {editMode ? (
                      <input type="text" className="border rounded px-2 py-1 w-full" value={editData?.rbac103 || ''} onChange={e => setEditData({ ...editData, rbac103: e.target.value })} />
                    ) : (
                      <span> {selectedMembro.rbac103}</span>
                    )}
                  </div>
                )}
                {/* RBAC 91 */}
                {selectedMembro.rbac91 !== undefined && (
                  <div>
                    <span className="font-semibold">RBAC 91:</span>
                    {editMode ? (
                      <input type="text" className="border rounded px-2 py-1 w-full" value={editData?.rbac91 || ''} onChange={e => setEditData({ ...editData, rbac91: e.target.value })} />
                    ) : (
                      <span> {selectedMembro.rbac91}</span>
                    )}
                  </div>
                )}
                {/* Qtd. Balões */}
                {selectedMembro.qtd_baloes !== undefined && (
                  <div>
                    <span className="font-semibold">Qtd. Balões:</span>
                    {editMode ? (
                      <input type="number" className="border rounded px-2 py-1 w-full" value={editData?.qtd_baloes || ''} onChange={e => setEditData({ ...editData, qtd_baloes: Number(e.target.value) })} />
                    ) : (
                      <span> {selectedMembro.qtd_baloes}</span>
                    )}
                  </div>
                )}
                {/* Volumes Balões */}
                {selectedMembro.volumes_baloes !== undefined && (
                  <div>
                    <span className="font-semibold">Volumes Balões:</span>
                    {editMode ? (
                      <input type="text" className="border rounded px-2 py-1 w-full" value={editData?.volumes_baloes || ''} onChange={e => setEditData({ ...editData, volumes_baloes: e.target.value })} />
                    ) : (
                      <span> {selectedMembro.volumes_baloes}</span>
                    )}
                  </div>
                )}
                {/* Observações */}
                <div className="md:col-span-2">
                  <span className="font-semibold">Observações:</span>
                  {editMode ? (
                    <textarea className="border rounded px-2 py-1 w-full" value={editData?.observacoes || ''} onChange={e => setEditData({ ...editData, observacoes: e.target.value })} rows={2} />
                  ) : (
                    <span> {selectedMembro.observacoes}</span>
                  )}
                </div>
              </div>
              {/* Botões de ação */}
              <div className="flex flex-wrap gap-2 mt-4">
                {!editMode && (
                  <Button size="sm" variant="outline" onClick={handleEditar}>Editar</Button>
                )}
                {editMode && (
                  <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSalvarEdicao}>Salvar</Button>
                    <Button size="sm" variant="outline" onClick={handleCancelarEdicao}>Cancelar</Button>
                  </>
                )}
                {/* Botões já existentes */}
                {!editMode && selectedMembro.status === 'pendente' && (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { handleAprovar(selectedMembro); setShowVisualizarDialog(false); }}>Aprovar</Button>
                )}
                {!editMode && selectedMembro.status === 'pendente' && (
                  <Button size="sm" variant="destructive" onClick={() => { setShowRecusaDialog(true); setShowVisualizarDialog(false); }}>Recusar</Button>
                )}
                {!editMode && (
                  <Button size="sm" variant="outline" onClick={() => { handleInscricao(selectedMembro); setShowVisualizarDialog(false); }}>Registrar Pagamento Inscrição</Button>
                )}
                {!editMode && (
                  <Button size="sm" variant="outline" onClick={() => { handleMensalidade(selectedMembro); setShowVisualizarDialog(false); }}>Registrar Pagamento Mensalidade</Button>
                )}
                {!editMode && selectedMembro.comprovante_url && (
                  <Button size="sm" variant="outline" onClick={() => downloadComprovante(selectedMembro)}>Baixar Comprovante</Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Registrar Pagamento Inscrição */}
        {showInscricaoDialog && selectedMembro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl" onClick={() => setShowInscricaoDialog(false)}>&times;</button>
              <h3 className="text-xl font-bold mb-4">Registrar Pagamento da Taxa de Inscrição</h3>
              <p>Deseja marcar a taxa de inscrição como paga para <b>{selectedMembro.nome_completo}</b>?</p>
              <div className="flex gap-2 mt-6">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSalvarInscricao}>Confirmar</Button>
                <Button size="sm" variant="outline" onClick={() => setShowInscricaoDialog(false)}>Cancelar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Registrar Pagamento Mensalidade */}
        {showMensalidadeDialog && selectedMembro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative">
              <button className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl" onClick={() => setShowMensalidadeDialog(false)}>&times;</button>
              <h3 className="text-xl font-bold mb-4">Mensalidades de {selectedMembro.nome_completo}</h3>
              {/* Filtro de ano */}
              <div className="flex items-center gap-2 mb-4 justify-center">
                <button onClick={() => setAnoMensalidade(anoMensalidade-1)} className="p-1 rounded hover:bg-gray-100"><ChevronLeft /></button>
                <span className="font-semibold text-lg">{anoMensalidade}</span>
                <button onClick={() => setAnoMensalidade(anoMensalidade+1)} className="p-1 rounded hover:bg-gray-100"><ChevronRight /></button>
              </div>
              {/* Grade dos meses */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                {mesesNomes.map((nome, idx) => {
                  const mesStr = `${('0'+(idx+1)).slice(-2)}/${anoMensalidade}`;
                  const inicio = new Date(2025, 6);
                  const mesData = new Date(anoMensalidade, idx);
                  const pago = mensalidadesPagas.includes(mesStr);
                  const desabilitado = mesData < inicio;
                  return (
                    <button
                      key={mesStr}
                      className={`flex flex-col items-center justify-center border rounded-lg p-2 transition-all
                        ${desabilitado ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed' :
                          pago ? 'border-green-500 bg-green-50' : 'border-red-300 bg-red-50'}
                        ${mesStr === `${('0'+(new Date().getMonth()+1)).slice(-2)}/${new Date().getFullYear()}` ? 'ring-2 ring-blue-400' : ''}`}
                      onClick={() => {
                        if (desabilitado) return;
                        if (pago) {
                          setMensalidadesPagas(mensalidadesPagas.filter(m => m !== mesStr));
                        } else {
                          setMensalidadesPagas([...mensalidadesPagas, mesStr]);
                        }
                      }}
                      disabled={desabilitado}
                    >
                      <span className="text-base font-medium">{nome}</span>
                      {desabilitado ? <span className="text-xs mt-1">N/E</span> :
                        pago ? <CheckCircle className="w-6 h-6 text-green-600 mt-1" /> : <XCircle className="w-6 h-6 text-red-500 mt-1" />}
                      <span className="text-xs mt-1">{mesStr}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSalvarMensalidades}>Salvar</Button>
                <Button size="sm" variant="outline" onClick={() => setShowMensalidadeDialog(false)}>Cancelar</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAdmin>
  );
} 