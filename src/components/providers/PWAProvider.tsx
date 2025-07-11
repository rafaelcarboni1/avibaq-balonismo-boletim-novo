/**
 * Provider PWA que inicializa e gerencia funcionalidades offline
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncManager } from '../../lib/offline/sync-manager';
import { offlineStorage } from '../../lib/offline/offline-storage';

interface PWAContextType {
  isOnline: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  install: () => Promise<void>;
  syncPending: number;
}

const PWAContext = createContext<PWAContextType>({
  isOnline: navigator.onLine,
  isInstalled: false,
  canInstall: false,
  install: async () => {},
  syncPending: 0
});

export const usePWA = () => useContext(PWAContext);

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [syncPending, setSyncPending] = useState(0);

  useEffect(() => {
    // Verificar se já está instalado
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInApp);
    };

    checkInstalled();

    // Event listeners para conectividade
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🔄 Conexão restaurada - iniciando sincronização automática');
      syncManager.processSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📡 Modo offline ativado');
    };

    // Event listener para instalação PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setCanInstall(true);
      console.log('📱 PWA pode ser instalado');
    };

    // Event listener para após instalação
    const handleAppInstalled = () => {
      console.log('✅ PWA foi instalado');
      setIsInstalled(true);
      setCanInstall(false);
      setInstallPrompt(null);
    };

    // Registrar Service Worker
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('🔧 Service Worker registrado:', registration);

          // Escutar atualizações do SW
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Nova versão do Service Worker disponível');
          });
        } catch (error) {
          console.error('❌ Erro ao registrar Service Worker:', error);
        }
      }
    };

    // Monitorar fila de sincronização
    const monitorSyncQueue = () => {
      const interval = setInterval(() => {
        const status = syncManager.getStatus();
        setSyncPending(status.queueLength);
      }, 3000);

      return () => clearInterval(interval);
    };

    // Inicializar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Inicializar componentes
    registerServiceWorker();
    const cleanupSync = monitorSyncQueue();

    // Verificar status inicial da fila de sincronização
    setSyncPending(syncManager.getStatus().queueLength);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      cleanupSync();
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      throw new Error('Instalação não disponível');
    }

    try {
      const result = await installPrompt.prompt();
      console.log('📱 Resultado da instalação:', result);
      
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('❌ Erro durante instalação:', error);
      throw error;
    }
  };

  const contextValue: PWAContextType = {
    isOnline,
    isInstalled,
    canInstall,
    install,
    syncPending
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  );
}

export default PWAProvider;