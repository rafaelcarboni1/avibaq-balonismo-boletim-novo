import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import EnhancedDashboardLayout from "@/components/magicui/enhanced-dashboard-layout";
import EnhancedKpiCard from "@/components/magicui/enhanced-kpi-card";
import LoadingSkeleton from "@/components/magicui/loading-skeleton";
import { StaggerContainer, StaggerItem } from "@/components/magicui/smooth-transitions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useUser } from "@/hooks/useUser";
import { motion } from "framer-motion";
import { Users, UserPlus, Edit, Trash2, Key, UserCheck, UserCog, Building } from "lucide-react";
import bcrypt from "bcryptjs";

const ROLES = ["admin", "meteo", "tesouraria", "piloto", "agencia"];

export default function UsuariosAdmin() {
  const { role } = useUser();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'novo' | 'editar'>("novo");
  const [form, setForm] = useState({ id: "", nome: "", email: "", role: "meteo" });
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Gerar senha temporária segura (símbolos URL-safe)
  function generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const symbols = '!@*+'; // Símbolos mais seguros para URL
    let password = '';
    
    // 2 maiúsculas + 2 minúsculas + 2 números + 1 símbolo + 1 extra
    password += chars.slice(0, 25).charAt(Math.floor(Math.random() * 25)); // maiúscula
    password += chars.slice(0, 25).charAt(Math.floor(Math.random() * 25)); // maiúscula
    password += chars.slice(25, 50).charAt(Math.floor(Math.random() * 25)); // minúscula
    password += chars.slice(25, 50).charAt(Math.floor(Math.random() * 25)); // minúscula
    password += chars.slice(50).charAt(Math.floor(Math.random() * 8)); // número
    password += chars.slice(50).charAt(Math.floor(Math.random() * 8)); // número
    password += symbols.charAt(Math.floor(Math.random() * symbols.length)); // símbolo
    password += chars.charAt(Math.floor(Math.random() * chars.length)); // extra
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  async function fetchUsuarios() {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, nome, email, role, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setUsuarios(data);
    setLoading(false);
  }

  function openNovo() {
    setForm({ id: "", nome: "", email: "", role: "meteo" });
    setModalMode("novo");
    setShowModal(true);
  }
  function openEditar(u: any) {
    setForm({ id: u.id, nome: u.nome || "", email: u.email, role: u.role });
    setModalMode("editar");
    setShowModal(true);
  }
  function closeModal() {
    setShowModal(false);
    setForm({ id: "", nome: "", email: "", role: "meteo" });
  }

  async function handleSalvar(e: any) {
    e.preventDefault();
    setSaving(true);
    
    if (modalMode === "novo") {
      try {
        // Gerar senha temporária
        const tempPassword = generateTemporaryPassword();
        
        // Hash da senha com bcrypt (fator 12 conforme regras do projeto)
        const senhaHash = await bcrypt.hash(tempPassword, 12);
        
        // 1. Criar usuário no Supabase Auth primeiro
        const { data: authUser, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: tempPassword,
          options: {
            emailRedirectTo: undefined // Não enviar email de confirmação
          }
        });
        
        if (authError) {
          toast.error("Erro ao criar usuário no sistema de autenticação: " + authError.message);
          setSaving(false);
          return;
        }
        
        if (!authUser.user) {
          toast.error("Erro: usuário não foi criado no sistema de autenticação");
          setSaving(false);
          return;
        }
        
        // 2. Inserir usuário na tabela users
        const { error: dbError } = await supabase.from("users").insert({ 
          nome: form.nome, 
          email: form.email, 
          role: form.role,
          senha_hash: senhaHash,
          ativo: true,
          primeira_senha: true
        });
        
        if (dbError) {
          // Se falhar ao inserir na tabela, mostrar erro (não é possível deletar do Auth sem service role)
          toast.error("Erro ao criar usuário na base de dados: " + dbError.message);
          toast.error("IMPORTANTE: Usuário foi criado no sistema de autenticação mas não na base de dados. Contate o administrador do sistema.");
        } else {
          // Performance: Remove debug logs in production
          // console.log("Usuário criado no Auth:", authUser.user);
          // console.log("Status de confirmação:", authUser.user?.email_confirmed_at);
          
          toast.success("Usuário criado com sucesso");
          setGeneratedPassword(tempPassword);
          setShowPasswordModal(true);
        }
      } catch (err) {
        toast.error("Erro ao processar senha: " + (err as Error).message);
      }
    } else {
      const { error } = await supabase.from("users").update({ 
        nome: form.nome, 
        email: form.email, 
        role: form.role 
      }).eq("id", form.id);
      
      if (error) toast.error("Erro ao editar usuário");
      else toast.success("Usuário editado com sucesso");
    }
    
    setSaving(false);
    closeModal();
    fetchUsuarios();
  }

  async function handleDeletar(id: string) {
    if (!window.confirm("Tem certeza que deseja deletar este usuário?")) return;
    
    try {
      // Deletar da tabela users (sem deletar do Auth pois requer service role)
      const { error: dbError } = await supabase.from("users").delete().eq("id", id);
      
      if (dbError) {
        toast.error("Erro ao deletar usuário: " + dbError.message);
      } else {
        toast.success("Usuário removido da base de dados");
        toast.error("AVISO: O usuário ainda pode existir no sistema de autenticação. Para remoção completa, contate o administrador do sistema.");
      }
    } catch (err) {
      toast.error("Erro ao processar exclusão: " + (err as Error).message);
    }
    
    fetchUsuarios();
  }

  const getRoleStats = () => {
    return {
      admin: usuarios.filter(u => u.role === 'admin').length,
      meteo: usuarios.filter(u => u.role === 'meteo').length,
      tesouraria: usuarios.filter(u => u.role === 'tesouraria').length,
      others: usuarios.filter(u => !['admin', 'meteo', 'tesouraria'].includes(u.role)).length
    };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return UserCog;
      case 'meteo': return UserCheck;
      case 'tesouraria': return Building;
      default: return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'meteo': return 'bg-blue-100 text-blue-800';
      case 'tesouraria': return 'bg-green-100 text-green-800';
      case 'piloto': return 'bg-purple-100 text-purple-800';
      case 'agencia': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <EnhancedDashboardLayout title="Usuários" breadcrumbs={[{ label: "Usuários", icon: Users }]}>
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
      </EnhancedDashboardLayout>
    );
  }

  if (role !== 'admin') {
    return <div className="max-w-2xl mx-auto mt-16 text-center text-lg text-red-600 font-semibold">Acesso restrito a administradores.</div>;
  }

  const roleStats = getRoleStats();

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <EnhancedDashboardLayout 
        title="Gerenciar Usuários"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Usuários", icon: Users }
        ]}
        headerActions={
          <Button onClick={openNovo} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        }
      >
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <EnhancedKpiCard 
              title="Total de Usuários"
              value={usuarios.length}
              icon={Users}
              color="blue"
              trend="up"
              trendValue={`+${usuarios.filter(u => new Date(u.created_at).getMonth() === new Date().getMonth()).length} este mês`}
              description="Usuários cadastrados"
              delay={0}
            />
            <EnhancedKpiCard 
              title="Administradores"
              value={roleStats.admin}
              icon={UserCog}
              color="red"
              trend="neutral"
              trendValue="Acesso total"
              description="Usuários admin"
              delay={0.05}
            />
            <EnhancedKpiCard 
              title="Meteorologia"
              value={roleStats.meteo}
              icon={UserCheck}
              color="green"
              trend="neutral"
              trendValue="Boletins"
              description="Usuários meteo"
              delay={0.1}
            />
            <EnhancedKpiCard 
              title="Tesouraria"
              value={roleStats.tesouraria}
              icon={Building}
              color="purple"
              trend="neutral"
              trendValue="Finanças"
              description="Usuários tesouraria"
              delay={0.15}
            />
          </div>

          {/* Lista de Usuários */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg"
          >
            <div className="p-6 border-b border-gray-200/50">
              <h2 className="text-xl font-semibold text-gray-900">Usuários do Sistema</h2>
              <p className="text-gray-600 mt-1">Gerencie usuários e permissões de acesso</p>
            </div>
            
            <div className="p-6">
              {usuarios.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum usuário encontrado</p>
                  <p className="text-gray-400 text-sm mt-2">Crie seu primeiro usuário</p>
                </div>
              ) : (
                <StaggerContainer className="space-y-4">
                  {usuarios.map((usuario, index) => {
                    const RoleIcon = getRoleIcon(usuario.role);
                    return (
                      <StaggerItem key={usuario.id}>
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="bg-gradient-to-r from-white to-gray-50/50 rounded-xl border border-gray-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4 min-w-0 flex-1">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <RoleIcon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 truncate">{usuario.nome}</h4>
                                <p className="text-sm text-gray-600 truncate">{usuario.email}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <Badge className={`${getRoleColor(usuario.role)} text-xs`}>
                                    {usuario.role.toUpperCase()}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {usuario.created_at ? new Date(usuario.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditar(usuario)}
                                className="text-xs px-2"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeletar(usuario.id)}
                                className="text-xs px-2"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Deletar
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Modal Senha Temporária */}
        {showPasswordModal && (
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
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-green-600">Usuário Criado com Sucesso!</h2>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Uma senha temporária foi gerada para o usuário. Copie e repasse com segurança:
                </p>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                  <p className="text-blue-800 font-medium">💡 Instruções de uso:</p>
                  <ul className="mt-1 space-y-1 text-blue-700 text-xs">
                    <li>• Use esta senha exatamente como mostrada (copie para evitar erros)</li>
                    <li>• Se o login falhar, tente usar "Esqueci minha senha" em vez disso</li>
                    <li>• A senha deve ser alterada no primeiro login</li>
                  </ul>
                </div>
                <div className="bg-gray-100 p-4 rounded border">
                  <label className="block text-sm font-medium mb-2">Senha Temporária:</label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-200 px-3 py-2 rounded text-lg font-mono flex-1 select-all">
                      {generatedPassword}
                    </code>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPassword);
                        toast.success("Senha copiada!");
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Importante:</strong> O usuário deve trocar esta senha no primeiro login.
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setGeneratedPassword("");
                  }}
                >
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal Novo/Editar Usuário */}
        {showModal && (
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
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {modalMode === 'novo' ? <UserPlus className="h-8 w-8 text-blue-600" /> : <Edit className="h-8 w-8 text-blue-600" />}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{modalMode === 'novo' ? 'Novo Usuário' : 'Editar Usuário'}</h2>
              </div>
              <form onSubmit={handleSalvar} className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Nome</label>
                  <Input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">E-mail</label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required disabled={modalMode === 'editar'} />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Role</label>
                  <select className="w-full border rounded px-2 py-2" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 justify-end mt-6">
                  <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
                  <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </EnhancedDashboardLayout>
    </ProtectedRoute>
  );
} 