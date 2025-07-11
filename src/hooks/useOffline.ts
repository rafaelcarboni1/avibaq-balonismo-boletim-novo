/**
 * Hook para gerenciar funcionalidades offline
 * Integra o sync manager e offline storage
 */

import { useState, useEffect, useCallback } from 'react';
import { syncManager, OfflineData } from '../lib/offline/sync-manager';
import { offlineStorage } from '../lib/offline/offline-storage';

export interface UseOfflineOptions {
  autoSync?: boolean;
  storeName?: string;
}

export function useOffline(options: UseOfflineOptions = {}) {
  const { autoSync = true, storeName = 'voos' } = options;
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(syncManager.getStatus());
  const [isSupported] = useState(() => {
    return (
      'serviceWorker' in navigator &&
      'indexedDB' in window &&
      'localStorage' in window
    );
  });

  // Atualizar status de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync) {
        syncManager.processSyncQueue();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync]);

  // Atualizar status de sincronização
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(syncManager.getStatus());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Salva dados localmente (offline) e adiciona à fila de sincronização
   */
  const saveOffline = useCallback(async (
    data: any, 
    action: 'create' | 'update' | 'delete' = 'create',
    type: string = storeName
  ) => {
    try {
      // Salvar no armazenamento offline
      await offlineStorage.save(type, data, false);
      
      // Adicionar à fila de sincronização
      const queueId = syncManager.addToQueue({
        type: type as any,
        action,
        data
      });

      console.log(`💾 Dados salvos offline: ${type}/${data.id} (queue: ${queueId})`);
      
      return { success: true, offlineId: data.id, queueId };
    } catch (error) {
      console.error('Erro ao salvar dados offline:', error);
      return { success: false, error: error.message };
    }
  }, [storeName]);

  /**
   * Recupera dados do armazenamento offline
   */
  const getOffline = useCallback(async (id: string, type: string = storeName) => {
    try {
      const item = await offlineStorage.get(type, id);
      return item ? item.data : null;
    } catch (error) {
      console.error('Erro ao recuperar dados offline:', error);
      return null;
    }
  }, [storeName]);

  /**
   * Recupera todos os dados de um tipo do armazenamento offline
   */
  const getAllOffline = useCallback(async (type: string = storeName, syncedOnly: boolean = false) => {
    try {
      const items = await offlineStorage.getAll(type, syncedOnly);
      return items.map(item => item.data);
    } catch (error) {
      console.error('Erro ao recuperar todos os dados offline:', error);
      return [];
    }
  }, [storeName]);

  /**
   * Força uma sincronização manual
   */
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      throw new Error('Sem conexão com a internet');
    }
    
    try {
      await syncManager.forcSync();
      setSyncStatus(syncManager.getStatus());
      return { success: true };
    } catch (error) {
      console.error('Erro ao forçar sincronização:', error);
      return { success: false, error: error.message };
    }
  }, [isOnline]);

  /**
   * Limpa dados offline de um tipo específico
   */
  const clearOfflineData = useCallback(async (type: string = storeName) => {
    try {
      await offlineStorage.clear(type);
      return { success: true };
    } catch (error) {
      console.error('Erro ao limpar dados offline:', error);
      return { success: false, error: error.message };
    }
  }, [storeName]);

  /**
   * Salva dados com estratégia híbrida (online primeiro, offline como fallback)
   */
  const saveHybrid = useCallback(async (
    data: any,
    onlineSaveFunction: () => Promise<any>,
    action: 'create' | 'update' | 'delete' = 'create',
    type: string = storeName
  ) => {
    if (isOnline) {
      try {
        // Tentar salvar online primeiro
        const result = await onlineSaveFunction();
        
        // Se sucesso, salvar localmente como sincronizado
        if (result && !result.error) {
          await offlineStorage.save(type, data, true);
          return { success: true, online: true, data: result };
        } else {
          // Se falhou online, salvar offline
          return await saveOffline(data, action, type);
        }
      } catch (error) {
        // Se erro de rede, salvar offline
        console.warn('Falha ao salvar online, salvando offline:', error);
        return await saveOffline(data, action, type);
      }
    } else {
      // Se offline, salvar diretamente offline
      return await saveOffline(data, action, type);
    }
  }, [isOnline, saveOffline, storeName]);

  return {
    // Status
    isOnline,
    isSupported,
    syncStatus,
    hasPendingSync: syncStatus.queueLength > 0,
    
    // Operações básicas
    saveOffline,
    getOffline,
    getAllOffline,
    
    // Operações avançadas
    saveHybrid,
    forceSync,
    clearOfflineData,
    
    // Utilitários
    offlineStorage,
    syncManager
  };
}