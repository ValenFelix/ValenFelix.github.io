const CACHE = 'quiniela-2026-v2';
const BASE = '/ValenFelix-github-io';

const PRECACHE = [
  `${BASE}/quiniela2026.html`,
  `${BASE}/manifest.json`,
  `${BASE}/icon-192.jpg`,
  `${BASE}/icon-512.jpg`,
  `${BASE}/icon-180.jpg`,
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600&display=swap'
];

const NETWORK_ONLY = [
  'docs.google.com',
  'api.football-data.org',
  'corsproxy.io'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (NETWORK_ONLY.some(d => url.hostname.includes(d))) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        if (e.request.destination === 'document') {
          return caches.match(`${BASE}/quiniela2026.html`);
        }
      });
    })
  );
});
