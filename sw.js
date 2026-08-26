
const CACHE = "nocturne-v1";
const CORE = [
  "./index.html",
  "./style.css",
  "./script.js"
  // Add other files here only if they actually exist in your project folders
];

self.addEventListener("install", e => {
    e.waitUntil(
        caches.open(CACHE).then(async c => {
            for (const path of CORE) {
                try {
                    await c.add(path);
                } catch (err) {
                    console.warn(`Skipping missing asset: ${path}`, err);
                }
            }
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
    const req = e.request;
    if (req.method !== "GET") return;
    
    e.respondWith(
        caches.match(req).then(cached => {
            if (cached) return cached;
            return fetch(req).then(res => {
                if (new URL(req.url).origin === location.origin) {
                    const copy = res.clone();
                    caches.open(CACHE).then(c => c.put(req, copy));
                }
                return res;
            }).catch(() => caches.match("./index.html")); // FIXED: points to root index.html
        })
    );
