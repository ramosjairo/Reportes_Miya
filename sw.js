const CACHE_NAME = 'miyamoto-cache-v4.0.0';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './logo.png',
    './icono-192.png',
    './jszip.min.js'
];

// 1. Instalación: Guarda todos los archivos en el caché local
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Guardando archivos en caché local para uso 100% offline...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 2. Activación: Limpia cachés antiguas automáticamente
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('🧹 Eliminando caché antigua:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Estrategia Caché Primero con Respaldo en Red (Cache First - 100% Offline)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Si el archivo ya está en la memoria del teléfono, responde INSTANTÁNEAMENTE
            if (cachedResponse) {
                return cachedResponse;
            }

            // Si no está en caché (recurso nuevo), intenta descargarlo de la red
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Captura silenciosa para evitar que la app se cuelgue si no hay red
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});