import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { SimpleDashboardLayout } from '../../src/components/SimpleDashboardLayout';
import { Button } from '../../src/components/ui/button';
import { supabase } from '../../src/integrations/supabase/client';
import { useUser } from '../../src/hooks/useUser';
import { useToast } from '../../src/hooks/use-toast';
import { 
  PermissionAuditLog, 
  SystemResource, 
  SystemAction,
  UserRole 
} from '../../src/integrations/supabase/types';

// Tipo local para permissões de usuário
interface UserPermission {
  id: number;
  user_id: string;
  recurso: string;
  acao: string;
  permitido: boolean;
  nivel_acesso?: string;
  restricoes?: any;
  data_expiracao?: string;
  created_at: string;
}
import { 
  UserIcon, 
  ShieldCheckIcon, 
  PlusIcon, 
  TrashIcon,
  ClockIcon,
  EyeIcon 
} from '@heroicons/react/24/solid';

interface User {
  id: string;
  email: string;
  nome: string;
  role: UserRole;
}

interface Permission {
  recurso: string;
  acao: string;
  permitido: boolean;
  fonte: 'role' | 'user_specific';
}

interface UserPermissionManager {
  user: User;
  rolePermissions: Permission[];
  userPermissions: UserPermission[];
  combinedPermissions: Permission[];
}

const RECURSOS_DISPONIVEIS: SystemResource[] = [
  'voos', 'baloes', 'boletins', 'associados', 'usuarios', 
  'permissoes', 'dashboard', 'relatorios', 'configuracoes'
];

const ACOES_DISPONIVEIS: SystemAction[] = [
  'create', 'read', 'update', 'delete', 'approve', 
  'export', 'manage', 'view_all', 'view_own'
];

