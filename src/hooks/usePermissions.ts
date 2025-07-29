import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useUser } from './useUser';

// Local type definitions
interface Permission {
  recurso: string;
  acao: string;
  permitido: boolean;
  fonte: 'role' | 'user_specific';
}

interface PermissionCheck {
  recurso: string;
  acao: string;
}

type SystemResource = 'usuarios' | 'boletins' | 'associados' | 'voos' | 'baloes' | 'permissoes' | 'dashboard' | 'relatorios' | 'configuracoes';
type SystemAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view_all' | 'view_own' | 'approve' | 'export';

interface UsePermissionsReturn {
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  
  // Funções de verificação
  hasPermission: (recurso: string, acao: string) => boolean;
  hasAnyPermission: (checks: PermissionCheck[]) => boolean;
  hasAllPermissions: (checks: PermissionCheck[]) => boolean;
  
  // Funções de conveniência para recursos comuns
  canCreate: (recurso: SystemResource) => boolean;
  canRead: (recurso: SystemResource) => boolean;
  canUpdate: (recurso: SystemResource) => boolean;
  canDelete: (recurso: SystemResource) => boolean;
  canManage: (recurso: SystemResource) => boolean;
  
  // Controle de cache
  refreshPermissions: () => Promise<void>;
  clearCache: () => void;
}

// Cache em memória para otimização
interface PermissionsCache {
  [userId: string]: {
    permissions: Permission[];
    timestamp: number;
    ttl: number; // Time to live em ms
  };
}

