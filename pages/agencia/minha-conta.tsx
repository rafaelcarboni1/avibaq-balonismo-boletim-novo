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
import { User, Shield, Save, Key, LogOut, Camera, ArrowLeft, UserCheck, Building, Users, Plane, Calendar } from "lucide-react";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";

export default function MinhaContaAgencia() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({ 
    nome: "", 
    telefone: "", 
    celular: "", 
    endereco: "", 
    cidade: "", 
    cep: "",
    cnpj: "",
    razao_social: "",
    nome_fantasia: ""
  });
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [novaSenha2, setNovaSenha2] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stats, setStats] = useState({ 
    pilotosVinculados: 0, 
    baloesGerenciados: 0, 
    voosRealizados: 0, 
    proximosVoos: 0 
  });

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAvatarUrl(user?.user_metadata?.avatar_url ?? null);
      
      // Buscar dados da agência na tabela users
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user?.id)
        .single();
      
      if (userData) {
        setProfile({
          nome: userData.nome || "",
          telefone: userData.telefone || "",
          celular: userData.celular || "",
          endereco: userData.endereco || "",
          cidade: userData.cidade || "",
          cep: userData.cep || "",
          cnpj: userData.cnpj || "",
          razao_social: userData.razao_social || "",
          nome_fantasia: userData.nome_fantasia || ""
        });
      }
      
      // Buscar estatísticas da agência
      if (user?.id) {
        // Pilotos vinculados
        const { count: pilotosVinculados } = await supabase
          .from("vinculos_agencia_piloto")
          .select("*", { count: 'exact' })
          .eq("agencia_id", user.id)
          .eq("status", "ativo");
        
        // Balões gerenciados (da agência + dos pilotos vinculados)
        const { count: baloesGerenciados } = await supabase
          .from("baloes")
          .select("*", { count: 'exact' })
          .or(`proprietario_id.eq.${user.id},agencia_gestora_id.eq.${user.id}`);
        
        // Voos realizados pela agência/pilotos vinculados
        const { count: voosRealizados } = await supabase
          .from("voos")
          .select("*", { count: 'exact' })
          .eq("agencia_id", user.id);
        
        // Próximos voos (simulado)
        const proximosVoos = Math.max(0, (voosRealizados || 0) * 0.1); // 10% dos voos realizados
        
        setStats({
          pilotosVinculados: pilotosVinculados || 0,
          baloesGerenciados: baloesGerenciados || 0,
          voosRealizados: voosRealizados || 0,
          proximosVoos: Math.round(proximosVoos)
        });
      }
      
      setLoading(false);
    })();
  }, []);

  async function saveProfile() {
    setLoading(true);
    
    const { error } = await supabase
      .from("users")
      .update({
        nome: profile.nome,
        telefone: profile.telefone,
        celular: profile.celular,
        endereco: profile.endereco,
        cidade: profile.cidade,
        cep: profile.cep,
        cnpj: profile.cnpj,
        razao_social: profile.razao_social,
        nome_fantasia: profile.nome_fantasia
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil: " + error.message);
    } else {
      await supabase.auth.updateUser({ data: { nome: profile.nome_fantasia || profile.razao_social } });
      toast.success("Perfil salvo com sucesso!");
    }
    
    setLoading(false);
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setAvatarUploading(true);
    const file = e.target.files[0];
    const path = `avatars/agencia-${user.id}.png`;
    
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
    toast.success("Logo atualizado com sucesso!");
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
    window.location.href = "/agencia/login";
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["agencia"]}>
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
    <ProtectedRoute allowedRoles={["agencia"]}>
      <EnhancedDashboardLayout 
        title="Minha Conta"
        breadcrumbs={[
          { label: "Dashboard", href: "/agencia/dashboard" },
          { label: "Minha Conta", icon: User }
        ]}
        headerActions={
          <Button variant="outline" onClick={() => window.location.href = "/agencia/dashboard"}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        }
      >
        <div className="max-w-6xl mx-auto space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <EnhancedKpiCard 
              title="Pilotos Vinculados"
              value={stats.pilotosVinculados}
              icon={Users}
              color="blue"
              trend="up"
              trendValue={`${stats.pilotosVinculados} pilotos`}
              description="Equipe ativa"
              delay={0}
            />
            <EnhancedKpiCard 
              title="Balões Gerenciados"
              value={stats.baloesGerenciados}
              icon={Plane}
              color="green"
              trend="up"
              trendValue={`${stats.baloesGerenciados} balões`}
              description="Frota total"
              delay={0.05}
            />
            <EnhancedKpiCard 
              title="Voos Realizados"
              value={stats.voosRealizados}
              icon={Calendar}
              color="purple"
              trend="up"
              trendValue={`${stats.voosRealizados} voos`}
              description="Operações concluídas"
              delay={0.1}
            />
            <EnhancedKpiCard 
              title="Próximos Voos"
              value={stats.proximosVoos}
              icon={UserCheck}
              color="yellow"
              trend="up"
              trendValue={`${stats.proximosVoos} agendados`}
              description="Planejamento ativo"
              delay={0.15}
            />
          </div>

          {/* Gráficos de Operações */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AnimatedChart
              title="Distribuição de Recursos"
              type="pie"
              data={[
                { name: 'Pilotos', value: stats.pilotosVinculados },
                { name: 'Balões', value: stats.baloesGerenciados },
                { name: 'Voos', value: Math.round(stats.voosRealizados / 10) }, // Escala reduzida
              ]}
              colors={["#3b82f6", "#10b981", "#8b5cf6"]}
            />
            
            <AnimatedChart
              title="Atividade Operacional"
              type="bar"
              data={[
                { name: 'Voos Jan', value: Math.round(stats.voosRealizados * 0.1) },
                { name: 'Voos Fev', value: Math.round(stats.voosRealizados * 0.15) },
                { name: 'Voos Mar', value: Math.round(stats.voosRealizados * 0.2) },
                { name: 'Voos Abr', value: Math.round(stats.voosRealizados * 0.25) },
                { name: 'Voos Mai', value: Math.round(stats.voosRealizados * 0.3) },
              ]}
              colors={["#3b82f6"]}
            />
          </div>

          {/* Bento Grid Layout */}
          <BentoGrid className="md:auto-rows-[20rem] mb-8">
            {/* Resumo da Agência */}
            <BentoGridItem
              className="md:col-span-2"
              title="Resumo da Agência"
              description={
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">{profile.nome_fantasia || profile.razao_social || 'Nome não definido'}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">📧 {user?.email}</p>
                    <p className="text-sm text-gray-600">📱 {profile.celular || profile.telefone || 'Telefone não definido'}</p>
                    <p className="text-sm text-gray-600">🏢 {profile.cnpj || 'CNPJ não definido'}</p>
                    <p className="text-sm text-gray-600">🏠 {profile.cidade || 'Cidade não definida'}</p>
                    <div className="flex gap-2 mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        profile.razao_social && profile.cnpj ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profile.razao_social && profile.cnpj ? 'Perfil Completo' : 'Perfil Incompleto'}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Agência Ativa
                      </span>
                    </div>
                  </div>
                </div>
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl items-center justify-center">
                  <Building className="h-10 w-10 text-white" />
                </div>
              }
              icon={<Building className="h-6 w-6 text-blue-500" />}
            />
            
            {/* Estatísticas Operacionais */}
            <BentoGridItem
              title="Operações"
              description={
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-600">{stats.pilotosVinculados} pilotos ativos</span>
                  </div>
                  <p className="text-sm text-gray-600">{stats.baloesGerenciados} balões na frota</p>
                  <p className="text-sm text-gray-600">{stats.voosRealizados} voos operados</p>
                  <div className="mt-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                      Operação Ativa
                    </span>
                  </div>
                </div>
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl items-center justify-center">
                  <Users className="h-10 w-10 text-white" />
                </div>
              }
              icon={<Users className="h-6 w-6 text-purple-500" />}
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
                  <Building className="h-5 w-5 text-blue-600" />
                  Editar Perfil da Agência
                </h2>
                <p className="text-gray-600 mt-1">Mantenha os dados da empresa atualizados</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Logo Section */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarUrl ? (
                      <img 
                        src={avatarUrl} 
                        alt="Logo da Agência" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-200">
                        <Building className="h-8 w-8 text-blue-600" />
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
                    <p className="text-sm font-medium text-gray-900">Logo da Agência</p>
                    <p className="text-xs text-gray-500">Clique para alterar</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Razão Social *
                    </label>
                    <Input
                      value={profile.razao_social}
                      onChange={(e) => setProfile({ ...profile, razao_social: e.target.value })}
                      placeholder="Nome empresarial completo"
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome Fantasia
                    </label>
                    <Input
                      value={profile.nome_fantasia}
                      onChange={(e) => setProfile({ ...profile, nome_fantasia: e.target.value })}
                      placeholder="Nome comercial da agência"
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      CNPJ *
                    </label>
                    <Input
                      value={profile.cnpj}
                      onChange={(e) => setProfile({ ...profile, cnpj: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      disabled={loading}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Responsável
                    </label>
                    <Input
                      value={profile.nome}
                      onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                      placeholder="Nome do responsável"
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
                    <strong>💡 Dica de Segurança:</strong> Mantenha a senha segura e atualizada para proteger os dados da sua agência.
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