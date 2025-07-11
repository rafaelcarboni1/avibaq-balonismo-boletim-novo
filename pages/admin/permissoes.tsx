import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import EnhancedDashboardLayout from "@/components/magicui/enhanced-dashboard-layout";
import EnhancedKpiCard from "@/components/magicui/enhanced-kpi-card";
import LoadingSkeleton from "@/components/magicui/loading-skeleton";
import { StaggerContainer, StaggerItem } from "@/components/magicui/smooth-transitions";
import { BentoGrid, BentoGridItem } from "@/components/magicui/bento-grid";
import AnimatedChart from "@/components/magicui/animated-chart";
import { PermissionTabs, PermissionMatrix, ModuleManager, AuditLogViewer } from "@/components/magicui/advanced-permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, Settings, Users, CheckCircle, XCircle, KeyIcon, History, FileText, Eye, Download, Clock, AlertTriangle } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function PermissoesAdmin() {
  const { role, user } = useUser();
  const [permissoes, setPermissoes] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'permissions' | 'modules' | 'audit'>('permissions');

  useEffect(() => {
    fetchPermissoes();
    fetchModules();
    fetchAuditLogs();
  }, []);

  async function fetchPermissoes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("permissoes")
      .select("id, role, recurso, acao, permitido, nivel_acesso, restricoes, data_criacao, data_atualizacao")
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

  async function fetchModules() {
    const mockModules = [
      {
        id: '1',
        nome: 'Gestão de Voos',
        descricao: 'Módulo para planejamento e execução de voos',
        categoria: 'core',
        ativo: true,
        critico: true,
        versao: '2.1.0',
        atualizado_em: new Date().toISOString()
      },
      {
        id: '2', 
        nome: 'Sistema de Permissões',
        descricao: 'Controle de acesso e permissões',
        categoria: 'admin',
        ativo: true,
        critico: true,
        versao: '1.5.0',
        atualizado_em: new Date().toISOString()
      },
      {
        id: '3',
        nome: 'Relatórios Avançados',
        descricao: 'Geração de relatórios e analytics',
        categoria: 'admin',
        ativo: true,
        critico: false,
        versao: '1.2.0',
        atualizado_em: new Date().toISOString()
      },
      {
        id: '4',
        nome: 'Notificações Push',
        descricao: 'Sistema de notificações em tempo real',
        categoria: 'core',
        ativo: false,
        critico: false,
        versao: '0.9.0',
        atualizado_em: new Date().toISOString()
      },
      {
        id: '5',
        nome: 'Dashboard Piloto',
        descricao: 'Interface específica para pilotos',
        categoria: 'piloto',
        ativo: true,
        critico: false,
        versao: '2.0.0',
        atualizado_em: new Date().toISOString()
      },
      {
        id: '6',
        nome: 'Portal Agência',
        descricao: 'Funcionalidades para agências',
        categoria: 'agencia',
        ativo: true,
        critico: false,
        versao: '1.8.0',
        atualizado_em: new Date().toISOString()
      }
    ];
    setModules(mockModules);
  }

  async function fetchAuditLogs() {
    const mockAuditLogs = [
      {
        id: '1',
        data_acao: new Date().toISOString(),
        usuario_id: user?.id || 'admin',
        usuario: { nome: user?.name || 'Admin' },
        acao: 'update_permission',
        recurso: 'voos.create',
        detalhes: 'Permissão concedida para role admin',
        ip_origem: '127.0.0.1'
      },
      {
        id: '2',
        data_acao: new Date(Date.now() - 3600000).toISOString(),
        usuario_id: user?.id || 'admin',
        usuario: { nome: user?.name || 'Admin' },
        acao: 'toggle_module',
        recurso: 'module.notifications',
        detalhes: 'Módulo de notificações desativado',
        ip_origem: '127.0.0.1'
      },
      {
        id: '3',
        data_acao: new Date(Date.now() - 7200000).toISOString(),
        usuario_id: 'user123',
        usuario: { nome: 'João Silva' },
        acao: 'login',
        recurso: 'auth.login',
        detalhes: 'Login realizado com sucesso',
        ip_origem: '192.168.1.100'
      }
    ];
    setAuditLogs(mockAuditLogs);
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
    
    // Log de auditoria para cada mudança
    for (const perm of permissoes) {
      const { error } = await supabase
        .from("permissoes")
        .update({ 
          permitido: perm.permitido, 
          atualizado_em: new Date().toISOString(),
          atualizado_por: user?.id
        })
        .eq("id", perm.id);
      
      if (error) {
        erro = true;
      } else {
        // Registrar log de auditoria
        await logAuditAction({
          acao: 'update_permission',
          recurso: `${perm.recurso}.${perm.acao}`,
          detalhes: `Permissão ${perm.permitido ? 'concedida' : 'revogada'} para role ${perm.role}`,
          usuario_id: user?.id
        });
      }
    }
    
    setSaving(false);
    setDirty(false);
    
    if (erro) {
      toast.error("Erro ao salvar permissões!");
    } else {
      toast.success("Permissões salvas com sucesso!");
      fetchPermissoes();
      fetchAuditLogs();
    }
  }

  async function logAuditAction(actionData: any) {
    // Simular log - em produção salvaria no banco
    const newLog = {
      id: Date.now().toString(),
      ...actionData,
      data_acao: new Date().toISOString(),
      ip_origem: '127.0.0.1',
      user_agent: navigator.userAgent
    };
    
    setAuditLogs(logs => [newLog, ...logs]);
  }

  async function handleToggleModule(moduleId: string, enabled: boolean) {
    const updatedModules = modules.map(m => 
      m.id === moduleId ? { ...m, ativo: enabled, atualizado_em: new Date().toISOString() } : m
    );
    setModules(updatedModules);
    
    await logAuditAction({
      acao: 'toggle_module',
      recurso: `module.${moduleId}`,
      detalhes: `Módulo ${enabled ? 'ativado' : 'desativado'}`,
      usuario_id: user?.id
    });
    
    toast.success(`Módulo ${enabled ? 'ativado' : 'desativado'} com sucesso!`);
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
          {/* Navigation Tabs */}
          <PermissionTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* KPI Cards baseados na aba ativa */}
          {activeTab === 'permissions' && (
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
          )}

          {activeTab === 'modules' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <EnhancedKpiCard 
                title="Módulos Ativos"
                value={modules.filter(m => m.ativo).length}
                icon={CheckCircle}
                color="green"
                trend="neutral"
                trendValue="Funcionais"
                description="Módulos habilitados"
                delay={0}
              />
              <EnhancedKpiCard 
                title="Módulos Inativos"
                value={modules.filter(m => !m.ativo).length}
                icon={XCircle}
                color="red"
                trend="neutral"
                trendValue="Desabilitados"
                description="Módulos desativados"
                delay={0.05}
              />
              <EnhancedKpiCard 
                title="Total de Módulos"
                value={modules.length}
                icon={Settings}
                color="blue"
                trend="neutral"
                trendValue="Sistema"
                description="Módulos do sistema"
                delay={0.1}
              />
              <EnhancedKpiCard 
                title="Módulos Críticos"
                value={modules.filter(m => m.critico).length}
                icon={AlertTriangle}
                color="yellow"
                trend="neutral"
                trendValue="Essenciais"
                description="Módulos críticos"
                delay={0.15}
              />
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <EnhancedKpiCard 
                title="Ações Hoje"
                value={auditLogs.filter(log => 
                  new Date(log.data_acao).toDateString() === new Date().toDateString()
                ).length}
                icon={Clock}
                color="blue"
                trend="neutral"
                trendValue="Hoje"
                description="Ações registradas"
                delay={0}
              />
              <EnhancedKpiCard 
                title="Total de Logs"
                value={auditLogs.length}
                icon={FileText}
                color="purple"
                trend="neutral"
                trendValue="Histórico"
                description="Registros de auditoria"
                delay={0.05}
              />
              <EnhancedKpiCard 
                title="Usuários Ativos"
                value={new Set(auditLogs.map(log => log.usuario_id)).size}
                icon={Users}
                color="green"
                trend="neutral"
                trendValue="Únicos"
                description="Usuários com atividade"
                delay={0.1}
              />
              <EnhancedKpiCard 
                title="Alterações Permissões"
                value={auditLogs.filter(log => log.acao.includes('permission')).length}
                icon={Shield}
                color="yellow"
                trend="neutral"
                trendValue="Históricas"
                description="Mudanças de permissões"
                delay={0.15}
              />
            </div>
          )}

          {/* Gráficos baseados na aba ativa */}
          {activeTab === 'permissions' && (
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
          )}

          {activeTab === 'modules' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <AnimatedChart
                title="Status dos Módulos"
                type="pie"
                data={[
                  { name: 'Ativos', value: modules.filter(m => m.ativo).length },
                  { name: 'Inativos', value: modules.filter(m => !m.ativo).length }
                ]}
                colors={["#10b981", "#ef4444"]}
              />
              
              <AnimatedChart
                title="Módulos por Categoria"
                type="bar"
                data={[
                  { name: 'Core', value: modules.filter(m => m.categoria === 'core').length },
                  { name: 'Admin', value: modules.filter(m => m.categoria === 'admin').length },
                  { name: 'Piloto', value: modules.filter(m => m.categoria === 'piloto').length },
                  { name: 'Agência', value: modules.filter(m => m.categoria === 'agencia').length }
                ]}
                colors={["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"]}
              />
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <AnimatedChart
                title="Ações por Tipo"
                type="pie"
                data={[
                  { name: 'Login', value: auditLogs.filter(log => log.acao === 'login').length },
                  { name: 'Permissões', value: auditLogs.filter(log => log.acao.includes('permission')).length },
                  { name: 'Módulos', value: auditLogs.filter(log => log.acao.includes('module')).length },
                  { name: 'Outros', value: auditLogs.filter(log => !['login'].includes(log.acao) && !log.acao.includes('permission') && !log.acao.includes('module')).length }
                ]}
                colors={["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"]}
              />
              
              <AnimatedChart
                title="Atividade por Dia (Últimos 7 dias)"
                type="bar"
                data={Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  const dateStr = date.toDateString();
                  return {
                    name: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
                    value: auditLogs.filter(log => 
                      new Date(log.data_acao).toDateString() === dateStr
                    ).length
                  };
                }).reverse()}
                colors={["#3b82f6"]}
              />
            </div>
          )}

          {/* Conteúdo específico de cada aba */}
          {activeTab === 'permissions' && (
            <PermissionMatrix 
              permissions={permissoes}
              selectedRole={selectedRole}
              roles={roles}
              recursos={recursos}
              acoes={acoes}
              onToggle={handleTogglePermissao}
              onRoleChange={setSelectedRole}
            />
          )}

          {activeTab === 'modules' && (
            <ModuleManager 
              modules={modules}
              onToggle={handleToggleModule}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogViewer 
              logs={auditLogs}
            />
          )}

        </div>
      </EnhancedDashboardLayout>
    </ProtectedRoute>
  );
} 