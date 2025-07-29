import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../src/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Badge } from "../../src/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../src/components/ui/dialog";
import { Textarea } from "../../src/components/ui/textarea";
import { toast } from "../../src/components/ui/sonner";
import { CheckCircle, XCircle, Download, Calendar, User, Building, ChevronLeft, ChevronRight, Users, MapPin, CreditCard, Shield, Plane, Edit, Save, X, Search, Filter, Plus, FileText, FileSpreadsheet } from "lucide-react";
import RequireAdmin from "../../src/components/RequireAdmin";
import { useUser } from "../../src/hooks/useUser";
import { PermissionGuard, CanManage } from "../../src/components/PermissionGuard";
import { Resend } from 'resend';
import SimpleDashboardLayout from "@/components/SimpleDashboardLayout";
import SimpleKpiCard from "@/components/SimpleKpiCard";
import LoadingSkeleton from "@/components/magicui/loading-skeleton";



type Membro = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  tipo: 'piloto' | 'agencia';
  cpf?: string;
  cnpj?: string;
  nome_empresa?: string;
  
  // Informações de endereço
  endereco?: string;
  cidade?: string;
  estado?: string;
  
  // Certificações e licenças (para pilotos)
  rbac103?: string;
  rbac91?: string;
  associacao_rbac103?: string;
  validade_rbac103?: string;
  codigo_anac?: string;
  numero_licenca?: string;
  validade_habilitacao?: string;
  validade_cma?: string;
  
  // Informações de balões
  qtd_baloes?: number;
  volumes_baloes?: any;
  
  // Sistema
  observacoes?: string;
  comprovante_url?: string;
  status: 'pendente' | 'ativo' | 'recusado';
  pagamento_inscricao: 'aguardando' | 'ok';
  ultima_mensalidade?: string;
  created_at: string;
  updated_at?: string;
  mensalidades_pagas?: string[];
};

