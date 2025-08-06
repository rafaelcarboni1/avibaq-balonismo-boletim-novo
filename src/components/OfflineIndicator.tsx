import React, { useState } from 'react';
import { 
  WifiIcon, 
  CloudIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useOfflineSync } from '../hooks/useOfflineSync';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export default function OfflineIndicator({ showDetails = false, className = '' }: OfflineIndicatorProps) {
  const { 
    isOnline, 
    isSyncing, 
    offlineStats, 
    lastSyncTime, 
    syncPendingItems 
  } = useOfflineSync();
  
  const [showTooltip, setShowTooltip] = useState(false);
  
  const hasOfflineData = offlineStats.pendentes > 0 || offlineStats.com_erro > 0 || offlineStats.conflitos > 0;
  
  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (isSyncing) return 'text-yellow-500';
    if (hasOfflineData) return 'text-orange-500';
    return 'text-green-500';
  };
  
  const getStatusIcon = () => {
    if (!isOnline) return <WifiIcon className="h-5 w-5" />;
    if (isSyncing) return <ArrowPathIcon className="h-5 w-5 animate-spin" />;
    if (hasOfflineData) return <CloudIcon className="h-5 w-5" />;
    return <CheckCircleIcon className="h-5 w-5" />;
  };
  
  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Sincronizando...';
    if (hasOfflineData) return `${offlineStats.pendentes} pendentes`;
    return 'Online';
  };
  
  const handleSyncClick = () => {
    if (isOnline && !isSyncing) {
      syncPendingItems();
    }
  };
  
  if (!showDetails) {
    return (
      <div 
        className={`relative flex items-center gap-2 ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className={`${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        
        {showTooltip && (
          <div className="absolute bottom-full left-0 mb-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
            <div className="space-y-1">
              <div>Status: {isOnline ? 'Online' : 'Offline'}</div>
              {hasOfflineData && (
                <>
                  <div>Pendentes: {offlineStats.pendentes}</div>
                  <div>Erros: {offlineStats.com_erro}</div>
                  <div>Conflitos: {offlineStats.conflitos}</div>
                </>
              )}
              {lastSyncTime && (
                <div>Última sync: {lastSyncTime.toLocaleTimeString()}</div>
              )}
            </div>
            <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Status de Sincronização</h3>
        <div className={`flex items-center gap-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </div>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{offlineStats.total_itens}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{offlineStats.pendentes}</div>
          <div className="text-sm text-gray-600">Pendentes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{offlineStats.sincronizados}</div>
          <div className="text-sm text-gray-600">Sincronizados</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{offlineStats.com_erro}</div>
          <div className="text-sm text-gray-600">Com Erro</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{offlineStats.conflitos}</div>
          <div className="text-sm text-gray-600">Conflitos</div>
        </div>
      </div>
      
      {/* Indicadores de status */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm">
            {isOnline ? 'Conectado à internet' : 'Sem conexão com a internet'}
          </span>
        </div>
        
        {hasOfflineData && (
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-700">
              Existem dados não sincronizados
            </span>
          </div>
        )}
        
        {isSyncing && (
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 text-blue-500 animate-spin" />
            <span className="text-sm text-blue-700">
              Sincronizando dados...
            </span>
          </div>
        )}
        
        {lastSyncTime && (
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">
              Última sincronização: {lastSyncTime.toLocaleString('pt-BR')}
            </span>
          </div>
        )}
      </div>
      
      {/* Ações */}
      <div className="flex gap-2">
        <button
          onClick={handleSyncClick}
          disabled={!isOnline || isSyncing}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
        </button>
        
        {offlineStats.conflitos > 0 && (
          <button
            onClick={() => window.location.href = '/piloto/conflitos'}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Resolver Conflitos
          </button>
        )}
      </div>
      
      {/* Dicas offline */}
      {!isOnline && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Modo Offline</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Você pode continuar usando o sistema. Seus dados serão salvos localmente 
                e sincronizados automaticamente quando a conexão for restaurada.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Dicas de dados pendentes */}
      {isOnline && hasOfflineData && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CloudIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Sincronização Pendente</h4>
              <p className="text-sm text-blue-700 mt-1">
                Existem dados que ainda não foram sincronizados com o servidor. 
                Clique em "Sincronizar Agora" para processar todos os itens pendentes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}