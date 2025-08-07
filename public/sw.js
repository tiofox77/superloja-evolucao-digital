const CACHE_NAME = 'superloja-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// Cache dinâmico para assets
const DYNAMIC_CACHE = 'superloja-dynamic-v2';
const STATIC_CACHE_DURATION = 86400000; // 24 horas

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            console.log('SW: Removendo cache antigo', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Pular APIs e recursos externos
  if (
    request.url.includes('/api/') || 
    request.url.includes('.php') ||
    url.origin !== self.location.origin ||
    request.method !== 'GET'
  ) {
    event.respondWith(fetch(request));
    return;
  }
  
  // Estratégia Cache First para assets estáticos
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            // Verificar se cache ainda é válido
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
              const cacheDate = new Date(dateHeader).getTime();
              if (Date.now() - cacheDate > STATIC_CACHE_DURATION) {
                // Cache expirado, buscar nova versão
                return fetch(request).then((fetchResponse) => {
                  if (fetchResponse.ok) {
                    cache.put(request, fetchResponse.clone());
                  }
                  return fetchResponse;
                }).catch(() => response); // Fallback para cache expirado
              }
            }
            return response;
          }
          
          // Não está em cache, buscar e cachear
          return fetch(request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
    return;
  }
  
  // Estratégia Network First para páginas HTML
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((response) => {
          return response || caches.match('/');
        });
      })
  );
});