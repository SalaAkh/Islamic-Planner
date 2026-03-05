const CACHE_NAME = 'barakah-planner-v15';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './favicon.ico',
    'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Inter:wght@300;400;600;700&family=Amiri:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
            .catch(err => console.warn('[Barakah Planner] SW cache addAll failed:', err))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache).catch(err => {
                                console.warn('[Barakah Planner] SW cache put error:', err);
                            });
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Offline fallback (already handled by cache for HTML)
                });
            })
    );
});
