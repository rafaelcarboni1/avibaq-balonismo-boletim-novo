import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import EnhancedDashboardLayout from "@/components/magicui/enhanced-dashboard-layout";
import EnhancedKpiCard from "@/components/magicui/enhanced-kpi-card";
import LoadingSkeleton from "@/components/magicui/loading-skeleton";
import { StaggerContainer, StaggerItem } from "@/components/magicui/smooth-transitions";
import { BentoGrid, BentoGridItem } from "@/components/magicui/bento-grid";
import AnimatedChart from "@/components/magicui/animated-chart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, Settings, Users, CheckCircle, XCircle, KeyIcon } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function PermissoesAdmin() {
  const { role } = useUser();
  const [permissoes, setPermissoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    fetchPermissoes();
  }, []);

  async function fetchPermissoes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("permissoes")
      .select("id, role, recurso, acao, permitido")
      .order("role", { ascending: true })
      .order("recurso", { ascending: true })
      .order("acao", { ascending: true });
    if (!error && data) {
      setPermissoes(data);
      // Seleciona a primeira role por padrão
      if (!selectedRole && data.length > 0) {
        setSelectedRole(data[0].role);
      }
    }
    setLoading(false);
    setDirty(false);
  }

  // Agrupar por role > recurso > ação
  const roles = Array.from(new Set(permissoes.map(p => p.role)));
  const recursos = Array.from(new Set(permissoes.map(p => p.recurso)));
  const acoes = Array.from(new Set(permissoes.map(p => p.acao)));

  // Permissões filtradas pela role selecionada
  const permissoesDaRole = permissoes.filter(p => p.role === selectedRole);

  // Montar matriz: recurso x ação para a role selecionada
  function getPermissao(recurso: string, acao: string) {
    return permissoesDaRole.find(p => p.recurso === recurso && p.acao === acao);
  }

  function handleTogglePermissao(id: string, novoValor: boolean) {
    setPermissoes(permissoes => permissoes.map(p => p.id === id ? { ...p, permitido: novoValor } : p));
    setDirty(true);
  }

  async function handleSalvar() {
    setSaving(true);
    let erro = false;
    for (const perm of permissoes) {
      const { error } = await supabase.from("permissoes").update({ permitido: perm.permitido, atualizado_em: new Date().toISOString() }).eq("id", perm.id);
      if (error) erro = true;
    }
    setSaving(false);
    setDirty(false);
    if (erro) {
      toast.error("Erro ao salvar permissões!");
    } else {
      toast.success("Permissões salvas com sucesso!");
      fetchPermissoes();
    }
  }

  const getPermissionStats = () => {
    const totalPermissions = permissoes.length;
    const allowedPermissions = permissoes.filter(p => p.permitido).length;
    const deniedPermissions = totalPermissions - allowedPermissions;
    const permissionsByRole = roles.reduce((acc, role) => {
      acc[role] = permissoes.filter(p => p.role === role && p.permitido).length;
      return acc;
    }, {} as Record<string, number>);
    
    return { totalPermissions, allowedPermissions, deniedPermissions, permissionsByRole };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return ShieldCheck;
      case 'meteo': return Settings;
      case 'tesouraria': return Users;
      default: return Shield;
    }
  };

  if (loading) {
    return (
      <EnhancedDashboardLayout title="Permissões" breadcrumbs={[{ label: "Permissões", icon: KeyIcon }]}>
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

  const stats = getPermissionStats();

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <EnhancedDashboardLayout 
        title="Gerenciar Permissões"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Permissões", icon: KeyIcon }
        ]}
        headerActions={
          <div className="flex gap-3">
            <Button onClick={handleSalvar} disabled={!dirty || saving} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
            {dirty && (
              <Badge variant="destructive" className="px-3 py-1">
                Alterações não salvas
              </Badge>
            )}
          </div>
        }
      >
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <EnhancedKpiCard 
              title="Total de Permissões"
              value={stats.totalPermissions}
              icon={Shield}
              color="blue"
              trend="neutral"
              trendValue="Sistema"
              description="Permissões configuradas"
              delay={0}
            />
            <EnhancedKpiCard 
              title="Permitidas"
              value={stats.allowedPermissions}
              icon={CheckCircle}
              color="green"
              trend="up"
              trendValue="Ativas"
              description="Permissões habilitadas"
              delay={0.05}
            />
            <EnhancedKpiCard 
              title="Negadas"
              value={stats.deniedPermissions}
              icon={XCircle}
              color="red"
              trend="down"
              trendValue="Bloqueadas"
              description="Permissões desabilitadas"
              delay={0.1}
            />
            <EnhancedKpiCard 
              title="Roles Ativas"
              value={roles.length}
              icon={Users}
              color="purple"
              trend="neutral"
              trendValue="Configuradas"
              description="Funções de usuário"
              delay={0.15}
            />
          </div>

          {/* Gráfico de Permissões */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <AnimatedChart
              title="Permissões por Role"
              type="pie"
              data={roles.map(role => ({
                name: role.charAt(0).toUpperCase() + role.slice(1),
                value: stats.permissionsByRole[role] || 0
              }))}
              colors={["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]}
            />
            
            <AnimatedChart
              title="Status das Permissões"
              type="bar"
              data={[
                { name: 'Permitidas', value: stats.allowedPermissions },
                { name: 'Negadas', value: stats.deniedPermissions },
                { name: 'Total', value: stats.totalPermissions },
              ]}
              colors={["#10b981", "#ef4444", "#3b82f6"]}
            />
          </div>

          {/* Bento Grid Layout */}
          <BentoGrid className="md:auto-rows-[20rem] mb-8">
            {/* Seletor de Roles */}
            <BentoGridItem
              className="md:col-span-2"
              title="Selecionar Função (Role)"
              description={
                <div className="space-y-4">
                  <p className="text-gray-600">Escolha a função para configurar as permissões específicas</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {roles.map(r => {
                      const RoleIcon = getRoleIcon(r);
                      return (
                        <Button
                          key={r}
                          variant={selectedRole === r ? "default" : "outline"}
                          onClick={() => setSelectedRole(r)}
                          className={`flex items-center gap-2 h-auto py-2 text-xs ${
                            selectedRole === r ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''
                          }`}
                          size="sm"
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span className="capitalize">{r}</span>
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {stats.permissionsByRole[r] || 0}
                          </Badge>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl items-center justify-center">
                  <Shield className="h-10 w-10 text-white" />
                </div>
              }
              icon={<Shield className="h-6 w-6 text-blue-500" />}
            />

            {/* Estatísticas da Role Selecionada */}
            <BentoGridItem
              title="Role Ativa"
              description={
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(selectedRole) && (
                      React.createElement(getRoleIcon(selectedRole), { className: "h-5 w-5 text-blue-600" })
                    )}
                    <span className="font-semibold capitalize text-blue-600">{selectedRole}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {stats.permissionsByRole[selectedRole] || 0} permissões ativas
                  </p>
                  <div className="mt-3">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      (stats.permissionsByRole[selectedRole] || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {(stats.permissionsByRole[selectedRole] || 0) > 0 ? 'Ativa' : 'Sem permissões'}
                    </div>
                  </div>
                </div>
              }
              header={
                <div className="flex h-20 w-full bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl items-center justify-center">
                  <Users className="h-10 w-10 text-white" />
                </div>
              }
              icon={<Users className="h-6 w-6 text-green-500" />}
            />
          </BentoGrid>

          {/* Tabela de Permissões */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl rounded-2xl border border-gray-200/50 shadow-lg"
          >
            <div className="p-6 border-b border-gray-200/50">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {getRoleIcon(selectedRole) && (
                  React.createElement(getRoleIcon(selectedRole), { className: "h-5 w-5 text-blue-600" })
                )}
                Permissões para: <span className="capitalize text-blue-600">{selectedRole}</span>
              </h2>
              <p className="text-gray-600 mt-1">Configure as permissões para esta função</p>
            </div>
            
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Recurso</th>
                      {acoes.map(acao => (
                        <th key={acao} className="text-center py-3 px-4 font-semibold text-gray-900 capitalize">
                          {acao}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <StaggerContainer>
                      {recursos.map((recurso, index) => (
                        <StaggerItem key={recurso}>
                          <motion.tr 
                            whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                            className="border-b border-gray-100 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span className="font-medium text-gray-900 capitalize">{recurso}</span>
                              </div>
                            </td>
                            {acoes.map(acao => {
                              const perm = getPermissao(recurso, acao);
                              return (
                                <td key={acao} className="py-4 px-4 text-center">
                                  {perm ? (
                                    <label className="inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={!!perm.permitido}
                                        onChange={e => handleTogglePermissao(perm.id, e.target.checked)}
                                        className="sr-only"
                                      />
                                      <div className={`relative w-6 h-6 rounded-md border-2 transition-all duration-200 ${
                                        perm.permitido 
                                          ? 'bg-green-500 border-green-500' 
                                          : 'bg-gray-100 border-gray-300 hover:border-gray-400'
                                      }`}>
                                        {perm.permitido && (
                                          <CheckCircle className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                                        )}
                                      </div>
                                    </label>
                                  ) : (
                                    <div className="w-6 h-6 rounded-md bg-gray-200 border-2 border-gray-300 mx-auto opacity-50" />
                                  )}
                                </td>
                              );
                            })}
                          </motion.tr>
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>
      </EnhancedDashboardLayout>
    </ProtectedRoute>
  );
} 