export default function AdminAssociados() {
  const router = useRouter();
  const { user, role, loading } = useUser();
  const [membros, setMembros] = useState<Membro[]>([]);
  const [selectedMembro, setSelectedMembro] = useState<Membro | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [showRecusaDialog, setShowRecusaDialog] = useState(false);
  const [showVisualizarDialog, setShowVisualizarDialog] = useState(false);
  const [showInscricaoDialog, setShowInscricaoDialog] = useState(false);
  const [showMensalidadeDialog, setShowMensalidadeDialog] = useState(false);
  const [mensalidadesPagas, setMensalidadesPagas] = useState<string[]>([]);
  const [mensalidadesPossiveis, setMensalidadesPossiveis] = useState<string[]>([]);
  const [anoMensalidade, setAnoMensalidade] = useState<number>(2025);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Membro | null>(null);
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "piloto" | "agencia">("todos");
  const [filterPayment, setFilterPayment] = useState<"todos" | "pago" | "pendente">("todos");
  const [filterMensalidade, setFilterMensalidade] = useState<"todos" | "em_dia" | "atrasado">("todos");
  const [filterLocation, setFilterLocation] = useState({ estado: "", cidade: "" });
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para cadastro manual
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMemberType, setNewMemberType] = useState<"piloto" | "agencia">("piloto");
  const [newMemberData, setNewMemberData] = useState<Partial<Membro>>({});

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

  // Função para filtrar e buscar membros
  const filterAndSearchMembers = (status: 'pendente' | 'ativo' | 'recusado') => {
    return membros.filter(membro => {
      // Filtro por status
      if (membro.status !== status) return false;
      
      // Busca por termo
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const nome = membro.tipo === 'agencia' ? (membro.nome_empresa || membro.nome_completo) : membro.nome_completo;
        const matchesSearch = 
          nome.toLowerCase().includes(searchLower) ||
          membro.email.toLowerCase().includes(searchLower) ||
          (membro.cpf && membro.cpf.includes(searchTerm)) ||
          (membro.cnpj && membro.cnpj.includes(searchTerm)) ||
          (membro.telefone && membro.telefone.includes(searchTerm));
        
        if (!matchesSearch) return false;
      }
      
      // Filtro por tipo
      if (filterType !== "todos" && membro.tipo !== filterType) return false;
      
      // Filtro por pagamento da inscrição
      if (filterPayment === "pago" && membro.pagamento_inscricao !== "ok") return false;
      if (filterPayment === "pendente" && membro.pagamento_inscricao !== "aguardando") return false;
      
      // Filtro por mensalidade (apenas para ativos)
      if (status === "ativo" && filterMensalidade !== "todos") {
        const statusMens = getStatusMensalidade(membro);
        if (filterMensalidade === "em_dia" && statusMens.status !== "em_dia") return false;
        if (filterMensalidade === "atrasado" && statusMens.status === "em_dia") return false;
      }
      
      // Filtro por localização
      if (filterLocation.estado && membro.estado !== filterLocation.estado) return false;
      if (filterLocation.cidade && membro.cidade !== filterLocation.cidade) return false;
      
      return true;
    });
  };

  const membrosPendentes = filterAndSearchMembers("pendente");
  const membrosAtivos = filterAndSearchMembers("ativo");
  const membrosRecusados = filterAndSearchMembers("recusado");

  // Obter opções de localização únicas dos membros
  const getLocationOptions = () => {
    const estadosSet = new Set(membros.map(m => m.estado).filter(Boolean));
    const cidadesSet = new Set(membros.map(m => m.cidade).filter(Boolean));
    const estados = Array.from(estadosSet).sort();
    const cidades = Array.from(cidadesSet).sort();
    return { estados, cidades };
  };

  const { estados, cidades } = getLocationOptions();

  // Função para adicionar novo membro
  const handleAddNewMember = async () => {
    // Validação básica
    if (!newMemberData.nome_completo || !newMemberData.email || !newMemberData.telefone) {
      toast.error("Preencha os campos obrigatórios: Nome, E-mail e Telefone");
      return;
    }

    if (newMemberType === "agencia" && !newMemberData.nome_empresa) {
      toast.error("Preencha o nome da empresa");
      return;
    }

    try {
      const memberToCreate: Partial<Membro> = {
        ...newMemberData,
        tipo: newMemberType,
        status: "ativo", // Cadastro manual já é aprovado automaticamente
        pagamento_inscricao: "aguardando", // Pode ser alterado depois
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("membros")
        .insert([memberToCreate]);

      if (error) throw error;

      toast.success(`${newMemberType === "piloto" ? "Piloto" : "Agência"} cadastrado(a) com sucesso!`);
      
      // Limpar formulário e fechar modal
      setNewMemberData({});
      setNewMemberType("piloto");
      setShowAddDialog(false);
      
      // Recarregar lista
      fetchMembros();
    } catch (error) {
      console.error("Erro ao cadastrar membro:", error);
      toast.error("Erro ao cadastrar associado");
    }
  };

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
                    <div className="font-medium">
                      {membro.tipo === 'agencia' ? (membro.nome_empresa || membro.nome_completo) : membro.nome_completo}
                    </div>
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
    // Determinar quais membros exportar (filtrados ou todos)
    const membrosParaExportar = searchTerm || filterType !== "todos" || filterPayment !== "todos" || filterMensalidade !== "todos" || filterLocation.estado || filterLocation.cidade 
      ? [...membrosPendentes, ...membrosAtivos, ...membrosRecusados]
      : membros;

    const headers = [
      'Nome/Empresa',
      'Nome Responsável',
      'Tipo',
      'Status', 
      'E-mail',
      'Telefone',
      'CPF/CNPJ',
      'Endereço',
      'Cidade',
      'Estado',
      'RBAC 103',
      'Validade RBAC 103',
      'Associação RBAC 103',
      'RBAC 91A',
      'Código ANAC',
      'Número Licença',
      'Validade Habilitação',
      'Validade CMA',
      'Qtd Balões',
      'Volumes Balões',
      'Pagamento Inscrição',
      'Última Mensalidade',
      'Mensalidades Pagas',
      'Data Cadastro',
      'Observações'
    ];

    const rows = membrosParaExportar.map(m => [
      m.tipo === 'agencia' ? (m.nome_empresa || m.nome_completo) : m.nome_completo,
      m.tipo === 'agencia' ? m.nome_completo : '',
      m.tipo,
      m.status,
      m.email,
      m.telefone,
      m.tipo === 'piloto' ? (m.cpf || '') : (m.cnpj || ''),
      m.endereco || '',
      m.cidade || '',
      m.estado || '',
      m.rbac103 || '',
      m.validade_rbac103 || '',
      m.associacao_rbac103 || '',
      m.rbac91 || '',
      m.codigo_anac || '',
      m.numero_licenca || '',
      m.validade_habilitacao || '',
      m.validade_cma || '',
      m.qtd_baloes?.toString() || '',
      m.volumes_baloes?.toString() || '',
      m.pagamento_inscricao,
      m.ultima_mensalidade || '',
      (m.mensalidades_pagas || []).join('; '),
      new Date(m.created_at).toLocaleDateString('pt-BR'),
      m.observacoes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(value => `"${(value ?? '').toString().replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const filtroTexto = searchTerm || filterType !== "todos" || filterPayment !== "todos" || filterMensalidade !== "todos" || filterLocation.estado || filterLocation.cidade 
      ? '_filtrado' : '';
    a.download = `associados_avibaq${filtroTexto}_${new Date().toISOString().slice(0,10)}.csv`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exportados ${membrosParaExportar.length} associados para CSV`);
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
          endereco: editData.endereco,
          cidade: editData.cidade,
          estado: editData.estado,
          rbac103: editData.rbac103,
          rbac91: editData.rbac91,
          associacao_rbac103: editData.associacao_rbac103,
          validade_rbac103: editData.validade_rbac103,
          codigo_anac: editData.codigo_anac,
          numero_licenca: editData.numero_licenca,
          validade_habilitacao: editData.validade_habilitacao,
          validade_cma: editData.validade_cma,
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
    return (
      <SimpleDashboardLayout title="Associados" breadcrumbs={[{ label: "Associados", icon: Users }]}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200/50">
              <LoadingSkeleton variant="card" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200/50">
          <LoadingSkeleton variant="table" />
        </div>
      </SimpleDashboardLayout>
    );
  }

  // Verificação de permissões será feita pelo PermissionGuard abaixo

  return (
    <PermissionGuard 
      recurso="associados" 
      acao="manage"
      fallback={
        <div className="max-w-2xl mx-auto mt-16 text-center text-lg text-red-600 font-semibold">
          Acesso restrito. Você precisa de permissão para gerenciar associados.
        </div>
      }
    >
      <SimpleDashboardLayout 
        title="Gerenciar Associados"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Associados", icon: Users }
        ]}
        headerActions={
          <Button onClick={() => router.push("/admin/dashboard")} variant="outline">
            Voltar ao Dashboard
          </Button>
        }
      >
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <SimpleKpiCard 
              title="Total de Membros"
              value={membros.length}
              icon={Users}
              color="blue"
              trend={{
                value: membros.filter(m => new Date(m.created_at).getMonth() === new Date().getMonth()).length,
                label: "novos este mês",
                direction: "up"
              }}
              description={`${membros.filter(m => m.tipo === "piloto").length} pilotos + ${membros.filter(m => m.tipo === "agencia").length} agências`}
            />
            <SimpleKpiCard 
              title="Pendentes"
              value={membrosPendentes.length}
              icon={CheckCircle}
              color="yellow"
              trend={{
                value: membrosPendentes.filter(m => m.tipo === "piloto").length,
                label: "pilotos",
                direction: "neutral"
              }}
              description={`${membrosPendentes.filter(m => m.tipo === "agencia").length} agências aguardando`}
            />
            <SimpleKpiCard 
              title="Ativos"
              value={membrosAtivos.length}
              icon={User}
              color="green"
              trend={{
                value: membrosAtivos.filter(m => m.pagamento_inscricao === "ok").length,
                label: "com inscrição paga",
                direction: "up"
              }}
              description={`${membrosAtivos.filter(m => m.pagamento_inscricao === "aguardando").length} pendentes de pagamento`}
            />
            <SimpleKpiCard 
              title="Empresas"
              value={membros.filter(m => m.tipo === 'agencia').length}
              icon={Building}
              color="purple"
              trend={{
                value: membros.filter(m => m.tipo === "agencia" && m.status === "ativo").length,
                label: "ativas",
                direction: "neutral"
              }}
              description={`${membros.filter(m => m.tipo === "piloto").length} pilotos individuais`}
            />
          </div>

          {/* Tabs com design moderno */}
          <div>
            <Tabs defaultValue="pendentes" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100/50 p-1 rounded-xl">
                <TabsTrigger 
                  value="pendentes" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Pendentes ({membrosPendentes.length})
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="ativos"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Ativos ({membrosAtivos.length})
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="recusados"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Recusados ({membrosRecusados.length})
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pendentes" className="mt-6">
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="p-6 border-b border-gray-200/50">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-yellow-500" />
                      Associados Pendentes
                    </h3>
                    <p className="text-gray-600 mt-1">Aguardando aprovação da administração</p>
                  </div>
                  
                  <div className="p-6">
                    {membrosPendentes.length === 0 ? (
                      <div className="text-center py-12">
                        <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Nenhum associado pendente</p>
                        <p className="text-gray-400 text-sm mt-2">Todos os cadastros foram processados</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {membrosPendentes.map((membro, index) => (
                            <div className="bg-gradient-to-r from-white to-yellow-50/30 rounded-xl border border-yellow-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-200 mb-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center space-x-4 min-w-0 flex-1">
                                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    {membro.tipo === 'piloto' ? 
                                      <User className="h-6 w-6 text-yellow-600" /> : 
                                      <Building className="h-6 w-6 text-yellow-600" />
                                    }
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-gray-900 truncate">
                                      {membro.tipo === 'agencia' ? (membro.nome_empresa || membro.nome_completo) : membro.nome_completo}
                                    </h4>
                                    <p className="text-sm text-gray-600 truncate">{membro.email}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge variant="outline" className="capitalize text-xs">
                                        {membro.tipo}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {new Date(membro.created_at).toLocaleDateString('pt-BR')}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedMembro(membro);
                                      setShowVisualizarDialog(true);
                                    }}
                                    className="text-xs px-2"
                                  >
                                    Visualizar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAprovar(membro)}
                                    className="bg-green-600 hover:bg-green-700 text-xs px-2"
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
                                    className="text-xs px-2"
                                  >
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Recusar
                                  </Button>
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ativos" className="mt-6">
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="p-6 border-b border-gray-200/50">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <User className="h-5 w-5 text-green-500" />
                      Associados Ativos
                    </h3>
                    <p className="text-gray-600 mt-1">Membros aprovados e com status ativo</p>
                  </div>
                  
                  <div className="p-6">
                    {membrosAtivos.length === 0 ? (
                      <div className="text-center py-12">
                        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Nenhum associado ativo</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {membrosAtivos.map((membro, index) => {
                          const statusMensalidade = getStatusMensalidade(membro);
                          return (
                              <div className="bg-gradient-to-r from-white to-green-50/30 rounded-xl border border-green-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-200 mb-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                      {membro.tipo === 'piloto' ? 
                                        <User className="h-6 w-6 text-green-600" /> : 
                                        <Building className="h-6 w-6 text-green-600" />
                                      }
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        {membro.tipo === 'agencia' ? (membro.nome_empresa || membro.nome_completo) : membro.nome_completo}
                                      </h4>
                                      <p className="text-sm text-gray-600">{membro.email}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="capitalize">
                                          {membro.tipo}
                                        </Badge>
                                        <Badge variant={membro.pagamento_inscricao === "ok" ? "default" : "destructive"} className={membro.pagamento_inscricao === "ok" ? "bg-green-100 text-green-800" : ""}>
                                          {membro.pagamento_inscricao === "ok" ? "Inscrição Paga" : "Inscrição Pendente"}
                                        </Badge>
                                        <Badge variant={statusMensalidade.status === "em_dia" ? "default" : "destructive"} className={statusMensalidade.status === "em_dia" ? "bg-green-100 text-green-800" : ""}>
                                          {statusMensalidade.label}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedMembro(membro);
                                        setShowVisualizarDialog(true);
                                      }}
                                    >
                                      Visualizar
                                    </Button>
                                  </div>
                                </div>
                              </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="recusados" className="mt-6">
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg">
                  <div className="p-6 border-b border-gray-200/50">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      Associados Recusados
                    </h3>
                    <p className="text-gray-600 mt-1">Cadastros que foram recusados</p>
                  </div>
                  
                  <div className="p-6">
                    {membrosRecusados.length === 0 ? (
                      <div className="text-center py-12">
                        <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">Nenhum associado recusado</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {membrosRecusados.map((membro, index) => (
                            <div className="bg-gradient-to-r from-white to-red-50/30 rounded-xl border border-red-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-200 mb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    {membro.tipo === 'piloto' ? 
                                      <User className="h-6 w-6 text-red-600" /> : 
                                      <Building className="h-6 w-6 text-red-600" />
                                    }
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">
                                      {membro.tipo === 'agencia' ? (membro.nome_empresa || membro.nome_completo) : membro.nome_completo}
                                    </h4>
                                    <p className="text-sm text-gray-600">{membro.email}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="capitalize">
                                        {membro.tipo}
                                      </Badge>
                                      <Badge variant="destructive">
                                        Recusado
                                      </Badge>
                                      <Badge variant="secondary">
                                        {new Date(membro.created_at).toLocaleDateString('pt-BR')}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedMembro(membro);
                                      setShowVisualizarDialog(true);
                                    }}
                                  >
                                    Visualizar
                                  </Button>
                                </div>
                              </div>
                            </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

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


        {/* Barra de Controles e Filtros */}
        <div className="bg-white rounded-xl border border-gray-200/50 shadow-sm mb-6">
          {/* Header da barra de controles */}
          <div className="p-4 border-b border-gray-200/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Busca */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email, CPF/CNPJ, telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {(filterType !== "todos" || filterPayment !== "todos" || filterMensalidade !== "todos" || filterLocation.estado || filterLocation.cidade) && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">●</span>
                  )}
                </Button>
                
                <CanManage recurso="associados">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </CanManage>
                
                <CanManage recurso="associados">
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exportar
                  </Button>
                </CanManage>
              </div>
            </div>
          </div>

          {/* Painel de filtros colapsível */}
          {showFilters && (
            <div className="p-4 bg-gray-50/50 border-b border-gray-200/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro por tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos</option>
                    <option value="piloto">Apenas Pilotos</option>
                    <option value="agencia">Apenas Agências</option>
                  </select>
                </div>

                {/* Filtro por pagamento inscrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pagamento Inscrição</label>
                  <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos</option>
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </div>

                {/* Filtro por mensalidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensalidades</label>
                  <select
                    value={filterMensalidade}
                    onChange={(e) => setFilterMensalidade(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="todos">Todos</option>
                    <option value="em_dia">Em Dia</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>

                {/* Filtro por estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={filterLocation.estado}
                    onChange={(e) => setFilterLocation({...filterLocation, estado: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {estados.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botão para limpar filtros */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("todos");
                    setFilterPayment("todos");
                    setFilterMensalidade("todos");
                    setFilterLocation({ estado: "", cidade: "" });
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Cadastro de Novo Associado */}
        {showAddDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-2xl z-10" 
                onClick={() => {
                  setShowAddDialog(false);
                  setNewMemberData({});
                  setNewMemberType("piloto");
                }}
              >
                &times;
              </button>
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Plus className="h-8 w-8 text-green-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Adicionar Novo Associado</h2>
                    <p className="text-gray-600">Cadastre um novo membro manualmente</p>
                  </div>
                </div>

                {/* Seleção do tipo */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Associado</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setNewMemberType("piloto")}
                      className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-all ${
                        newMemberType === "piloto" 
                          ? "border-blue-500 bg-blue-50 text-blue-700" 
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <User className="h-5 w-5" />
                      Piloto
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMemberType("agencia")}
                      className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-all ${
                        newMemberType === "agencia" 
                          ? "border-purple-500 bg-purple-50 text-purple-700" 
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <Building className="h-5 w-5" />
                      Agência
                    </button>
                  </div>
                </div>

                {/* Formulário dinâmico */}
                <div className="space-y-6">
                  {/* Informações básicas */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {newMemberType === "agencia" && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa *</label>
                          <input
                            type="text"
                            value={newMemberData.nome_empresa || ""}
                            onChange={(e) => setNewMemberData({...newMemberData, nome_empresa: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Razão social da empresa"
                          />
                        </div>
                      )}
                      
                      <div className={newMemberType === "piloto" ? "md:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {newMemberType === "agencia" ? "Nome do Responsável *" : "Nome Completo *"}
                        </label>
                        <input
                          type="text"
                          value={newMemberData.nome_completo || ""}
                          onChange={(e) => setNewMemberData({...newMemberData, nome_completo: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={newMemberType === "agencia" ? "Nome do responsável" : "Nome completo"}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                        <input
                          type="email"
                          value={newMemberData.email || ""}
                          onChange={(e) => setNewMemberData({...newMemberData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="email@exemplo.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                        <input
                          type="tel"
                          value={newMemberData.telefone || ""}
                          onChange={(e) => setNewMemberData({...newMemberData, telefone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="(00) 00000-0000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {newMemberType === "piloto" ? "CPF" : "CNPJ"}
                        </label>
                        <input
                          type="text"
                          value={newMemberType === "piloto" ? (newMemberData.cpf || "") : (newMemberData.cnpj || "")}
                          onChange={(e) => {
                            if (newMemberType === "piloto") {
                              setNewMemberData({...newMemberData, cpf: e.target.value});
                            } else {
                              setNewMemberData({...newMemberData, cnpj: e.target.value});
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={newMemberType === "piloto" ? "000.000.000-00" : "00.000.000/0000-00"}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                        <input
                          type="text"
                          value={newMemberData.endereco || ""}
                          onChange={(e) => setNewMemberData({...newMemberData, endereco: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Rua, número, complemento"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                        <input
                          type="text"
                          value={newMemberData.cidade || ""}
                          onChange={(e) => setNewMemberData({...newMemberData, cidade: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Cidade"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <input
                          type="text"
                          value={newMemberData.estado || ""}
                          onChange={(e) => setNewMemberData({...newMemberData, estado: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="UF"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Certificações (apenas para pilotos) */}
                  {newMemberType === "piloto" && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificações e Licenças</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">RBAC 103</label>
                          <input
                            type="text"
                            value={newMemberData.rbac103 || ""}
                            onChange={(e) => setNewMemberData({...newMemberData, rbac103: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Validade RBAC 103</label>
                          <input
                            type="date"
                            value={newMemberData.validade_rbac103 || ""}
                            onChange={(e) => setNewMemberData({...newMemberData, validade_rbac103: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Código ANAC</label>
                          <input
                            type="text"
                            value={newMemberData.codigo_anac || ""}
                            onChange={(e) => setNewMemberData({...newMemberData, codigo_anac: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Validade CMA</label>
                          <input
                            type="date"
                            value={newMemberData.validade_cma || ""}
                            onChange={(e) => setNewMemberData({...newMemberData, validade_cma: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea
                      value={newMemberData.observacoes || ""}
                      onChange={(e) => setNewMemberData({...newMemberData, observacoes: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Observações administrativas..."
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setShowAddDialog(false);
                      setNewMemberData({});
                      setNewMemberType("piloto");
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddNewMember}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Associado
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Visualização do Associado */}
        {showVisualizarDialog && selectedMembro && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
              <button className="absolute top-4 right-4 text-gray-400 hover:text-red-600 text-2xl z-10" onClick={() => { setShowVisualizarDialog(false); setEditMode(false); setEditData(null); }}>&times;</button>
              
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  {selectedMembro.tipo === 'piloto' ? (
                    <User className="h-8 w-8 text-blue-600" />
                  ) : (
                    <Building className="h-8 w-8 text-purple-600" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedMembro.tipo === 'agencia' ? (selectedMembro.nome_empresa || selectedMembro.nome_completo) : selectedMembro.nome_completo}
                    </h2>
                    <p className="text-gray-600 capitalize">{selectedMembro.tipo}</p>
                  </div>
                </div>

                {/* Informações Básicas */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Tipo de Associado:</span>
                      <p className="text-gray-900 capitalize">{selectedMembro.tipo}</p>
                    </div>
                    
                    {selectedMembro.tipo === 'agencia' && (
                      <>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Nome da Empresa:</span>
                          {editMode ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                              value={editData?.nome_empresa || ''} 
                              onChange={e => setEditData({ ...editData, nome_empresa: e.target.value })} 
                            />
                          ) : (
                            <p className="text-gray-900">{selectedMembro.nome_empresa || selectedMembro.nome_completo}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Nome do Responsável:</span>
                          {editMode ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                              value={editData?.nome_completo || ''} 
                              onChange={e => setEditData({ ...editData, nome_completo: e.target.value })} 
                            />
                          ) : (
                            <p className="text-gray-900">{selectedMembro.nome_completo}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">CNPJ:</span>
                          {editMode ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                              value={editData?.cnpj || ''} 
                              onChange={e => setEditData({ ...editData, cnpj: e.target.value })} 
                            />
                          ) : (
                            <p className="text-gray-900">{selectedMembro.cnpj || '-'}</p>
                          )}
                        </div>
                      </>
                    )}
                    
                    {selectedMembro.tipo === 'piloto' && (
                      <>
                        <div>
                          <span className="text-sm font-medium text-gray-600">Nome Completo:</span>
                          {editMode ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                              value={editData?.nome_completo || ''} 
                              onChange={e => setEditData({ ...editData, nome_completo: e.target.value })} 
                            />
                          ) : (
                            <p className="text-gray-900">{selectedMembro.nome_completo}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-600">CPF:</span>
                          {editMode ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                              value={editData?.cpf || ''} 
                              onChange={e => setEditData({ ...editData, cpf: e.target.value })} 
                            />
                          ) : (
                            <p className="text-gray-900">{selectedMembro.cpf || '-'}</p>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600">E-mail:</span>
                      <p className="text-gray-900">{selectedMembro.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Telefone:</span>
                      {editMode ? (
                        <input 
                          type="text" 
                          className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                          value={editData?.telefone || ''} 
                          onChange={e => setEditData({ ...editData, telefone: e.target.value })} 
                        />
                      ) : (
                        <p className="text-gray-900">{selectedMembro.telefone}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <Badge 
                        variant={selectedMembro.status === 'ativo' ? 'default' : selectedMembro.status === 'pendente' ? 'secondary' : 'destructive'}
                      >
                        {selectedMembro.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Data de Inscrição:</span>
                      <p className="text-gray-900">{new Date(selectedMembro.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  {(selectedMembro.observacoes || editMode) && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-600">Observações:</span>
                      {editMode ? (
                        <textarea 
                          className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                          rows={3}
                          value={editData?.observacoes || ''} 
                          onChange={e => setEditData({ ...editData, observacoes: e.target.value })} 
                          placeholder="Adicione observações sobre este associado..."
                        />
                      ) : (
                        <p className="text-gray-900 mt-1">{selectedMembro.observacoes}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Endereço */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <span className="text-sm font-medium text-gray-600">Endereço:</span>
                      {editMode ? (
                        <input 
                          type="text" 
                          className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                          value={editData?.endereco || ''} 
                          onChange={e => setEditData({ ...editData, endereco: e.target.value })} 
                        />
                      ) : (
                        <p className="text-gray-900">{selectedMembro.endereco || '-'}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Cidade:</span>
                      {editMode ? (
                        <input 
                          type="text" 
                          className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                          value={editData?.cidade || ''} 
                          onChange={e => setEditData({ ...editData, cidade: e.target.value })} 
                        />
                      ) : (
                        <p className="text-gray-900">{selectedMembro.cidade || '-'}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Estado:</span>
                      {editMode ? (
                        <input 
                          type="text" 
                          className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                          value={editData?.estado || ''} 
                          onChange={e => setEditData({ ...editData, estado: e.target.value })} 
                        />
                      ) : (
                        <p className="text-gray-900">{selectedMembro.estado || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informações de Pagamento */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Informações de Pagamento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status da Inscrição:</span>
                      <Badge 
                        variant={selectedMembro.pagamento_inscricao === 'ok' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {selectedMembro.pagamento_inscricao === 'ok' ? 'Pago' : 'Aguardando'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Última Mensalidade:</span>
                      <p className="text-gray-900">{selectedMembro.ultima_mensalidade || '-'}</p>
                    </div>
                  </div>
                  
                  {selectedMembro.mensalidades_pagas && selectedMembro.mensalidades_pagas.length > 0 && (
                    <div className="mt-4">
                      <span className="text-sm font-medium text-gray-600">Mensalidades Pagas:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedMembro.mensalidades_pagas.map((mes, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {mes}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Certificações e Licenças (apenas para pilotos) */}
                {selectedMembro.tipo === 'piloto' && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Certificações e Licenças
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Registro RBAC 103:</span>
                        {editMode ? (
                          <input 
                            type="text" 
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                            value={editData?.rbac103 || ''} 
                            onChange={e => setEditData({ ...editData, rbac103: e.target.value })} 
                          />
                        ) : (
                          <p className="text-gray-900">{selectedMembro.rbac103 || '-'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Validade RBAC 103:</span>
                        {editMode ? (
                          <input 
                            type="date" 
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                            value={editData?.validade_rbac103 || ''} 
                            onChange={e => setEditData({ ...editData, validade_rbac103: e.target.value })} 
                          />
                        ) : (
                          <p className="text-gray-900">{selectedMembro.validade_rbac103 || '-'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Associação RBAC 103:</span>
                        {editMode ? (
                          <input 
                            type="text" 
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                            value={editData?.associacao_rbac103 || ''} 
                            onChange={e => setEditData({ ...editData, associacao_rbac103: e.target.value })} 
                          />
                        ) : (
                          <p className="text-gray-900">{selectedMembro.associacao_rbac103 || '-'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Registro RBAC 91A:</span>
                        {editMode ? (
                          <input 
                            type="text" 
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                            value={editData?.rbac91 || ''} 
                            onChange={e => setEditData({ ...editData, rbac91: e.target.value })} 
                          />
                        ) : (
                          <p className="text-gray-900">{selectedMembro.rbac91 || '-'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Código ANAC:</span>
                        {editMode ? (
                          <input 
                            type="text" 
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                            value={editData?.codigo_anac || ''} 
                            onChange={e => setEditData({ ...editData, codigo_anac: e.target.value })} 
                          />
                        ) : (
                          <p className="text-gray-900">{selectedMembro.codigo_anac || '-'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Número da Licença:</span>
                        {editMode ? (
                          <input 
                            type="text" 
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                            value={editData?.numero_licenca || ''} 
                            onChange={e => setEditData({ ...editData, numero_licenca: e.target.value })} 
                          />
                        ) : (
                          <p className="text-gray-900">{selectedMembro.numero_licenca || '-'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Validade da Habilitação:</span>
                        {editMode ? (
                          <input 
                            type="date" 
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                            value={editData?.validade_habilitacao || ''} 
                            onChange={e => setEditData({ ...editData, validade_habilitacao: e.target.value })} 
                          />
                        ) : (
                          <p className="text-gray-900">{selectedMembro.validade_habilitacao || '-'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Validade do CMA:</span>
                        {editMode ? (
                          <input 
                            type="date" 
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                            value={editData?.validade_cma || ''} 
                            onChange={e => setEditData({ ...editData, validade_cma: e.target.value })} 
                          />
                        ) : (
                          <p className="text-gray-900">{selectedMembro.validade_cma || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações de Balões */}
                {(selectedMembro.qtd_baloes || selectedMembro.volumes_baloes) && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Plane className="h-5 w-5" />
                      Informações de Balões
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedMembro.qtd_baloes !== undefined || editMode) && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Quantidade de Balões:</span>
                          {editMode ? (
                            <input 
                              type="number" 
                              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                              value={editData?.qtd_baloes || ''} 
                              onChange={e => setEditData({ ...editData, qtd_baloes: Number(e.target.value) })} 
                            />
                          ) : (
                            <p className="text-gray-900">{selectedMembro.qtd_baloes || '-'}</p>
                          )}
                        </div>
                      )}
                      {(selectedMembro.volumes_baloes || editMode) && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Volumes dos Balões:</span>
                          {editMode ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm" 
                              value={editData?.volumes_baloes || ''} 
                              onChange={e => setEditData({ ...editData, volumes_baloes: e.target.value })} 
                            />
                          ) : (
                            <p className="text-gray-900">{selectedMembro.volumes_baloes || '-'}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                  {!editMode && (
                    <Button size="sm" variant="outline" onClick={handleEditar}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  
                  {editMode && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSalvarEdicao}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelarEdicao}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  
                  {!editMode && selectedMembro.status === 'pendente' && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { handleAprovar(selectedMembro); setShowVisualizarDialog(false); }}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setShowRecusaDialog(true); setShowVisualizarDialog(false); }}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Recusar
                      </Button>
                    </>
                  )}
                  
                  {!editMode && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => { handleInscricao(selectedMembro); setShowVisualizarDialog(false); }}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Registrar Pagamento Inscrição
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { handleMensalidade(selectedMembro); setShowVisualizarDialog(false); }}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Registrar Pagamento Mensalidade
                      </Button>
                    </>
                  )}
                  
                  {!editMode && selectedMembro.comprovante_url && (
                    <Button size="sm" variant="outline" onClick={() => downloadComprovante(selectedMembro)}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Comprovante
                    </Button>
                  )}
                </div>
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
      </SimpleDashboardLayout>
    </PermissionGuard>
  );
}