import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import SimpleDashboardLayout from "@/components/SimpleDashboardLayout";
import LoadingSkeleton from "@/components/magicui/loading-skeleton";
import { AdvancedUserManagement } from "@/components/magicui/advanced-user-management";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useUser } from "@/hooks/useUser";
import { Users, UserPlus, Copy, Eye, EyeOff } from "lucide-react";

import bcrypt from "bcryptjs";

const ROLES = ["admin", "meteo", "tesouraria", "piloto", "agencia"];

interface UserForm {
  id: string;
  nome: string;
  email: string;
  role: string;
}

export default function UsuariosAdmin() {
  const { role } = useUser();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'novo' | 'editar'>("novo");
  const [form, setForm] = useState<UserForm>({ id: "", nome: "", email: "", role: "meteo" });
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Gerar senha temporária segura
  function generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const symbols = '!@*+';
    let password = '';
    
    // 2 maiúsculas + 2 minúsculas + 2 números + 1 símbolo + 1 extra
    password += chars.slice(0, 25).charAt(Math.floor(Math.random() * 25));
    password += chars.slice(0, 25).charAt(Math.floor(Math.random() * 25));
    password += chars.slice(25, 50).charAt(Math.floor(Math.random() * 25));
    password += chars.slice(25, 50).charAt(Math.floor(Math.random() * 25));
    password += chars.slice(50).charAt(Math.floor(Math.random() * 8));
    password += chars.slice(50).charAt(Math.floor(Math.random() * 8));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    password += chars.charAt(Math.floor(Math.random() * chars.length));
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  async function fetchUsuarios() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, nome, email, role, created_at")
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setUsuarios(data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    }
    setLoading(false);
  }

  function openNovo() {
    setForm({ id: "", nome: "", email: "", role: "meteo" });
    setModalMode("novo");
    setShowModal(true);
  }

  function openEditar(usuario: any) {
    setForm({ 
      id: usuario.id, 
      nome: usuario.nome || "", 
      email: usuario.email, 
      role: usuario.role 
    });
    setModalMode("editar");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setForm({ id: "", nome: "", email: "", role: "meteo" });
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (modalMode === "novo") {
        const tempPassword = generateTemporaryPassword();
        const senhaHash = await bcrypt.hash(tempPassword, 12);
        
        // Criar usuário no Supabase Auth
        const { data: authUser, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: tempPassword,
          options: { emailRedirectTo: undefined }
        });

        if (authError) throw new Error(`Erro Auth: ${authError.message}`);

        // Criar usuário na tabela
        const { error: dbError } = await supabase
          .from("users")
          .insert({
            id: authUser.user?.id,
            nome: form.nome,
            email: form.email,
            role: form.role,
            senha_temporaria_hash: senhaHash,
            deve_trocar_senha: true
          });

        if (dbError) throw new Error(`Erro DB: ${dbError.message}`);

        setGeneratedPassword(tempPassword);
        setShowPasswordModal(true);
        toast.success("Usuário criado com sucesso!");
      } else {
        // Editar usuário
        const { error } = await supabase
          .from("users")
          .update({ nome: form.nome, role: form.role })
          .eq("id", form.id);

        if (error) throw new Error(error.message);
        toast.success("Usuário atualizado com sucesso!");
      }

      closeModal();
      fetchUsuarios();
    } catch (error: any) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    }
    
    setSaving(false);
  }

  async function handleExcluir(userId: string) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw new Error(error.message);
      
      toast.success("Usuário excluído com sucesso!");
      fetchUsuarios();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  }

  async function handleResetSenha(userId: string) {
    try {
      const tempPassword = generateTemporaryPassword();
      const senhaHash = await bcrypt.hash(tempPassword, 12);
      
      const { error } = await supabase
        .from("users")
        .update({ 
          senha_temporaria_hash: senhaHash,
          deve_trocar_senha: true 
        })
        .eq("id", userId);

      if (error) throw new Error(error.message);
      
      setGeneratedPassword(tempPassword);
      setShowPasswordModal(true);
      toast.success("Senha resetada com sucesso!");
    } catch (error: any) {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro ao resetar senha');
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(generatedPassword);
    toast.success("Senha copiada para a área de transferência!");
  }

  if (loading) {
    return (
      <SimpleDashboardLayout title="Usuários" breadcrumbs={[{ label: "Usuários", icon: Users }]}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-200/50">
                <LoadingSkeleton variant="card" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200/50">
            <LoadingSkeleton variant="table" />
          </div>
        </div>
      </SimpleDashboardLayout>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center text-lg text-red-600 font-semibold">
        Acesso restrito a administradores.
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SimpleDashboardLayout 
        title="Gerenciar Usuários"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Usuários", icon: Users }
        ]}
        headerActions={
          <Button 
            onClick={openNovo} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        }
      >
        {/* Advanced User Management */}
        <AdvancedUserManagement 
          users={usuarios}
          onCreateUser={openNovo}
          onEditUser={openEditar}
          onDeleteUser={handleExcluir}
          onResetPassword={handleResetSenha}
          loading={loading}
        />

        {/* Modal de criação/edição */}
          {showModal && (
            <Dialog open={showModal} onOpenChange={closeModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {modalMode === "novo" ? "Novo Usuário" : "Editar Usuário"}
                  </DialogTitle>
                </DialogHeader>
                
                <form 
                  onSubmit={handleSalvar}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input 
                      id="nome"
                      type="text" 
                      value={form.nome} 
                      onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} 
                      required 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email" 
                      value={form.email} 
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                      required 
                      disabled={modalMode === 'editar'} 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="role">Função</Label>
                    <Select value={form.role} onValueChange={value => setForm(f => ({ ...f, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(role => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={closeModal}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}

        {/* Modal de senha gerada */}
          {showPasswordModal && (
            <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Senha Temporária Gerada</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Uma senha temporária foi gerada. O usuário deverá alterá-la no primeiro login.
                  </p>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-lg">
                        {showPassword ? generatedPassword : '••••••••'}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={copyPassword}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button onClick={() => setShowPasswordModal(false)}>
                      Fechar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
      </SimpleDashboardLayout>
    </ProtectedRoute>
  );
}