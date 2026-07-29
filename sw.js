const CACHE_NAME = 'miyamoto-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './comentarios.json',
    './manifest.json',
    './logo.png',
    './icono-192.png'
];

// 1. Instalación: Guarda todos los archivos en el caché local al cargar por primera vez
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 Guardando archivos en caché local...');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// 2. Activación: Limpia cachés antiguas si se actualiza la versión
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

// 3. Estrategia de Red Primero con Respaldo 100% Local (Network First with Cache Fallback)
self.addEventListener('fetch', (event) => {
    // Solo manejar solicitudes GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Si hay internet y la respuesta es válida, actualizamos la caché local
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Si no hay internet / falla la conexión, responde 100% desde la caché local
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // Respaldo para la navegación principal si está offline
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});