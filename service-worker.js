const CACHE_NAME = "layisi-cache-v13";
const urlsToCache = ["/", "/index.html", "/icon_192.png", "/Icon_512.png", "/favicon.ico", "/manifest.json", "/brokerage.html", "/brokerage/", "/jobs/", "/jobs/index.html"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Let Cloudflare Pages serve individual product and job-detail routes through the SPA rewrite; the jobs directory has its own standalone page.
  if (/\.(?:css|png|json)$/.test(url.pathname)) {
    event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(event.request).then(hit => {
      const net = fetch(event.request).then(res => { if (res.ok) cache.put(event.request, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(response => response || caches.match("/index.html"))));
});
