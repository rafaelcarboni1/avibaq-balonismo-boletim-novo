/**
 * Componente indicador de status offline
 * Mostra status de conectividade e sincronização
 */

import React, { useState, useEffect } from 'react';
import { WifiIcon, CloudIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { syncManager } from '../../lib/offline/sync-manager';
import { MagicCard } from './magic-card';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineIndicator({ className = '', showDetails = false }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(syncManager.getStatus());
  const [showSyncDetails, setShowSyncDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Atualizar status de sincronização a cada 5 segundos
    const interval = setInterval(() => {
      setSyncStatus(syncManager.getStatus());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSyncClick = async () => {
    if (isOnline && syncStatus.queueLength > 0) {
      try {
        await syncManager.forcSync();
        setSyncStatus(syncManager.getStatus());
      } catch (error) {
        console.error('Erro ao forçar sincronização:', error);
      }
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500 bg-red-50';
    if (syncStatus.queueLength > 0) return 'text-yellow-500 bg-yellow-50';
    return 'text-green-500 bg-green-50';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiIcon className="h-5 w-5" />;
    if (syncStatus.queueLength > 0) return <ExclamationTriangleIcon className="h-5 w-5" />;
    return <CloudIcon className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus.queueLength > 0) return `${syncStatus.queueLength} pendente(s)`;
    return 'Sincronizado';
  };

  if (!showDetails) {
    // Versão compacta para header/navbar
    return (
      <div 
        className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor()} ${className}`}
        title={getStatusText()}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    );
  }

  // Versão detalhada para dashboard
  return (
    <MagicCard className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Status de Sincronização</h3>
        <button
          onClick={() => setShowSyncDetails(!showSyncDetails)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showSyncDetails ? 'Ocultar' : 'Detalhes'}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        <div>
          <p className="font-medium text-sm">{getStatusText()}</p>
          <p className="text-xs text-gray-500">
            {isOnline ? 'Conectado à internet' : 'Modo offline ativo'}
          </p>
        </div>
      </div>

      {syncStatus.queueLength > 0 && (
        <div className="mb-3">
          <button
            onClick={handleSyncClick}
            disabled={!isOnline}
            className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
              isOnline 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isOnline ? 'Sincronizar Agora' : 'Aguardando Conexão'}
          </button>
        </div>
      )}

      {showSyncDetails && (
        <div className="space-y-2 pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Itens na fila:</span>
              <span className="font-medium ml-1">{syncStatus.queueLength}</span>
            </div>
            <div>
              <span className="text-gray-500">Suporte PWA:</span>
              <span className={`font-medium ml-1 ${syncStatus.isSupported ? 'text-green-600' : 'text-red-600'}`}>
                {syncStatus.isSupported ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>

          {syncStatus.pendingItems.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Itens pendentes:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {syncStatus.pendingItems.map((item) => (
                  <div key={item.id} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{item.type}</span>
                      <span className="text-gray-500">{item.action}</span>
                    </div>
                    {item.attempts > 0 && (
                      <div className="text-red-500 mt-1">
                        Tentativa {item.attempts}/3
                        {item.lastError && (
                          <div className="text-xs truncate" title={item.lastError}>
                            {item.lastError}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </MagicCard>
  );
}

export default OfflineIndicator;