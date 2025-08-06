/**
 * Advanced Permissions Management System
 * Componente para gerenciamento avançado de permissões, módulos e auditoria
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  Settings, 
  Users, 
  CheckCircle, 
  XCircle, 
  KeyIcon, 
  History, 
  FileText, 
  Eye, 
  Download, 
  Clock, 
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MagicCard } from './magic-card';
import { StaggerContainer, StaggerItem } from './smooth-transitions';

interface Permission {
  id: string;
  role: string;
  recurso: string;
  acao: string;
  permitido: boolean;
  nivel_acesso?: string;
  restricoes?: string;
  data_criacao?: string;
  data_atualizacao?: string;
}

interface Module {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  ativo: boolean;
  critico: boolean;
  versao: string;
  atualizado_em: string;
}

interface AuditLog {
  id: string;
  data_acao: string;
  usuario_id: string;
  usuario?: { nome: string };
  acao: string;
  recurso: string;
  detalhes: string;
  ip_origem?: string;
}

interface AdvancedPermissionsProps {
  permissions: Permission[];
  modules: Module[];
  auditLogs: AuditLog[];
  onPermissionToggle: (id: string, value: boolean) => void;
  onModuleToggle: (id: string, value: boolean) => void;
  onSave: () => void;
  saving: boolean;
  dirty: boolean;
}

// Componente de Navegação por Tabs
export function PermissionTabs({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: string; 
  onTabChange: (tab: 'permissions' | 'modules' | 'audit') => void;
}) {
  const tabs = [
    { id: 'permissions', label: 'Permissões', icon: Shield },
    { id: 'modules', label: 'Módulos', icon: Settings },
    { id: 'audit', label: 'Auditoria', icon: History },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id as any)}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Icon className="w-4 h-4 inline mr-2" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// Componente para Matrix de Permissões
export function PermissionMatrix({ 
  permissions, 
  selectedRole, 
  roles,
  recursos,
  acoes,
  onToggle,
  onRoleChange 
}: {
  permissions: Permission[];
  selectedRole: string;
  roles: string[];
  recursos: string[];
  acoes: string[];
  onToggle: (id: string, value: boolean) => void;
  onRoleChange: (role: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const filteredPermissions = permissions.filter(p => 
    p.role === selectedRole &&
    (searchTerm === '' || p.recurso.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.acao.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterLevel === 'all' || p.nivel_acesso === filterLevel)
  );

  const getPermissao = (recurso: string, acao: string) => {
    return filteredPermissions.find(p => p.recurso === recurso && p.acao === acao);
  };

  return (
    <MagicCard className="p-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Matriz de Permissões: <span className="capitalize text-blue-600">{selectedRole}</span>
          </h3>
          <p className="text-gray-600 mt-1">Configure permissões granulares para esta função</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Permissão
          </Button>
        </div>
      </div>

      {/* Seletor de Role */}
      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          {roles.map(role => (
            <Button
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              onClick={() => onRoleChange(role)}
              className={`flex items-center gap-2 ${
                selectedRole === role ? 'bg-gradient-to-r from-blue-600 to-purple-600' : ''
              }`}
              size="sm"
            >
              <span className="capitalize">{role}</span>
              <Badge variant="secondary" className="text-xs">
                {permissions.filter(p => p.role === role && p.permitido).length}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por recurso ou ação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos os níveis</option>
          <option value="básico">Básico</option>
          <option value="avançado">Avançado</option>
          <option value="admin">Administrador</option>
        </select>
      </div>

      {/* Tabela de Permissões */}
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
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Nível</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Restrições</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-900">Ações</th>
            </tr>
          </thead>
          <tbody>
            <StaggerContainer>
              {recursos.filter(recurso => 
                searchTerm === '' || recurso.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((recurso, index) => (
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
                                onChange={e => onToggle(perm.id, e.target.checked)}
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
                    <td className="py-4 px-4 text-center">
                      <Badge variant="outline" className="text-xs">
                        {filteredPermissions.find(p => p.recurso === recurso)?.nivel_acesso || 'Básico'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="text-xs text-gray-500">
                        {filteredPermissions.find(p => p.recurso === recurso)?.restricoes || 'Nenhuma'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </tbody>
        </table>
      </div>
    </MagicCard>
  );
}

// Componente para Gerenciamento de Módulos
export function ModuleManager({ modules, onToggle }: { modules: Module[]; onToggle: (id: string, value: boolean) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredModules = modules.filter(module =>
    (searchTerm === '' || module.nome.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCategory === 'all' || module.categoria === filterCategory)
  );

  return (
    <MagicCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Controle de Módulos do Sistema
          </h3>
          <p className="text-gray-600 mt-1">Ativar/desativar módulos funcionais do sistema</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar módulos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas as categorias</option>
          <option value="core">Core</option>
          <option value="admin">Admin</option>
          <option value="piloto">Piloto</option>
          <option value="agencia">Agência</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              module.ativo 
                ? 'bg-green-50 border-green-200' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{module.nome}</h4>
                <p className="text-sm text-gray-600 mt-1">{module.descricao}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={module.critico ? 'destructive' : 'secondary'} className="text-xs">
                    {module.critico ? 'Crítico' : 'Opcional'}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {module.categoria}
                  </Badge>
                </div>
              </div>
              
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={module.ativo}
                  onChange={(e) => onToggle(module.id, e.target.checked)}
                  disabled={module.critico}
                  className="sr-only"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors ${
                  module.ativo ? 'bg-green-500' : 'bg-gray-300'
                } ${module.critico ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    module.ativo ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </label>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>Versão: {module.versao}</p>
              <p>Atualizado: {new Date(module.atualizado_em).toLocaleDateString('pt-BR')}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </MagicCard>
  );
}

// Componente para Logs de Auditoria
export function AuditLogViewer({ logs }: { logs: AuditLog[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.usuario?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.recurso.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.acao.includes(filterAction);
    
    const matchesDate = dateRange === 'all' || (() => {
      const logDate = new Date(log.data_acao);
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          return logDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return logDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return logDate >= monthAgo;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesAction && matchesDate;
  });

  return (
    <MagicCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            Logs de Auditoria
          </h3>
          <p className="text-gray-600 mt-1">Histórico de ações dos usuários no sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros Avançados
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por usuário, ação ou recurso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todas as ações</option>
          <option value="login">Login</option>
          <option value="permission">Permissões</option>
          <option value="module">Módulos</option>
          <option value="create">Criar</option>
          <option value="update">Atualizar</option>
          <option value="delete">Excluir</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todo o período</option>
          <option value="today">Hoje</option>
          <option value="week">Última semana</option>
          <option value="month">Último mês</option>
        </select>
      </div>

      {/* Tabela de Logs */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Data/Hora</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Usuário</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Ação</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Recurso</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">Detalhes</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-900">IP</th>
            </tr>
          </thead>
          <tbody>
            <StaggerContainer>
              {filteredLogs.map((log, index) => (
                <StaggerItem key={log.id}>
                  <motion.tr 
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                    className="border-b border-gray-100 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm">
                      <div className="text-gray-900">
                        {new Date(log.data_acao).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(log.data_acao).toLocaleTimeString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="font-medium text-gray-900">
                        {log.usuario?.nome || 'Sistema'}
                      </div>
                      <div className="text-gray-500 text-xs">
                        ID: {log.usuario_id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={
                          log.acao.includes('delete') ? 'destructive' : 
                          log.acao.includes('create') ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {log.acao.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {log.recurso}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {log.detalhes}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {log.ip_origem || '-'}
                    </td>
                  </motion.tr>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </tbody>
        </table>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum log encontrado para os filtros aplicados</p>
        </div>
      )}
    </MagicCard>
  );
}

export default {
  PermissionTabs,
  PermissionMatrix,
  ModuleManager,
  AuditLogViewer
};