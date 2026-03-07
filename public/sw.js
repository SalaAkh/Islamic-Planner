const CACHE_NAME = 'barakah-planner-v22';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './favicon.ico',
    'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&family=Inter:wght@300;400;600;700&family=Amiri:wght@400;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
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

// URLs that should never be cached
const SKIP_CACHE_PATTERNS = [
    /firebaseapp\.com/,
    /googleapis\.com\/identitytoolkit/,
    /securetoken\.google\.com/,
    /accounts\.google\.com/,
    /firebase\.googleapis\.com/,
    /__\/auth\//,
];

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith('http')) return;

    // Skip Firebase Auth and other non-cacheable URLs
    if (SKIP_CACHE_PATTERNS.some(pattern => pattern.test(event.request.url))) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request).then((networkResponse) => {
                    // Only cache valid, non-opaque responses (opaque = status 0, no CORS)
                    if (
                        networkResponse &&
                        networkResponse.status === 200 &&
                        networkResponse.type !== 'opaque'
                    ) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache).catch(err => {
                                console.warn('[Barakah Planner] SW cache put error:', err);
                            });
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // Return a valid offline Response instead of undefined to avoid TypeErrors
                    return new Response('Content not available offline', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({ 'Content-Type': 'text/plain' })
                    });
                });
            })
    );
});
