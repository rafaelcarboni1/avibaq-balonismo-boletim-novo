// Utility para registrar o Service Worker
export const registerSW = async () => {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registrado com sucesso:', registration);

      // Verificar se há uma nova versão disponível
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nova versão disponível
                console.log('Nova versão disponível!');
                showUpdateNotification();
              } else {
                // Primeira instalação
                console.log('Service Worker instalado pela primeira vez');
              }
            }
          });
        }
      });

      // Escutar mensagens do Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_OFFLINE_DATA') {
          // Disparar sincronização dos dados offline
          window.dispatchEvent(new CustomEvent('syncOfflineData'));
        }
      });

      // Registrar sincronização em background
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        (registration as any).sync.register('sync-offline-data');
      }

      return registration;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return null;
    }
  }
  return null;
};

// Mostrar notificação de atualização
const showUpdateNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Nova versão disponível!', {
      body: 'Clique para atualizar o aplicativo',
      icon: '/icon-192x192.png',
      tag: 'app-update',
      requireInteraction: true,
    });
  } else {
    // Fallback para navegadores sem suporte a notificações
    const shouldUpdate = confirm(
      'Uma nova versão do aplicativo está disponível. Deseja atualizar agora?'
    );
    if (shouldUpdate) {
      window.location.reload();
    }
  }
};

// Função para atualizar Service Worker
export const updateSW = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.update();
    }
  }
};

// Função para desregistrar Service Worker (para desenvolvimento)
export const unregisterSW = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      return registration.unregister();
    }
  }
  return false;
};

// Função para verificar se está rodando como PWA
export const isPWA = () => {
  return typeof window !== 'undefined' && 
         (window.matchMedia('(display-mode: standalone)').matches || 
          window.matchMedia('(display-mode: fullscreen)').matches ||
          // @ts-ignore
          window.navigator.standalone === true);
};

// Função para obter informações do cache
export const getCacheInfo = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.active) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        registration.active.postMessage(
          { type: 'GET_CACHE_SIZE' },
          [messageChannel.port2]
        );
      });
    }
  }
  return null;
};

// Função para limpar cache
export const clearCache = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.active) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        registration.active.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    }
  }
  return null;
};

// Função para solicitar permissão de notificação
export const requestNotificationPermission = async () => {
  if ('Notification' in window && 'serviceWorker' in navigator) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Função para mostrar prompt de instalação do PWA
export const showInstallPrompt = () => {
  let deferredPrompt: any = null;

  // Escutar evento beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Mostrar botão de instalação personalizado
    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        installButton.style.display = 'none';
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('PWA instalado');
          } else {
            console.log('Instalação do PWA cancelada');
          }
          deferredPrompt = null;
        });
      });
    }
  });

  // Escutar evento de instalação
  window.addEventListener('appinstalled', () => {
    console.log('PWA instalado com sucesso');
    deferredPrompt = null;
  });
};

// Função para detectar se o app foi instalado
export const isAppInstalled = () => {
  return isPWA() || 
         (typeof window !== 'undefined' && 
          window.matchMedia('(display-mode: standalone)').matches);
};

// Função para obter informações do dispositivo
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') return null;
  
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as any).deviceMemory,
    connection: (navigator as any).connection,
    standalone: (navigator as any).standalone,
    pwa: isPWA(),
    displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  };
};

// Função para sincronizar dados offline manualmente
export const syncOfflineData = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && (registration as any).sync) {
      await (registration as any).sync.register('sync-offline-data');
    }
  }
};