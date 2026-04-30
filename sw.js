/* sw.js — 簡易離線快取（cache-first 策略） */
const CACHE_VERSION = 'codex-stellaris-v1';
const PRECACHE = [
  './',
  './index.html',
  './chart.js',
  './natal-wheel.js',
  './transit.js',
  './big3-content.js',
  './natal-overlay.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(PRECACHE).catch(()=>{}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  // 跳過外部 CDN（讓瀏覽器照常處理）
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      // 動態快取同源資源
      if(res && res.status === 200){
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy).catch(()=>{}));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
