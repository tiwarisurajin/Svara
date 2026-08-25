const CACHE="svara-v1";
const CORE=[
 "./",
 "./src/index.html",
 "./src/style.css",
 "./src/script.js",
 "./manifest.json",
 "./images/background.jpg",
 "./images/logo.svg",
 "./icons/icon-192.png",
 "./icons/icon-512.png",
 "./music/Kachaudi Gali.mp3"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
 const req=e.request;
 if(req.method!=="GET")return;
 e.respondWith(caches.match(req).then(cached=>{
   if(cached)return cached;
   return fetch(req).then(res=>{
     if(new URL(req.url).origin===location.origin){
       const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy));
     }
     return res;
   }).catch(()=>caches.match("./src/index.html"));
 }));
});
self.addEventListener("message",e=>{if(e.data==="SKIP_WAITING")self.skipWaiting()});
