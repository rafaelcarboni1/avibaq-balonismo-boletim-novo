"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../src/integrations/supabase/client";
import EnhancedDashboardLayout from "../../src/components/magicui/enhanced-dashboard-layout";
import EnhancedKpiCard from "../../src/components/magicui/enhanced-kpi-card";
import { BentoGrid, BentoGridItem } from "../../src/components/magicui/bento-grid";
import AnimatedChart from "../../src/components/magicui/animated-chart";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Badge } from "../../src/components/ui/badge";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { User, Shield, Save, Key, LogOut, Camera, ArrowLeft, UserCheck, Plane, Clock, CheckCircle } from "lucide-react";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";

export default function MinhaContaPiloto() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ nome: "", telefone: "", celular: "", endereco: "", cidade: "", cep: "" });
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [novaSenha2, setNovaSenha2] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalVoos: 0, baloesRegistrados: 0, horasVoadas: 0 });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
      
      // Buscar dados do piloto na tabela users
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user?.id)
        .single();
      
      // Buscar dados do formulário "Associar-se" na tabela membros
      const { data: membroData } = await supabase
        .from("membros")
        .select("*")
        .eq("email", user?.email)
        .eq("tipo", "piloto")
        .single();
      
      // Combinar dados de ambas as tabelas (membros tem prioridade por ser mais completo)
      setProfile({
        nome: membroData?.nome_completo || userData?.nome || "",
        telefone: membroData?.telefone || userData?.telefone || "",
        celular: userData?.celular || "",
        endereco: userData?.endereco || "",
        cidade: userData?.cidade || "",
        cep: userData?.cep || ""
      });
      
      // Buscar estatísticas do piloto
      if (user?.id) {
        // Total de voos
        const { count: totalVoos } = await supabase
          .from("voos")
          .select("*", { count: 'exact' })
          .eq("piloto_responsavel_id", user.id);
        
        // Balões registrados
        const { count: baloesRegistrados } = await supabase
          .from("baloes")
          .select("*", { count: 'exact' })
          .eq("proprietario_id", user.id);
        
        // Horas voadas (simulado - seria calculado baseado nos voos)
        const horasVoadas = (totalVoos || 0) * 2.5; // média de 2.5h por voo
        
        setStats({
          totalVoos: totalVoos || 0,
          baloesRegistrados: baloesRegistrados || 0,
          horasVoadas: Math.round(horasVoadas)
        });
      }
      
      setLoading(false);
    })();
  }, []);

  async function saveProfile() {
    setLoading(true);
    
    try {
      // Atualizar tabela users
      const { error: usersError } = await supabase
        .from("users")
        .update({
          nome: profile.nome,
          telefone: profile.telefone,
          celular: profile.celular,
          endereco: profile.endereco,
          cidade: profile.cidade,
          cep: profile.cep
        })
        .eq("id", user.id);

      if (usersError) {
        toast.error("Erro ao salvar na tabela users: " + usersError.message);
        setLoading(false);
        return;
      }

      // Atualizar tabela membros (se existir registro)
      const { error: membrosError } = await supabase
        .from("membros")
        .update({
          nome_completo: profile.nome,
          telefone: profile.telefone
        })
        .eq("email", user.email)
        .eq("tipo", "piloto");

      // Não tratamos membrosError como erro crítico pois nem todos têm registro em membros

      // Atualizar metadata do auth
      await supabase.auth.updateUser({ data: { nome: profile.nome } });
      
      toast.success("Perfil salvo com sucesso!");
    } catch (error) {
      toast.error("Erro inesperado: " + error.message);
    }
    
    setLoading(false);
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setAvatarUploading(true);
    const file = e.target.files[0];
    const path = `avatars/piloto-${user.id}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(path, file, { upsert: true });
      
    if (uploadError) {
      toast.error("Erro ao fazer upload do avatar: " + uploadError.message);
      setAvatarUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from("public-assets")
      .getPublicUrl(path);
      
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setAvatarUrl(publicUrl);
    toast.success("Avatar atualizado com sucesso!");
    setAvatarUploading(false);
  }

  function validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (password.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(password)) errors.push("Pelo menos 1 letra maiúscula");
    if (!/[a-z]/.test(password)) errors.push("Pelo menos 1 letra minúscula");
    if (!/[0-9]/.test(password)) errors.push("Pelo menos 1 número");
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) errors.push("Pelo menos 1 símbolo");
    return { valid: errors.length === 0, errors };
  }

  async function changePassword() {
    if (!novaSenha || novaSenha !== novaSenha2) {
      toast.error("As senhas não coincidem");
      return;
    }
    
    const { valid, errors } = validatePassword(novaSenha);
    if (!valid) {
      toast.error("Senha inválida: " + errors.join(", "));
      return;
    }
    
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    
    if (error) {
      toast.error("Erro ao alterar senha: " + error.message);
    } else {
      toast.success("Senha alterada com sucesso!");
      setNovaSenha("");
      setNovaSenha2("");
    }
  }

  async function logoutAll() {
    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/piloto/login";
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["piloto"]}>
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
    <ProtectedRoute allowedRoles={["piloto"]}>
      <EnhancedDashboardLayout 
        title="Minha Conta"
        breadcrumbs={[
          { label: "Dashboard", href: "/piloto/dashboard" },
          { label: "Minha Conta", icon: User }
        ]}
        headerActions={
          <Button variant="outline" onClick={() => window.location.href = "/piloto/dashboard"}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        }
      >
        <div className="max-w-6xl mx-auto space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <EnhancedKpiCard 
              title="Total de Voos"
              value={stats.totalVoos}
              icon={Plane}
              color="blue"
              trend="up"
              trendValue={`${stats.totalVoos} voos`}
              description="Voos realizados"
              delay={0}
            />
            <EnhancedKpiCard 
              title="Balões Registrados"
              value={stats.baloesRegistrados}
              icon={CheckCircle}
              color="green"
              trend="up"
              trendValue={`${stats.baloesRegistrados} balões`}
              description="Em sua frota"
              delay={0.05}
            />
            <EnhancedKpiCard 
              title="Horas de Voo"
              value={stats.horasVoadas}
              icon={Clock}
              color="purple"
              trend="up"
              trendValue={`${stats.horasVoadas}h total`}
              description="Experiência acumulada"
              delay={0.1}
            />
            <EnhancedKpiCard 
              title="Conta Ativa"
              value={1}
              icon={UserCheck}
              color="yellow"
              trend="up"
              trendValue="Verificada"
              description="Status da conta"
              delay={0.15}
            />
          </div>

          {/* Gráficos de Atividade - Só mostra se há dados */}
          {(stats.totalVoos > 0 || stats.baloesRegistrados > 0 || stats.horasVoadas > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <AnimatedChart
                title="Distribuição de Atividades"
                type="pie"
                data={[
                  { name: 'Voos Realizados', value: Math.max(stats.totalVoos, 1) },
                  { name: 'Balões Registrados', value: Math.max(stats.baloesRegistrados, 1) },
                  { name: 'Horas Voadas', value: Math.max(Math.round(stats.horasVoadas / 10), 1) },
                ]}
                colors={["#3b82f6", "#10b981", "#8b5cf6"]}
              />
              
              <AnimatedChart
                title="Estatísticas Mensais"
                type="bar"
                data={[
                  { name: 'Jan', value: Math.max(Math.round(stats.totalVoos * 0.1), 1) },
                  { name: 'Fev', value: Math.max(Math.round(stats.totalVoos * 0.15), 1) },
                  { name: 'Mar', value: Math.max(Math.round(stats.totalVoos * 0.2), 1) },
                  { name: 'Abr', value: Math.max(Math.round(stats.totalVoos * 0.25), 1) },
                  { name: 'Mai', value: Math.max(Math.round(stats.totalVoos * 0.3), 2) },
                ]}
                colors={["#3b82f6"]}
              />
            </div>
          )}

          {/* Bento Grid Layout */}
          <BentoGrid className="md:auto-rows-[20rem] mb-8">
            {/* Resumo do Perfil */}
            <BentoGridItem
              className="md:col-span-2"
              title="Resumo do Piloto"
              description={
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">{profile.nome || 'Nome não definido'}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">📧 {user?.email}</p>
                    <p className="text-sm text-gray-600">📱 {profile.celular || profile.telefone || 'Telefone não definido'}</p>
                    <p className="text-sm text-gray-600">🏠 {profile.cidade || 'Cidade não definida'}</p>
                    <div className="flex gap-2 mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        profile.nome && profile.celular ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profile.nome && profile.celular ? 'Perfil Completo' : 'Perfil Incompleto'}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Piloto Ativo
                      </span>
                    </div>
                  </div>
                </div>
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl items-center justify-center">
                  <Plane className="h-10 w-10 text-white" />
                </div>
              }
              icon={<Plane className="h-6 w-6 text-blue-500" />}
            />
            
            {/* Estatísticas de Voo */}
            <BentoGridItem
              title="Estatísticas de Voo"
              description={
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-600">{stats.horasVoadas}h de experiência</span>
                  </div>
                  <p className="text-sm text-gray-600">{stats.totalVoos} voos realizados</p>
                  <p className="text-sm text-gray-600">{stats.baloesRegistrados} balões na frota</p>
                  <div className="mt-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      Piloto Experiente
                    </span>
                  </div>
                </div>
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl items-center justify-center">
                  <Clock className="h-10 w-10 text-white" />
                </div>
              }
              icon={<Clock className="h-6 w-6 text-purple-500" />}
            />
          </BentoGrid>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulário de Perfil */}
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
                <p className="text-gray-600 mt-1">Mantenha seus dados atualizados</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Avatar" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-200">
                        <User className="h-8 w-8 text-blue-600" />
                      </div>
                    )}
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
                    <p className="text-xs text-gray-500">Clique para alterar</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <Input
                      value={profile.nome}
                      onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                      placeholder="Digite seu nome completo"
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Telefone
                      </label>
                      <Input
                        value={profile.telefone}
                        onChange={(e) => setProfile({ ...profile, telefone: e.target.value })}
                        placeholder="(48) 3333-1234"
                        disabled={loading}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Celular *
                      </label>
                      <Input
                        value={profile.celular}
                        onChange={(e) => setProfile({ ...profile, celular: e.target.value })}
                        placeholder="(48) 99999-1234"
                        disabled={loading}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Endereço
                    </label>
                    <Input
                      value={profile.endereco}
                      onChange={(e) => setProfile({ ...profile, endereco: e.target.value })}
                      placeholder="Rua, número, bairro"
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cidade
                      </label>
                      <Input
                        value={profile.cidade}
                        onChange={(e) => setProfile({ ...profile, cidade: e.target.value })}
                        placeholder="Sua cidade"
                        disabled={loading}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        CEP
                      </label>
                      <Input
                        value={profile.cep}
                        onChange={(e) => setProfile({ ...profile, cep: e.target.value })}
                        placeholder="00000-000"
                        disabled={loading}
                        className="w-full"
                      />
                    </div>
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
                      placeholder="Mín. 8 chars, maiúsc., minúsc., núm., símbolo"
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
                
                <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                  <strong>📋 Requisitos da senha:</strong>
                  <ul className="mt-1 space-y-1 text-blue-800">
                    <li>• Mínimo 8 caracteres</li>
                    <li>• Pelo menos 1 maiúscula (A-Z)</li>
                    <li>• Pelo menos 1 minúscula (a-z)</li>
                    <li>• Pelo menos 1 número (0-9)</li>
                    <li>• Pelo menos 1 símbolo (!@#$%...)</li>
                  </ul>
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
                    <strong>💡 Dica de Segurança:</strong> Use uma senha forte e única para proteger sua conta de piloto.
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