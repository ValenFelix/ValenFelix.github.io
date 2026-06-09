const CACHE = 'quiniela-2026-v1';

// Assets que se guardan en cache al instalar
const PRECACHE = [
  './quiniela2026.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap'
];

// Dominios que siempre van a la red (datos en vivo)
const NETWORK_ONLY = [
  'docs.google.com',
  'api.football-data.org',
  'corsproxy.io'
];

// ── INSTALL: pre-cachear shell ──────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar caches viejos ────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: estrategia mixta ─────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Datos en vivo → siempre red, sin cache
  if (NETWORK_ONLY.some(d => url.hostname.includes(d))) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Todo lo demás → cache primero, red como fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Guardar en cache solo respuestas válidas
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Sin red y sin cache: devolver el HTML principal como fallback
        if (e.request.destination === 'document') {
          return caches.match('./quiniela2026.html');
        }
      });
    })
  );
});
