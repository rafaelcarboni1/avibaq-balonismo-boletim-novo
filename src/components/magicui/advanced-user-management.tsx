/**
 * Advanced User Management Components
 * Sistema avançado para gerenciamento de usuários com Magic UI
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Key, 
  UserCheck, 
  UserCog, 
  Building,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Shield,
  Mail,
  Calendar,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MagicCard } from './magic-card';
import { StaggerContainer, StaggerItem } from './smooth-transitions';
import { NumberTicker } from './number-ticker';

interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
  status?: 'active' | 'inactive' | 'blocked';
}

interface UserManagementProps {
  users: User[];
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onResetPassword: (userId: string) => void;
  loading?: boolean;
}

// Componente para estatísticas de usuários
export function UserStatsCards({ users }: { users: User[] }) {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status !== 'inactive').length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const recentUsers = users.filter(u => {
    const created = new Date(u.created_at);
    const daysSince = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 30;
  }).length;

  const cards = [
    {
      title: 'Total de Usuários',
      value: totalUsers,
      icon: Users,
      color: 'blue' as const,
      description: 'Usuários registrados'
    },
    {
      title: 'Usuários Ativos',
      value: activeUsers,
      icon: UserCheck,
      color: 'green' as const,
      description: 'Usuários ativos no sistema'
    },
    {
      title: 'Administradores',
      value: adminUsers,
      icon: Shield,
      color: 'purple' as const,
      description: 'Usuários com privilégios admin'
    },
    {
      title: 'Novos (30 dias)',
      value: recentUsers,
      icon: UserPlus,
      color: 'yellow' as const,
      description: 'Usuários criados recentemente'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <MagicCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  <NumberTicker value={card.value} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{card.description}</p>
              </div>
              <div className={`
                flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
                ${card.color === 'blue' ? 'bg-blue-500' : 
                  card.color === 'green' ? 'bg-green-500' : 
                  card.color === 'purple' ? 'bg-purple-500' : 
                  'bg-yellow-500'}
              `}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </MagicCard>
        </motion.div>
      ))}
    </div>
  );
}

// Componente para filtros avançados
export function UserFilters({ 
  searchTerm, 
  setSearchTerm, 
  roleFilter, 
  setRoleFilter,
  statusFilter,
  setStatusFilter 
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}) {
  return (
    <MagicCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtros de Usuários</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as funções</option>
          <option value="admin">Administrador</option>
          <option value="meteo">Meteorologia</option>
          <option value="tesouraria">Tesouraria</option>
          <option value="piloto">Piloto</option>
          <option value="agencia">Agência</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="inactive">Inativo</option>
          <option value="blocked">Bloqueado</option>
        </select>
      </div>
    </MagicCard>
  );
}

// Componente para tabela avançada de usuários
export function AdvancedUserTable({ 
  users, 
  onEditUser, 
  onDeleteUser, 
  onResetPassword 
}: {
  users: User[];
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onResetPassword: (userId: string) => void;
}) {
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', color: 'bg-red-100 text-red-800' },
      meteo: { label: 'Meteo', color: 'bg-blue-100 text-blue-800' },
      tesouraria: { label: 'Tesouraria', color: 'bg-green-100 text-green-800' },
      piloto: { label: 'Piloto', color: 'bg-purple-100 text-purple-800' },
      agencia: { label: 'Agência', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || 
                  { label: role, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig = {
      active: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
      blocked: { label: 'Bloqueado', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { label: 'Ativo', color: 'bg-green-100 text-green-800' };
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <MagicCard className="overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Lista de Usuários</h3>
        <p className="text-gray-600 mt-1">Gerencie todos os usuários do sistema</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-6 font-semibold text-gray-900">Usuário</th>
              <th className="text-left py-3 px-6 font-semibold text-gray-900">Função</th>
              <th className="text-left py-3 px-6 font-semibold text-gray-900">Status</th>
              <th className="text-left py-3 px-6 font-semibold text-gray-900">Criado em</th>
              <th className="text-left py-3 px-6 font-semibold text-gray-900">Último Login</th>
              <th className="text-center py-3 px-6 font-semibold text-gray-900">Ações</th>
            </tr>
          </thead>
          <tbody>
            <StaggerContainer>
              {users.map((user, index) => (
                <StaggerItem key={user.id}>
                  <motion.tr 
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                    className="border-b border-gray-100 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.nome ? user.nome.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.nome || 'Nome não informado'}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Activity className="h-3 w-3" />
                        {user.last_login ? 
                          new Date(user.last_login).toLocaleDateString('pt-BR') : 
                          'Nunca'
                        }
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditUser(user)}
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResetPassword(user.id)}
                          className="hover:bg-yellow-50 hover:text-yellow-600"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteUser(user.id)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>
    </MagicCard>
  );
}

// Componente principal de gerenciamento de usuários
export function AdvancedUserManagement(props: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filtrar usuários baseado nos filtros
  const filteredUsers = props.users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Estatísticas */}
      <UserStatsCards users={props.users} />

      {/* Filtros */}
      <UserFilters 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Tabela de usuários */}
      <AdvancedUserTable 
        users={filteredUsers}
        onEditUser={props.onEditUser}
        onDeleteUser={props.onDeleteUser}
        onResetPassword={props.onResetPassword}
      />
    </div>
  );
}

export default {
  UserStatsCards,
  UserFilters,
  AdvancedUserTable,
  AdvancedUserManagement
};