import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

// Local type definitions
interface PermissionCheck {
  recurso: string;
  acao: string;
}

type SystemResource = 'usuarios' | 'boletins' | 'associados' | 'voos' | 'baloes' | 'permissoes' | 'dashboard' | 'relatorios' | 'configuracoes';
type SystemAction = 'create' | 'read' | 'update' | 'delete' | 'manage' | 'view_all' | 'view_own' | 'approve' | 'export';

interface PermissionGuardProps {
  children: React.ReactNode;
  
  // Formas de verificar permissões
  recurso?: string;
  acao?: string;
  permissions?: PermissionCheck[];
  
  // Comportamento lógico
  mode?: 'any' | 'all'; // Para múltiplas permissões: OR ou AND
  
  // Estados e fallbacks
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  
  // Controles adicionais
  disabled?: boolean;
  showWhenDisabled?: boolean;
  
  // Debug
  debug?: boolean;
}

interface ConveniencePermissionGuardProps {
  children: React.ReactNode;
  recurso: SystemResource;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  debug?: boolean;
}

/**
 * Componente principal para controle de acesso baseado em permissões
 * 
 * Exemplos de uso:
 * 
 * // Verificação simples
 * <PermissionGuard recurso="voos" acao="create">
 *   <Button>Criar Voo</Button>
 * </PermissionGuard>
 * 
 * // Múltiplas permissões (OR)
 * <PermissionGuard 
 *   permissions={[
 *     { recurso: 'voos', acao: 'create' },
 *     { recurso: 'voos', acao: 'manage' }
 *   ]}
 *   mode="any"
 * >
 *   <VoosSection />
 * </PermissionGuard>
 * 
 * // Com fallback customizado
 * <PermissionGuard 
 *   recurso="associados" 
 *   acao="manage"
 *   fallback={<div>Você não tem acesso a esta seção</div>}
 * >
 *   <AssociadosPanel />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  recurso,
  acao,
  permissions,
  mode = 'any',
  fallback = null,
  loadingFallback = null,
  errorFallback = null,
  disabled = false,
  showWhenDisabled = false,
  debug = false
}: PermissionGuardProps) {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    loading, 
    error 
  } = usePermissions();

  // Se estiver desabilitado
  if (disabled) {
    return showWhenDisabled ? <>{children}</> : <>{fallback}</>;
  }

  // Estado de loading
  if (loading) {
    if (debug) {
      console.log('[PermissionGuard] Loading permissions...');
    }
    return loadingFallback ? <>{loadingFallback}</> : <>{fallback}</>;
  }

  // Estado de erro
  if (error) {
    if (debug) {
      console.error('[PermissionGuard] Error loading permissions:', error);
    }
    return errorFallback ? <>{errorFallback}</> : <>{fallback}</>;
  }

  // Determinar se tem permissão
  let hasAccess = false;

  if (recurso && acao) {
    // Verificação simples
    hasAccess = hasPermission(recurso, acao);
    
    if (debug) {
      console.log(`[PermissionGuard] Checking ${recurso}.${acao}:`, hasAccess);
    }
  } else if (permissions && permissions.length > 0) {
    // Verificação múltipla
    hasAccess = mode === 'all' 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (debug) {
      console.log(`[PermissionGuard] Checking multiple permissions (${mode}):`, {
        permissions,
        result: hasAccess
      });
    }
  } else {
    // Sem critérios definidos, negar acesso por segurança
    console.warn('[PermissionGuard] Nenhum critério de permissão definido');
    hasAccess = false;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Componente de conveniência para verificar se pode CRIAR um recurso
 */
export function CanCreate({ 
  children, 
  recurso, 
  fallback = null, 
  loadingFallback = null,
  debug = false 
}: ConveniencePermissionGuardProps) {
  return (
    <PermissionGuard 
      recurso={recurso} 
      acao="create" 
      fallback={fallback}
      loadingFallback={loadingFallback}
      debug={debug}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Componente de conveniência para verificar se pode LER um recurso
 */
export function CanRead({ 
  children, 
  recurso, 
  fallback = null, 
  loadingFallback = null,
  debug = false 
}: ConveniencePermissionGuardProps) {
  return (
    <PermissionGuard 
      recurso={recurso} 
      acao="read" 
      fallback={fallback}
      loadingFallback={loadingFallback}
      debug={debug}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Componente de conveniência para verificar se pode EDITAR um recurso
 */
export function CanUpdate({ 
  children, 
  recurso, 
  fallback = null, 
  loadingFallback = null,
  debug = false 
}: ConveniencePermissionGuardProps) {
  return (
    <PermissionGuard 
      recurso={recurso} 
      acao="update" 
      fallback={fallback}
      loadingFallback={loadingFallback}
      debug={debug}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Componente de conveniência para verificar se pode DELETAR um recurso
 */
export function CanDelete({ 
  children, 
  recurso, 
  fallback = null, 
  loadingFallback = null,
  debug = false 
}: ConveniencePermissionGuardProps) {
  return (
    <PermissionGuard 
      recurso={recurso} 
      acao="delete" 
      fallback={fallback}
      loadingFallback={loadingFallback}
      debug={debug}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Componente de conveniência para verificar se pode GERENCIAR um recurso
 */
export function CanManage({ 
  children, 
  recurso, 
  fallback = null, 
  loadingFallback = null,
  debug = false 
}: ConveniencePermissionGuardProps) {
  return (
    <PermissionGuard 
      recurso={recurso} 
      acao="manage" 
      fallback={fallback}
      loadingFallback={loadingFallback}
      debug={debug}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * HOC (Higher Order Component) para proteger páginas inteiras
 */
export function withPermissionGuard<P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: {
    recurso?: string;
    acao?: string;
    permissions?: PermissionCheck[];
    mode?: 'any' | 'all';
    fallback?: React.ReactNode;
    loadingFallback?: React.ReactNode;
  }
) {
  return function PermissionProtectedComponent(props: P) {
    const unauthorizedFallback = permissionConfig.fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );

    const loadingComponent = permissionConfig.loadingFallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );

    return (
      <PermissionGuard
        recurso={permissionConfig.recurso}
        acao={permissionConfig.acao}
        permissions={permissionConfig.permissions}
        mode={permissionConfig.mode}
        fallback={unauthorizedFallback}
        loadingFallback={loadingComponent}
      >
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * Hook para usar em casos onde um componente é mais apropriado
 */
export function usePermissionGuard(
  recurso: string, 
  acao: string
): {
  allowed: boolean;
  loading: boolean;
  error: string | null;
} {
  const { hasPermission, loading, error } = usePermissions();
  
  return {
    allowed: hasPermission(recurso, acao),
    loading,
    error
  };
}

// Componente de debug para desenvolvimento
export function PermissionDebugPanel() {
  const { permissions, loading, error } = usePermissions();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">Debug: Permissões</h3>
      
      {loading && <p className="text-blue-600 text-xs">Carregando...</p>}
      {error && <p className="text-red-600 text-xs">Erro: {error}</p>}
      
      {permissions.length > 0 && (
        <div className="text-xs">
          <p className="mb-1">Total: {permissions.length}</p>
          <div className="max-h-32 overflow-y-auto">
            {permissions.filter(p => p.permitido).map((perm, idx) => (
              <div key={idx} className="text-green-600">
                ✓ {perm.recurso}.{perm.acao} ({perm.fonte})
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}