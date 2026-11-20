const CACHE_NAME = "layisi-cache-v16";
const urlsToCache = ["/", "/index.html", "/icon_192.png", "/Icon_512.png", "/favicon.ico", "/favicon.svg", "/apple-touch-icon.png", "/no-image.svg", "/splash.png", "/counts.js", "/manifest.json", "/brokerage/", "/jobs/", "/jobs/index.html"];
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
if (/\.(?:css|png|json)$/.test(url.pathname)) {
event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(event.request).then(hit => {
const net = fetch(event.request).then(res => { if (res.ok) cache.put(event.request, res.clone()); return res; }).catch(() => hit);
return hit || net;
})));
return;
}
event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(response => response || caches.match("/index.html"))));
});