export default function PermissoesUsuarios() {
  const router = useRouter();
  const { user: currentUser, role, loading: userLoading } = useUser();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissionManager | null>(null);
  const [auditLogs, setAuditLogs] = useState<PermissionAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [newPermission, setNewPermission] = useState({
    recurso: '',
    acao: '',
    permitido: true,
    nivel_acesso: 'basico',
    data_expiracao: ''
  });

  // Carregar usuários
  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, nome, role')
        .neq('role', 'admin') // Não mostrar outros admins
        .order('nome');

      if (error) throw error;
      
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    if (role === 'admin') {
      loadUsers();
    }
  }, [role, loadUsers]);

  // Carregar permissões de um usuário específico
  const loadUserPermissions = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      // Buscar permissões combinadas
      const { data: combinedData, error: combinedError } = await supabase
        .rpc('get_user_combined_permissions', { p_user_id: userId });

      if (combinedError) throw combinedError;

      // Buscar permissões específicas do usuário
      const { data: userSpecific, error: userError } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .order('recurso, acao');

      if (userError) throw userError;

      // Buscar logs de auditoria
      const { data: logs, error: logsError } = await supabase
        .from('permission_audit_log')
        .select('*')
        .eq('target_user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (logsError) throw logsError;

      // Organizar dados
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const rolePermissions = combinedData?.filter(p => p.fonte === 'role') || [];
      const userPermissions = userSpecific || [];
      const combinedPermissions = combinedData || [];

      setUserPermissions({
        user,
        rolePermissions,
        userPermissions,
        combinedPermissions
      });

      setAuditLogs(logs || []);

    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar permissões do usuário",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [users, toast]);

  // Adicionar permissão específica
  const addUserPermission = useCallback(async () => {
    if (!selectedUser || !newPermission.recurso || !newPermission.acao) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      const permissionData = {
        user_id: selectedUser.id,
        recurso: newPermission.recurso,
        acao: newPermission.acao,
        permitido: newPermission.permitido,
        nivel_acesso: newPermission.nivel_acesso,
        concedido_por: currentUser?.id,
        data_expiracao: newPermission.data_expiracao || null
      };

      const { error } = await supabase
        .from('user_permissions')
        .insert([permissionData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Permissão ${newPermission.permitido ? 'concedida' : 'negada'} com sucesso`,
      });

      // Recarregar permissões
      await loadUserPermissions(selectedUser.id);
      
      // Limpar formulário
      setNewPermission({
        recurso: '',
        acao: '',
        permitido: true,
        nivel_acesso: 'basico',
        data_expiracao: ''
      });
      setShowAddPermission(false);

    } catch (error) {
      console.error('Erro ao adicionar permissão:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar permissão",
        variant: "destructive"
      });
    }
  }, [selectedUser, newPermission, currentUser?.id, toast, loadUserPermissions]);

  // Remover permissão específica
  const removeUserPermission = useCallback(async (permissionId: number) => {
    if (!confirm('Tem certeza que deseja remover esta permissão?')) return;

    try {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissão removida com sucesso",
      });

      // Recarregar permissões
      if (selectedUser) {
        await loadUserPermissions(selectedUser.id);
      }

    } catch (error) {
      console.error('Erro ao remover permissão:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover permissão",
        variant: "destructive"
      });
    }
  }, [selectedUser, loadUserPermissions, toast]);

  // Verificações de segurança
  if (userLoading) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-gray-500 mt-2">Carregando...</p>
      </div>
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
    <SimpleDashboardLayout title="Gerenciar Permissões por Usuário">
      <div className="space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
                Permissões por Usuário
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie permissões específicas para usuários individuais
              </p>
            </div>
            <Button
              onClick={() => router.push('/admin/permissoes')}
              variant="outline"
            >
              Gerenciar por Role
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Lista de Usuários */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Selecionar Usuário
            </h2>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUser(user);
                    loadUserPermissions(user.id);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedUser?.id === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{user.nome || user.email}</div>
                  <div className="text-sm text-gray-500">
                    {user.role} • {user.email}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Permissões do Usuário */}
          <div className="lg:col-span-2 space-y-6">
            
            {selectedUser ? (
              <>
                {/* Info do Usuário */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">
                        Permissões de {selectedUser.nome || selectedUser.email}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Role: <span className="font-medium">{selectedUser.role}</span>
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowAddPermission(true)}
                      className="flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Adicionar Permissão
                    </Button>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-gray-500 mt-2">Carregando permissões...</p>
                    </div>
                  ) : userPermissions ? (
                    
                    <div className="space-y-6">
                      
                      {/* Permissões Herdadas do Role */}
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">
                          Permissões Herdadas do Role ({userPermissions.rolePermissions.length})
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {userPermissions.rolePermissions.map((perm, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded text-sm ${
                                perm.permitido 
                                  ? 'bg-green-50 text-green-800 border border-green-200'
                                  : 'bg-red-50 text-red-800 border border-red-200'
                              }`}
                            >
                              {perm.permitido ? '✓' : '✗'} {perm.recurso}.{perm.acao}
                              <span className="text-xs opacity-75 ml-1">(role)</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Permissões Específicas do Usuário */}
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">
                          Permissões Específicas ({userPermissions.userPermissions.length})
                        </h3>
                        
                        {userPermissions.userPermissions.length > 0 ? (
                          <div className="space-y-2">
                            {userPermissions.userPermissions.map((perm) => (
                              <div
                                key={perm.id}
                                className={`p-3 rounded-lg border flex items-center justify-between ${
                                  perm.permitido 
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-yellow-50 border-yellow-200'
                                }`}
                              >
                                <div>
                                  <div className="font-medium">
                                    {perm.permitido ? '✓' : '✗'} {perm.recurso}.{perm.acao}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Nível: {perm.nivel_acesso} • 
                                    Concedido em: {new Date(perm.concedido_em).toLocaleDateString()}
                                    {perm.data_expiracao && (
                                      <> • Expira: {new Date(perm.data_expiracao).toLocaleDateString()}</>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => removeUserPermission(perm.id)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            Nenhuma permissão específica configurada.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Histórico de Mudanças */}
                {auditLogs.length > 0 && (
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <ClockIcon className="h-5 w-5" />
                      Histórico de Mudanças
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">
                              {log.action === 'grant' ? 'Concedeu' : 
                               log.action === 'revoke' ? 'Revogou' : 'Modificou'} 
                              {log.recurso && log.acao && ` ${log.recurso}.${log.acao}`}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </>
            ) : (
              <div className="bg-white p-12 rounded-lg shadow text-center">
                <EyeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Selecione um usuário
                </h3>
                <p className="text-gray-500">
                  Escolha um usuário na lista ao lado para gerenciar suas permissões.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal para Adicionar Permissão */}
        {showAddPermission && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Adicionar Permissão</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Recurso</label>
                  <select
                    value={newPermission.recurso}
                    onChange={(e) => setNewPermission({...newPermission, recurso: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Selecione...</option>
                    {RECURSOS_DISPONIVEIS.map(recurso => (
                      <option key={recurso} value={recurso}>{recurso}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Ação</label>
                  <select
                    value={newPermission.acao}
                    onChange={(e) => setNewPermission({...newPermission, acao: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">Selecione...</option>
                    {ACOES_DISPONIVEIS.map(acao => (
                      <option key={acao} value={acao}>{acao}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={newPermission.permitido.toString()}
                    onChange={(e) => setNewPermission({...newPermission, permitido: e.target.value === 'true'})}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="true">Permitir</option>
                    <option value="false">Negar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Data de Expiração (opcional)</label>
                  <input
                    type="date"
                    value={newPermission.data_expiracao}
                    onChange={(e) => setNewPermission({...newPermission, data_expiracao: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={addUserPermission} className="flex-1">
                  Salvar
                </Button>
                <Button
                  onClick={() => setShowAddPermission(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SimpleDashboardLayout>
  );
}