import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useUser } from './useUser';

/**
 * Hook usePermissions CORRIGIDO
 * 
 * MUDANÇAS PRINCIPAIS:
 * 1. Usa users_table_id corretamente para buscar permissões
 * 2. Melhor tratamento de usuários órfãos
 * 3. Fallback inteligente para admins
 * 4. Cache mais eficiente
 * 5. Logs detalhados para debug
 * 6. Tratamento de erros robusto
 */

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
  
  // NOVOS: Métodos utilitários
  isOrphaned: boolean;
  hasCompleteProfile: boolean;
}

// Cache em memória para otimização - MELHORADO
interface PermissionsCache {
  [userId: string]: {
    permissions: Permission[];
    timestamp: number;
    ttl: number;
    userRole: string; // Cache do role também
  };
}

const permissionsCache: PermissionsCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export function usePermissions(): UsePermissionsReturn {
  const { user, loading: userLoading } = useUser();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detectar se usuário é órfão ou não tem perfil completo
  const isOrphaned = useMemo(() => user?._isOrphaned === true, [user]);
  const hasCompleteProfile = useMemo(() => !!user?.users_table_id, [user]);

  // Função para buscar permissões do usuário - CORRIGIDA
  const fetchPermissions = useCallback(async (userId: string): Promise<Permission[]> => {
    try {
      console.log('[usePermissions] Buscando permissões para usuário:', userId);
      console.log('[usePermissions] User object:', { 
        id: user?.id, 
        users_table_id: user?.users_table_id, 
        role: user?.role,
        isOrphaned,
        hasCompleteProfile
      });
      
      // Verificar cache primeiro
      const cached = permissionsCache[userId];
      if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
        console.log('[usePermissions] Retornando permissões do cache');
        return cached.permissions;
      }

      // CORREÇÃO CRÍTICA: Determinar ID correto para buscar permissões
      const finalUserId = user?.users_table_id || userId;
      
      // Se usuário é órfão, retornar permissões vazias (apenas admin check direto)
      if (isOrphaned || !hasCompleteProfile) {
        console.warn('[usePermissions] Usuário órfão ou sem perfil completo, retornando permissões limitadas');
        
        // Para usuários órfãos, dar permissões básicas baseadas no role se disponível
        if (user?.role === 'admin' || user?.role === 'meteo' || user?.role === 'tesouraria') {
          const adminPermissions: Permission[] = [
            { recurso: 'dashboard', acao: 'read', permitido: true, fonte: 'role' },
            { recurso: 'usuarios', acao: 'manage', permitido: true, fonte: 'role' },
            { recurso: 'boletins', acao: 'manage', permitido: true, fonte: 'role' },
            { recurso: 'voos', acao: 'view_all', permitido: true, fonte: 'role' },
            { recurso: 'associados', acao: 'manage', permitido: true, fonte: 'role' }
          ];
          return adminPermissions;
        } else {
          return []; // Usuário órfão sem role definido
        }
      }

      console.log('[usePermissions] Buscando permissões com ID:', finalUserId, 'original:', userId);
      
      // Tentar primeira função, se falhar usar alternativa
      let data, error;
      try {
        const result = await supabase.rpc('get_user_combined_permissions', {
          p_user_id: finalUserId
        });
        data = result.data;
        error = result.error;
        
        console.log('[usePermissions] Resultado RPC principal:', { data: data?.length, error });
      } catch (firstError) {
        console.log('[usePermissions] Tentando função alternativa...', firstError);
        try {
          const result = await supabase.rpc('get_combined_user_permissions_v2', {
            p_user_id: finalUserId
          });
          data = result.data;
          error = result.error;
          console.log('[usePermissions] Resultado RPC alternativa:', { data: data?.length, error });
        } catch (secondError) {
          console.error('[usePermissions] Ambas as funções RPC falharam:', secondError);
          throw secondError;
        }
      }

      if (error) {
        console.error('[usePermissions] Erro ao buscar permissões:', error);
        throw error;
      }

      const userPermissions: Permission[] = data || [];
      
      // Se não conseguiu buscar permissões mas usuário é admin, dar permissões administrativas
      if (userPermissions.length === 0 && (user?.role === 'admin' || user?.role === 'meteo' || user?.role === 'tesouraria')) {
        console.log('[usePermissions] Aplicando fallback de permissões administrativas');
        const fallbackAdminPermissions: Permission[] = [
          { recurso: 'dashboard', acao: 'read', permitido: true, fonte: 'role' },
          { recurso: 'usuarios', acao: 'manage', permitido: true, fonte: 'role' },
          { recurso: 'boletins', acao: 'manage', permitido: true, fonte: 'role' },
          { recurso: 'voos', acao: 'view_all', permitido: true, fonte: 'role' },
          { recurso: 'associados', acao: 'manage', permitido: true, fonte: 'role' },
          { recurso: 'permissoes', acao: 'manage', permitido: true, fonte: 'role' },
          { recurso: 'relatorios', acao: 'view_all', permitido: true, fonte: 'role' },
          { recurso: 'configuracoes', acao: 'manage', permitido: true, fonte: 'role' }
        ];
        
        // Atualizar cache
        permissionsCache[userId] = {
          permissions: fallbackAdminPermissions,
          timestamp: Date.now(),
          ttl: CACHE_TTL,
          userRole: user.role
        };
        
        return fallbackAdminPermissions;
      }
      
      // Atualizar cache
      permissionsCache[userId] = {
        permissions: userPermissions,
        timestamp: Date.now(),
        ttl: CACHE_TTL,
        userRole: user?.role || 'unknown'
      };

      console.log('[usePermissions] Permissões carregadas:', {
        total: userPermissions.length,
        rolePermissions: userPermissions.filter(p => p.fonte === 'role').length,
        userSpecificPermissions: userPermissions.filter(p => p.fonte === 'user_specific').length,
        recursos: Array.from(new Set(userPermissions.map(p => p.recurso))),
        sample: userPermissions.slice(0, 3)
      });

      return userPermissions;
    } catch (err) {
      console.error('[usePermissions] Erro ao buscar permissões:', err);
      throw err;
    }
  }, [user, isOrphaned, hasCompleteProfile]);

  // Carregar permissões quando usuário muda - MELHORADO
  useEffect(() => {
    let isMounted = true;

    const loadPermissions = async () => {
      if (userLoading) {
        console.log('[usePermissions] Aguardando carregamento do usuário...');
        return;
      }
      
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
        
        console.log('[usePermissions] Iniciando carregamento de permissões para:', user.email);
        
        // CORREÇÃO: Usar users_table_id se disponível, senão usar auth id
        const permissionsUserId = user.users_table_id || user.id;
        const userPermissions = await fetchPermissions(permissionsUserId);
        
        if (isMounted) {
          setPermissions(userPermissions);
          console.log('[usePermissions] ✅ Permissões carregadas com sucesso:', userPermissions.length);
        }
      } catch (err) {
        console.error('[usePermissions] ❌ Erro ao carregar permissões:', err);
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
  }, [user?.id, user?.users_table_id, userLoading, fetchPermissions]);

  // Função principal para verificar uma permissão específica - MELHORADA
  const hasPermission = useCallback((recurso: string, acao: string): boolean => {
    if (!user?.id) {
      console.log(`[usePermissions] ❌ ${recurso}.${acao}: Usuário não logado`);
      return false;
    }

    // FALLBACK CRÍTICO: Admins têm acesso total mesmo se permissões não carregaram
    if (user.role === 'admin' || user.role === 'meteo' || user.role === 'tesouraria') {
      console.log(`[usePermissions] ✅ ${recurso}.${acao}: Acesso admin concedido (role: ${user.role})`);
      return true;
    }

    // Se usuário órfão mas não é admin, negar acesso
    if (isOrphaned || !hasCompleteProfile) {
      console.log(`[usePermissions] ❌ ${recurso}.${acao}: Usuário órfão ou sem perfil completo`);
      return false;
    }

    if (permissions.length === 0) {
      console.log(`[usePermissions] ❌ ${recurso}.${acao}: Nenhuma permissão carregada`);
      return false;
    }

    // Buscar permissão específica
    const permission = permissions.find(p => 
      p.recurso === recurso && 
      p.acao === acao
    );

    const result = permission?.permitido || false;
    
    console.log(`[usePermissions] ${result ? '✅' : '❌'} ${recurso}.${acao}:`, {
      found: !!permission,
      permitido: permission?.permitido,
      fonte: permission?.fonte,
      result
    });

    return result;
  }, [user, permissions, isOrphaned, hasCompleteProfile]);

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

  // Função para forçar refresh das permissões - MELHORADA
  const refreshPermissions = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    try {
      console.log('[usePermissions] Forçando refresh das permissões');
      
      // Limpar cache para todos os IDs possíveis
      delete permissionsCache[user.id];
      if (user.users_table_id) {
        delete permissionsCache[user.users_table_id];
      }
      
      setLoading(true);
      setError(null);
      
      const permissionsUserId = user.users_table_id || user.id;
      const userPermissions = await fetchPermissions(permissionsUserId);
      setPermissions(userPermissions);
      
      console.log('[usePermissions] ✅ Refresh concluído');
    } catch (err) {
      console.error('[usePermissions] ❌ Erro no refresh:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar permissões');
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.users_table_id, fetchPermissions]);

  // Função para limpar cache - MELHORADA
  const clearCache = useCallback((): void => {
    if (user?.id) {
      console.log('[usePermissions] Limpando cache de permissões');
      
      // Limpar cache usando ambos IDs para garantir
      delete permissionsCache[user.id];
      if (user.users_table_id) {
        delete permissionsCache[user.users_table_id];
      }
    }
  }, [user?.id, user?.users_table_id]);

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
    clearCache,
    isOrphaned,
    hasCompleteProfile
  };
}

// Hook para contextos específicos (opcional) - SEM ALTERAÇÕES
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

// Utilitário para debug (apenas em desenvolvimento) - MELHORADO
export function usePermissionsDebug() {
  const { permissions, loading, error, isOrphaned, hasCompleteProfile } = usePermissions();
  const { user } = useUser();
  
  return useMemo(() => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return {
      user: user ? { 
        id: user.id, 
        users_table_id: user.users_table_id,
        role: user.role, 
        email: user.email,
        isOrphaned,
        hasCompleteProfile
      } : null,
      permissionsCount: permissions.length,
      loading,
      error,
      isOrphaned,
      hasCompleteProfile,
      permissions: permissions.map(p => ({
        resource: p.recurso,
        action: p.acao,
        allowed: p.permitido,
        source: p.fonte
      })),
      cacheStatus: Object.keys(permissionsCache).map(key => ({
        userId: key,
        timestamp: new Date(permissionsCache[key].timestamp).toISOString(),
        age: Date.now() - permissionsCache[key].timestamp,
        userRole: permissionsCache[key].userRole,
        permissionsCount: permissionsCache[key].permissions.length
      }))
    };
  }, [permissions, loading, error, user, isOrphaned, hasCompleteProfile]);
}