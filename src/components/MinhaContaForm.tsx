"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import EnhancedDashboardLayout from "@/components/magicui/enhanced-dashboard-layout";
import EnhancedKpiCard from "@/components/magicui/enhanced-kpi-card";
import { BentoGrid, BentoGridItem } from "@/components/magicui/bento-grid";
import AnimatedChart from "@/components/magicui/animated-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";
import { User, Shield, Save, Key, LogOut, Camera, ArrowLeft, UserCheck } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MinhaContaForm() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ nome: "", telefone: "" });
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [novaSenha2, setNovaSenha2] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
      // tenta buscar em users_profiles
      const { data } = await supabase
        .from("users_profiles")
        .select("nome, telefone")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
      else if (user.user_metadata) {
        setProfile({
          nome: user.user_metadata.nome ?? "",
          telefone: user.user_metadata.telefone ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  async function saveProfile() {
    setLoading(true);
    await supabase
      .from("users_profiles")
      .upsert({ id: user.id, ...profile });
    await supabase.auth.updateUser({ data: profile });
    await supabase.from("users").update({ nome: profile.nome, telefone: profile.telefone }).eq("id", user.id);
    toast.success("Perfil salvo!");
    setLoading(false);
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setAvatarUploading(true);
    const file = e.target.files[0];
    const path = `avatars/${user.id}.png`;
    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Erro ao fazer upload do avatar: " + uploadError.message);
      setAvatarUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("public-assets")
      .getPublicUrl(path);
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setAvatarUrl(publicUrl);
    toast.success("Avatar atualizado");
    setAvatarUploading(false);
  }

  async function changePassword() {
    if (!novaSenha || novaSenha !== novaSenha2) {
      toast.error("As senhas não coincidem");
      return;
    }
    await supabase.auth.updateUser({ password: novaSenha });
    toast.success("Senha alterada — faça login novamente");
    location.href = "/login";
  }

  async function logoutAll() {
    await supabase.auth.signOut({ scope: "global" });
    location.href = "/login";
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "meteo", "tesouraria", "piloto", "agencia"]}>
        <EnhancedDashboardLayout title="Minha Conta" breadcrumbs={[{ label: "Minha Conta", icon: User }]}>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200/50">
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Carregando informações da conta...</p>
              </div>
            </div>
          </div>
        </EnhancedDashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "meteo", "tesouraria", "piloto", "agencia"]}>
      <EnhancedDashboardLayout 
        title="Minha Conta"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Minha Conta", icon: User }
        ]}
        headerActions={
          <Button variant="outline" onClick={() => window.location.href = "/admin/dashboard"}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        }
      >
        <div className="max-w-6xl mx-auto space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <EnhancedKpiCard 
              title="Conta Ativa"
              value={1}
              icon={UserCheck}
              color="green"
              trend="up"
              trendValue="Verificada"
              description="Status da conta"
              delay={0}
            />
            <EnhancedKpiCard 
              title="Perfil"
              value={profile.nome ? 100 : 50}
              icon={User}
              color="blue"
              trend={profile.nome ? "up" : "neutral"}
              trendValue={profile.nome ? "Completo" : "Incompleto"}
              description="Dados do perfil (%)"
              delay={0.05}
            />
            <EnhancedKpiCard 
              title="Segurança"
              value={user?.email_confirmed_at ? 100 : 75}
              icon={Shield}
              color="purple"
              trend={user?.email_confirmed_at ? "up" : "neutral"}
              trendValue={user?.email_confirmed_at ? "Seguro" : "Pendente"}
              description="Nível de segurança (%)"
              delay={0.1}
            />
            <EnhancedKpiCard 
              title="Último Login"
              value="Hoje"
              icon={Key}
              color="yellow"
              trend="neutral"
              trendValue="Ativo"
              description="Atividade recente"
              delay={0.15}
            />
          </div>

          {/* Gráficos de Status da Conta */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AnimatedChart
              title="Status do Perfil"
              type="pie"
              data={[
                { name: 'Completo', value: profile.nome && profile.telefone ? 80 : 20 },
                { name: 'Pendente', value: profile.nome && profile.telefone ? 20 : 80 },
              ]}
              colors={["#10b981", "#f59e0b"]}
            />
            
            <AnimatedChart
              title="Atividade da Conta"
              type="bar"
              data={[
                { name: 'Logins', value: 25 },
                { name: 'Perfil', value: profile.nome ? 100 : 50 },
                { name: 'Segurança', value: user?.email_confirmed_at ? 100 : 75 },
              ]}
              colors={["#3b82f6", "#10b981", "#8b5cf6"]}
            />
          </div>

          {/* Bento Grid Layout */}
          <BentoGrid className="md:auto-rows-[20rem] mb-8">
            {/* Resumo do Perfil */}
            <BentoGridItem
              className="md:col-span-2"
              title="Resumo do Perfil"
              description={
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">{profile.nome || 'Nome não definido'}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">📧 {user?.email}</p>
                    <p className="text-sm text-gray-600">📱 {profile.telefone || 'Telefone não definido'}</p>
                    <div className="flex gap-2 mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        profile.nome ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profile.nome ? 'Perfil Completo' : 'Perfil Incompleto'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user?.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user?.email_confirmed_at ? 'E-mail Verificado' : 'E-mail Pendente'}
                      </span>
                    </div>
                  </div>
                </div>
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
              }
              icon={<User className="h-6 w-6 text-blue-500" />}
            />
            
            {/* Último Login */}
            <BentoGridItem
              title="Atividade Recente"
              description={
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-600">Último Login: Hoje</span>
                  </div>
                  <p className="text-sm text-gray-600">Sessão ativa no sistema</p>
                  <p className="text-sm text-gray-600">Dispositivo: Desktop</p>
                </div>
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl items-center justify-center">
                  <Key className="h-10 w-10 text-white" />
                </div>
              }
              icon={<Key className="h-6 w-6 text-yellow-500" />}
            />
          </BentoGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário de Perfil (fora do Bento Grid) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg"
            >
              <div className="p-6 border-b border-gray-200/50">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Editar Perfil
                </h2>
                <p className="text-gray-600 mt-1">Altere seus dados pessoais</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Avatar Section */}
                {avatarUrl && (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={avatarUrl} 
                        alt="Avatar" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={uploadAvatar}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={avatarUploading}
                      />
                      {avatarUploading && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Foto do Perfil</p>
                      <p className="text-xs text-gray-500">Clique na foto para alterar</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    <Input
                      value={profile.nome}
                      onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                      placeholder="Digite seu nome completo"
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telefone
                    </label>
                    <Input
                      value={profile.telefone}
                      onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
                      placeholder="(48) 99999-1234"
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      E-mail
                    </label>
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado</p>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={saveProfile}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Perfil
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Seção Segurança */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg"
            >
              <div className="p-6 border-b border-gray-200/50">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Segurança da Conta
                </h2>
                <p className="text-gray-600 mt-1">Gerencie sua senha e sessões</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nova Senha
                    </label>
                    <Input
                      type="password"
                      placeholder="Digite a nova senha"
                      value={novaSenha}
                      onChange={e => setNovaSenha(e.target.value)}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirmar Nova Senha
                    </label>
                    <Input
                      type="password"
                      placeholder="Confirme a nova senha"
                      value={novaSenha2}
                      onChange={e => setNovaSenha2(e.target.value)}
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button 
                    onClick={changePassword}
                    disabled={loading || !novaSenha || novaSenha !== novaSenha2}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </Button>
                  
                  <Button 
                    onClick={logoutAll}
                    variant="destructive"
                    disabled={loading}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair de Todos os Dispositivos
                  </Button>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>💡 Dica de Segurança:</strong> Use uma senha forte com pelo menos 8 caracteres, incluindo letras, números e símbolos.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </EnhancedDashboardLayout>
    </ProtectedRoute>
  );
} 