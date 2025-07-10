import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "react-hot-toast";
import { useUser } from "@/hooks/useUser";
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

  // Gerar senha temporária segura
  function generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const symbols = '!@#$';
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
        
        // Inserir usuário com senha_hash
        const { error } = await supabase.from("users").insert({ 
          nome: form.nome, 
          email: form.email, 
          role: form.role,
          senha_hash: senhaHash,
          ativo: true
        });
        
        if (error) {
          toast.error("Erro ao criar usuário: " + error.message);
        } else {
          toast.success("Usuário criado com sucesso");
          setGeneratedPassword(tempPassword);
          setShowPasswordModal(true);
        }
      } catch (err) {
        toast.error("Erro ao processar senha");
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
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) toast.error("Erro ao deletar usuário");
    else toast.success("Usuário deletado");
    fetchUsuarios();
  }

  if (role !== 'admin') {
    return <div className="max-w-2xl mx-auto mt-16 text-center text-lg text-red-600 font-semibold">Acesso restrito a administradores.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout title="Usuários do Sistema">
        <div className="max-w-4xl mx-auto mt-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Usuários do Sistema</h1>
            <Button onClick={openNovo}>+ Novo Usuário</Button>
          </div>
          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-3 py-2 text-left">ID</th>
                      <th className="px-3 py-2 text-left">Nome</th>
                      <th className="px-3 py-2 text-left">E-mail</th>
                      <th className="px-3 py-2 text-left">Role</th>
                      <th className="px-3 py-2 text-left">Criado em</th>
                      <th className="px-3 py-2 text-left">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={6} className="text-center py-6">Carregando...</td></tr>
                    ) : usuarios.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-6">Nenhum usuário encontrado</td></tr>
                    ) : usuarios.map(u => (
                      <tr key={u.id} className="border-b">
                        <td className="px-3 py-2 font-mono text-xs">{u.id}</td>
                        <td className="px-3 py-2">{u.nome}</td>
                        <td className="px-3 py-2">{u.email}</td>
                        <td className="px-3 py-2 capitalize">{u.role}</td>
                        <td className="px-3 py-2">{u.created_at ? new Date(u.created_at).toLocaleString('pt-BR') : '-'}</td>
                        <td className="px-3 py-2 flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditar(u)}>Editar</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeletar(u.id)}>Deletar</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Modal Senha Temporária */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-green-600">✅ Usuário Criado com Sucesso!</h2>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Uma senha temporária foi gerada para o usuário. Copie e repasse com segurança:
                </p>
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
            </div>
          </div>
        )}

        {/* Modal Novo/Editar Usuário */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{modalMode === 'novo' ? 'Novo Usuário' : 'Editar Usuário'}</h2>
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
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
} 