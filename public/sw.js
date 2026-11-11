/* Naaz Creation service worker — lets the site install as an app and keeps images/static assets snappy.
   Pages themselves are always fetched fresh (prices, stock and carts must never be stale). */
const CACHE = "naaz-static-v1";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const isStatic = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/catalog/") || url.pathname.startsWith("/icons/");
  if (isStatic) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => new Response(
      "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><body style='font-family:system-ui;background:#0f3d2e;color:#faf4e6;display:grid;place-items:center;height:100vh;margin:0;text-align:center'><div><h1 style='font-weight:500'>You're offline</h1><p>Check your connection and try again.</p></div>",
      { headers: { "Content-Type": "text/html; charset=utf-8" } })));
  }
});
