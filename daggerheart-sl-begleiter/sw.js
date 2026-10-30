// Service Worker: hält die App offline verfügbar.
// Jede Version hat einen eigenen Speicher. Eine neue Version wird im
// Hintergrund vollständig geladen und wartet dann, bis die App nachfragt
// und die Spielleitung „Jetzt aktualisieren“ antippt.
const VERSION = '2026-10-30·4bab863';
const CACHE = `sl-begleiter-${VERSION}`;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './fell-regular.woff', './fell-italic.woff', './fell-sc.woff'];

self.addEventListener('install', (e) => {
  // cache: 'reload' umgeht den Browser-Cache, damit wirklich die neuen Dateien kommen.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((u) => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('sl-begleiter-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
  if (e.data === 'version' && e.ports[0]) e.ports[0].postMessage(VERSION);
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true })
      ?? (req.mode === 'navigate' ? await cache.match('./index.html') : undefined);
    if (hit) return hit;
    try { return await fetch(req); } catch {
      return (await cache.match('./index.html')) ?? Response.error();
    }
  })());
});