const permissionsCache: PermissionsCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function usePermissions(): UsePermissionsReturn {
  const { user, loading: userLoading } = useUser();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar permissões do usuário
  const fetchPermissions = useCallback(async (userId: string): Promise<Permission[]> => {
    try {
      console.log('[usePermissions] Buscando permissões para usuário:', userId);
      
      // Verificar cache primeiro
      const cached = permissionsCache[userId];
      if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
        console.log('[usePermissions] Retornando permissões do cache');
        return cached.permissions;
      }

      // Buscar permissões combinadas (role + específicas do usuário)
      const { data, error } = await supabase.rpc('get_user_combined_permissions', {
        p_user_id: userId
      });

      if (error) {
        console.error('[usePermissions] Erro ao buscar permissões:', error);
        throw error;
      }

      const userPermissions: Permission[] = data || [];
      
      // Atualizar cache
      permissionsCache[userId] = {
        permissions: userPermissions,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      };

      console.log('[usePermissions] Permissões carregadas:', {
        total: userPermissions.length,
        rolePermissions: userPermissions.filter(p => p.fonte === 'role').length,
        userSpecificPermissions: userPermissions.filter(p => p.fonte === 'user_specific').length
      });

      return userPermissions;
    } catch (err) {
      console.error('[usePermissions] Erro ao buscar permissões:', err);
      throw err;
    }
  }, []);

  // Carregar permissões quando usuário muda
  useEffect(() => {
    let isMounted = true;

    const loadPermissions = async () => {
      if (userLoading) return;
      
      if (!user?.id) {
        console.log('[usePermissions] Usuário não autenticado, limpando permissões');
        setPermissions([]);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userPermissions = await fetchPermissions(user.id);
        
        if (isMounted) {
          setPermissions(userPermissions);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar permissões');
          setPermissions([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPermissions();

    return () => {
      isMounted = false;
    };
  }, [user?.id, userLoading, fetchPermissions]);

  // Função principal para verificar uma permissão específica
  const hasPermission = useCallback((recurso: string, acao: string): boolean => {
    if (!user?.id || permissions.length === 0) {
      return false;
    }

    // Admins têm acesso total (fallback de segurança)
    if (user.role === 'admin') {
      return true;
    }

    // Buscar permissão específica
    const permission = permissions.find(p => 
      p.recurso === recurso && 
      p.acao === acao
    );

    const result = permission?.permitido || false;
    
    console.log(`[usePermissions] Verificando ${recurso}.${acao}:`, {
      found: !!permission,
      permitido: permission?.permitido,
      fonte: permission?.fonte,
      result
    });

    return result;
  }, [user, permissions]);

  // Verificar se tem qualquer uma das permissões (OR)
  const hasAnyPermission = useCallback((checks: PermissionCheck[]): boolean => {
    return checks.some(check => hasPermission(check.recurso, check.acao));
  }, [hasPermission]);

  // Verificar se tem todas as permissões (AND)
  const hasAllPermissions = useCallback((checks: PermissionCheck[]): boolean => {
    return checks.every(check => hasPermission(check.recurso, check.acao));
  }, [hasPermission]);

  // Funções de conveniência para ações comuns
  const canCreate = useCallback((recurso: SystemResource): boolean => {
    return hasPermission(recurso, 'create');
  }, [hasPermission]);

  const canRead = useCallback((recurso: SystemResource): boolean => {
    return hasPermission(recurso, 'read');
  }, [hasPermission]);

  const canUpdate = useCallback((recurso: SystemResource): boolean => {
    return hasPermission(recurso, 'update');
  }, [hasPermission]);

  const canDelete = useCallback((recurso: SystemResource): boolean => {
    return hasPermission(recurso, 'delete');
  }, [hasPermission]);

  const canManage = useCallback((recurso: SystemResource): boolean => {
    return hasPermission(recurso, 'manage');
  }, [hasPermission]);

  // Função para forçar refresh das permissões
  const refreshPermissions = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    try {
      console.log('[usePermissions] Forçando refresh das permissões');
      
      // Limpar cache
      delete permissionsCache[user.id];
      
      setLoading(true);
      setError(null);
      
      const userPermissions = await fetchPermissions(user.id);
      setPermissions(userPermissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar permissões');
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchPermissions]);

  // Função para limpar cache
  const clearCache = useCallback((): void => {
    if (user?.id) {
      delete permissionsCache[user.id];
    }
  }, [user?.id]);

  // Estatísticas das permissões (para debug)
  const permissionStats = useMemo(() => {
    if (permissions.length === 0) return null;

    const stats = {
      total: permissions.length,
      granted: permissions.filter(p => p.permitido).length,
      denied: permissions.filter(p => !p.permitido).length,
      fromRole: permissions.filter(p => p.fonte === 'role').length,
      fromUser: permissions.filter(p => p.fonte === 'user_specific').length,
      recursos: Array.from(new Set(permissions.map(p => p.recurso))).sort(),
      acoes: Array.from(new Set(permissions.map(p => p.acao))).sort()
    };

    console.log('[usePermissions] Estatísticas das permissões:', stats);
    return stats;
  }, [permissions]);

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
    refreshPermissions,
    clearCache
  };
}

// Hook para contextos específicos (opcional)
export function useResourcePermissions(recurso: SystemResource) {
  const { hasPermission, canCreate, canRead, canUpdate, canDelete, canManage } = usePermissions();
  
  return useMemo(() => ({
    canCreate: canCreate(recurso),
    canRead: canRead(recurso),
    canUpdate: canUpdate(recurso),
    canDelete: canDelete(recurso),
    canManage: canManage(recurso),
    hasPermission: (acao: SystemAction) => hasPermission(recurso, acao)
  }), [recurso, hasPermission, canCreate, canRead, canUpdate, canDelete, canManage]);
}

// Utilitário para debug (apenas em desenvolvimento)
export function usePermissionsDebug() {
  const { permissions, loading, error } = usePermissions();
  const { user } = useUser();
  
  return useMemo(() => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return {
      user: user ? { id: user.id, role: user.role, email: user.email } : null,
      permissionsCount: permissions.length,
      loading,
      error,
      permissions: permissions.map(p => ({
        resource: p.recurso,
        action: p.acao,
        allowed: p.permitido,
        source: p.fonte
      }))
    };
  }, [permissions, loading, error, user]);
}