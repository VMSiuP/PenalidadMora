// ── SERVICE WORKER — Penalidad por Mora RLGCP ──────────────────────────────
// Versión: actualizar este string fuerza la renovación del caché en todos los clientes
const CACHE_VERSION = 'penalidad-mora-v1';

const ASSETS = [
  './index.html',
  './manifest.json',
  './icon.svg',
];

// ── INSTALL: cachear recursos esenciales ──────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(ASSETS))
  );
  // Activar inmediatamente sin esperar que se cierren otras pestañas
  self.skipWaiting();
});

// ── ACTIVATE: eliminar cachés viejos ─────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION)
          .map(k => caches.delete(k))
      )
    )
  );
  // Tomar control de todas las pestañas abiertas de inmediato
  self.clients.claim();
});

// ── FETCH: Cache-first, con fallback a red ───────────────────────────────
self.addEventListener('fetch', event => {
  // Solo interceptar GET del mismo origen
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      // No está en caché: intentar red y guardar copia
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// ── MENSAJE: forzar actualización desde la app ───────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
