// Service worker: 有網路時抓最新版（題庫更新會自動生效），離線時用快取。
const CACHE = "toeic950-codex-v20";
const SHELL = [
  "./", "index.html", "styles.css", "manifest.webmanifest",
  "js/app.js", "js/audio.js", "js/scoring.js", "js/skills.js", "js/timer.js",
  "data/questions.json",
  "images/photo-meeting.png", "images/photo-delivery.png", "images/photo-plants.png",
  "images/photo-restaurant.png", "images/photo-warehouse.png", "images/photo-terrace.png",
  "images/photo-bicycle.png", "images/photo-airport-maintenance.png", "images/campus-route.svg",
  "images/photo-09.jpg", "images/photo-10.jpg", "images/photo-11.jpg", "images/photo-12.jpg", "images/photo-13.jpg",
  "images/photo-14.jpg", "images/photo-15.jpg", "images/photo-16.jpg", "images/photo-17.jpg", "images/photo-18.jpg",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('toeic950-codex-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html")))
  );
});
