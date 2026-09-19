const CACHE = "diwan-v17";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=17",
  "./app.js?v=17",
  "./manifest.json",
  "./data/quran.json",
  "./data/surah-meta.json",
  "./data/poetry/index.json",
  "./data/ara-bukhari.json",
  "./data/ara-muslim.json",
  "./data/ara-tirmidhi.json",
  "./data/ara-abudawud.json",
  "./data/ara-nasai.json",
  "./data/ara-ibnmajah.json",
  "./data/ara-malik.json",
];
self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
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
