const CACHE = "diwan-v30";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=28",
  "./app.js?v=28",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-192.svg",
  "./icon-512.svg",
  "./data/quran.json",
  "./data/surah-meta.json",
  "./data/poetry/index.json",
  ...Array.from({ length: 76 }, (_, index) => `./data/poetry/part-${String(index).padStart(3, "0")}.json`),
  "./data/ara-bukhari.json",
  "./data/ara-muslim.json",
  "./data/ara-tirmidhi.json",
  "./data/ara-abudawud.json",
  "./data/ara-nasai.json",
  "./data/ara-ibnmajah.json",
  "./data/ara-malik.json",
];
self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(CACHE).then(async (c) => {
    await Promise.all(ASSETS.map(async (asset) => { try { await c.add(asset); } catch {} }));
    await self.skipWaiting();
  })),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
    ]),
  ),
);
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(
      (cached) =>
        cached ||
        fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
            return res;
          })
          .catch(() => cached),
    ),
  );
});
