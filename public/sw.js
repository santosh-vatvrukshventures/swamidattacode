/**
 * Swamidatta Traders — Production Service Worker v2
 * Features:
 * - Versioned cache with auto cache-busting
 * - Network-first strategy for API GET requests with cache fallback
 * - Static asset caching (app shell)
 * - Google Fonts caching
 * - Offline fallback for navigation requests
 * - Skip API mutations (POST/PUT/DELETE) — handled by offlineQueue.ts
 */

const CACHE_VERSION = 'swamidatta-v2';
const FONT_CACHE = 'swamidatta-fonts-v1';
const API_CACHE = 'swamidatta-api-v1';

// App shell — critical assets to pre-cache
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// API routes to cache for offline access
const CACHEABLE_API_ROUTES = [
  '/api/items',
  '/api/sales',
  '/api/expenses',
  '/api/inwards',
  '/api/status'
];

// ─── INSTALL ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        console.warn('[SW] App shell caching skipped (dev mode):', err);
      });
    })
  );
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

// ─── ACTIVATE ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Delete old versioned caches but keep font and API caches
          if (key !== CACHE_VERSION && key !== FONT_CACHE && key !== API_CACHE) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ─── FETCH INTERCEPTOR ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests (mutations handled by offlineQueue.ts on the client)
  if (event.request.method !== 'GET') {
    return;
  }

  // Strategy 1: Google Fonts — Cache first, long-lived
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) => {
        return cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response && response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Strategy 2: API GET requests — Network first, cache fallback (stale-while-revalidate)
  if (url.pathname.startsWith('/api/')) {
    const isCacheableAPI = CACHEABLE_API_ROUTES.some((route) => url.pathname === route);

    if (isCacheableAPI) {
      event.respondWith(
        caches.open(API_CACHE).then((cache) => {
          return fetch(event.request)
            .then((response) => {
              // Update cache with fresh response
              if (response && response.ok) {
                cache.put(event.request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Network failed — serve from cache
              return cache.match(event.request).then((cached) => {
                if (cached) {
                  return cached;
                }
                // No cache — return offline JSON
                return new Response(
                  JSON.stringify({ error: 'offline', message: 'No cached data available. Connect to the internet to sync.' }),
                  { status: 503, headers: { 'Content-Type': 'application/json' } }
                );
              });
            });
        })
      );
    }
    // Non-cacheable API routes — pass through
    return;
  }

  // Strategy 3: App shell & static assets — Network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response && response.ok && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;

          // For navigation requests, serve the cached index.html (SPA fallback)
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html').then((indexPage) => {
              if (indexPage) return indexPage;
              return new Response(
                '<!DOCTYPE html><html><head><title>Swamidatta — Offline</title><style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f0502;color:#fff;text-align:center}h1{font-size:1.5rem}p{color:#b09c97;font-size:0.875rem}</style></head><body><div><h1>📴 You are offline</h1><p>Connect to the internet to access Swamidatta Traders.</p></div></body></html>',
                { status: 503, headers: { 'Content-Type': 'text/html' } }
              );
            });
          }

          // Return empty response for other requests
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

// ─── MESSAGE HANDLER (for skip waiting from client) ─────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
