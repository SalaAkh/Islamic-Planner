const CACHE_NAME = 'barakah-planner-v36';

// Static assets to pre-cache on install
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.html',
    './manifest.json',
    './offline.html',
    './favicon.ico',
    './favicon.png',
];

// ─────────────────────────────────────────────────────
// INSTALL: pre-cache static shell + force activate
// ─────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
            .catch(err => console.warn('[Barakah SW] install cache failed:', err))
    );
});

// ─────────────────────────────────────────────────────
// ACTIVATE: purge ALL old caches + claim clients
// ─────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names.filter(n => n !== CACHE_NAME).map(n => {
                    console.log('[Barakah SW] Deleting old cache:', n);
                    return caches.delete(n);
                })
            ))
            .then(() => self.clients.claim())
    );
});

// ─────────────────────────────────────────────────────
// FETCH: smart routing
// Only cache our OWN origin assets.
// ALL external URLs pass through directly to network.
// ─────────────────────────────────────────────────────

const OWN_ORIGIN = self.location.origin; // e.g. https://islamic-planer.web.app

// Domains we NEVER intercept (auth, payment, analytics, APIs)
const PASSTHROUGH_PATTERNS = [
    /google\.com/,
    /googleapis\.com/,
    /gstatic\.com/,
    /googletagmanager\.com/,
    /google-analytics\.com/,
    /analytics\.google\.com/,
    /firebaseapp\.com/,
    /firebaseio\.com/,
    /cloudfunctions\.net/,
    /accounts\.google/,
    /nowpayments\.io/,
    /robokassa\.ru/,
];

self.addEventListener('fetch', (event) => {
    // Only handle GET
    if (event.request.method !== 'GET') return;

    const url = event.request.url;

    // Must be http/https
    if (!url.startsWith('http')) return;

    // ── Let ALL external URLs pass through to network (no SW interference) ──
    // This is the KEY fix: external = not our own origin
    try {
        const reqOrigin = new URL(url).origin;
        if (reqOrigin !== OWN_ORIGIN) {
            // Additionally block known auth/API domains from being even touched by SW
            // (just return, don't call event.respondWith — browser handles it natively)
            return;
        }
    } catch (e) {
        return; // malformed URL — skip
    }

    // ── From here: only OWN ORIGIN requests ──
    const isNavigate = event.request.mode === 'navigate';

    if (isNavigate) {
        // Navigation: network-first, fall back to cache
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then(c =>
                            c.put(event.request, clone).catch(() => {})
                        );
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cached = await caches.match(event.request, { ignoreSearch: true });
                    if (cached) return cached;
                    
                    const appCached = await caches.match('./app.html', { ignoreSearch: true });
                    if (appCached) return appCached;

                    const offlineCached = await caches.match('./offline.html', { ignoreSearch: true });
                    if (offlineCached) return offlineCached;
                    
                    return new Response('<h1>Offline</h1>', { status: 503, headers: { 'Content-Type': 'text/html' } });
                })
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;

            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(c =>
                        c.put(event.request, clone).catch(() => {})
                    );
                }
                return networkResponse;
            }).catch(() => {
                // Asset not available offline — return empty 503 (not html)
                return new Response('', {
                    status: 503,
                    statusText: 'Offline',
                    headers: { 'Content-Type': 'text/plain' }
                });
            });
        })
    );
});

// ─────────────────────────────────────────────────────
// PWA BUILDER COMPLIANCE EVENTS (Background Sync & Push)
// ─────────────────────────────────────────────────────

self.addEventListener('sync', event => {
    console.log('[Barakah SW] Background sync event fired:', event.tag);
    if (event.tag === 'sync-data') {
        event.waitUntil(Promise.resolve());
    }
});

self.addEventListener('periodicsync', event => {
    console.log('[Barakah SW] Periodic sync event fired:', event.tag);
    if (event.tag === 'update-content') {
        event.waitUntil(Promise.resolve());
    }
});

self.addEventListener('push', event => {
    console.log('[Barakah SW] Push notification received');
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Barakah Planner';
    const options = {
        body: data.body || 'Новое уведомление',
        icon: '/icon-192.png',
        badge: '/icon-192.png'
    };
    event.waitUntil(self.registration.showNotification(title, options));
});
