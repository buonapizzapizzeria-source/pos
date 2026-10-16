const CACHE = 'bp-pos-v3';
const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    try { await c.add('./'); } catch (err) {}
    try { const r = await fetch(new Request(CDN, { mode: 'no-cors' })); await c.put(CDN, r); } catch (err) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isDoc = url.origin === location.origin && (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/'));
  const isLib = url.hostname === 'cdn.jsdelivr.net';
  if (!isDoc && !isLib) return;                       // mai toccare Supabase / Gemini / API
  e.respondWith((async () => {
    try {
      const r = await fetch(req);
      const c = r.clone();
      caches.open(CACHE).then((ca) => ca.put(req, c)).catch(() => {});
      return r;
    } catch (err) {
      const m = await caches.match(req, { ignoreSearch: true });
      return m || (await caches.match('./')) || (await caches.match(CDN)) || Response.error();
    }
  })());
});
