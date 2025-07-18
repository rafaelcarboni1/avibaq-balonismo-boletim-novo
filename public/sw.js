// Service Worker para AVIBAQ PWA
// Versão do cache - incrementar quando atualizar arquivos
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `avibaq-${CACHE_VERSION}`;

// Arquivos para cache (estratégia de cache first)
const STATIC_CACHE_FILES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  '/piloto/dashboard',
  '/piloto/login',
  '/agencia/dashboard',
  '/agencia/login',
  '/admin/dashboard',
  '/admin/login',
  '/_next/static/css/app.css',
  '/_next/static/chunks/polyfills.js',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/_app.js'
];

// Rotas que devem funcionar offline
const OFFLINE_ROUTES = [
  '/piloto/dashboard',
  '/piloto/checklist',
  '/piloto/pos-voo',
  '/piloto/meus-baloes',
  '/piloto/planejamento',
  '/piloto/convites',
  '/agencia/dashboard',
  '/agencia/frota',
  '/agencia/pilotos',
  '/agencia/planejamento',
  '/admin/dashboard',
  '/admin/usuarios',
  '/admin/boletins',
  '/admin/associados'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache criado, adicionando arquivos...');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        console.log('[SW] Arquivos adicionados ao cache');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erro ao criar cache:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker ativado');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições não HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Ignorar requisições de analytics e external
  if (
    url.hostname !== self.location.hostname ||
    url.pathname.includes('/api/auth/') ||
    url.pathname.includes('/_next/webpack-hmr')
  ) {
    return;
  }
  
  // Estratégia Cache First para assets estáticos
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Estratégia Network First para API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Estratégia Network First para páginas HTML
  if (request.destination === 'document') {
    event.respondWith(networkFirstWithOfflinePage(request));
    return;
  }
  
  // Estratégia Network First para outros recursos
  event.respondWith(networkFirst(request));
});

// Estratégia Cache First
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Erro em cacheFirst:', error);
    return new Response('Erro de rede', { status: 503 });
  }
}

// Estratégia Network First
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Rede falhou, buscando no cache:', request.url);
    
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    return new Response('Conteúdo não disponível offline', { status: 503 });
  }
}

// Estratégia Network First com página offline
async function networkFirstWithOfflinePage(request) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Rede falhou para página, buscando no cache:', request.url);
    
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Verificar se é uma rota que deve funcionar offline
    const url = new URL(request.url);
    const isOfflineRoute = OFFLINE_ROUTES.some(route => 
      url.pathname.startsWith(route)
    );
    
    // Verificar rotas dinâmicas específicas
    const isDynamicOfflineRoute = 
      /^\/piloto\/(checklist|pos-voo)\/[^/]+$/.test(url.pathname) ||
      /^\/admin\/(boletins|usuarios)\/[^/]+/.test(url.pathname);
    
    if (isOfflineRoute || isDynamicOfflineRoute) {
      // Retornar página offline customizada
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Offline - AVIBAQ</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .offline-container { max-width: 500px; margin: 0 auto; }
          .offline-icon { font-size: 4em; margin-bottom: 20px; }
          .offline-title { color: #333; margin-bottom: 10px; }
          .offline-message { color: #666; margin-bottom: 30px; }
          .retry-button { 
            background: #2563eb; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer;
            font-size: 16px;
          }
          .retry-button:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📡</div>
          <h1 class="offline-title">Você está offline</h1>
          <p class="offline-message">
            Não foi possível carregar esta página. Verifique sua conexão com a internet.
          </p>
          <button class="retry-button" onclick="window.location.reload()">
            Tentar Novamente
          </button>
        </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

// Escutar mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ size });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearCache().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Obter tamanho do cache
async function getCacheSize() {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  let totalSize = 0;
  
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  
  return totalSize;
}

// Limpar cache
async function clearCache() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[SW] Evento de sincronização:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

// Sincronizar dados offline
async function syncOfflineData() {
  try {
    console.log('[SW] Iniciando sincronização de dados offline...');
    
    // Enviar mensagem para o cliente principal para iniciar sincronização
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_OFFLINE_DATA' });
    });
    
    console.log('[SW] Sincronização iniciada');
  } catch (error) {
    console.error('[SW] Erro na sincronização:', error);
  }
}

// Notificações push (para futuras implementações)
self.addEventListener('push', (event) => {
  console.log('[SW] Push recebido:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: data.data
      })
    );
  }
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada:', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

console.log('[SW] Service Worker carregado');