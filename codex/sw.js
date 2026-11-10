// 有網路時，程式殼與題庫走網路優先，題庫更新會生效。
// 安裝只預先快取程式殼與資料。圖片與音檔在第一次成功載入後改為 cache-first，
// 已看過的圖、已聽過的音檔可離線再使用。手機音檔的 Range 要求會從完整快取切出 206。
const CACHE = "toeic950-codex-v43";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "js/app.js",
  "js/vocabulary.js",
  "js/audio.js",
  "js/scoring.js",
  "js/skills.js",
  "js/timer.js",
  "data/questions.json",
  "audio/manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png"
];
const MEDIA = /\.(?:png|jpe?g|webp|gif|svg|mp3|m4a|wav|ogg)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("toeic950-codex-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function byteRange(header, total) {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match) return null;
  const startText = match[1];
  const endText = match[2];
  if (startText === "" && endText === "") return null;
  if (startText === "") {
    const suffix = Number(endText);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    return { start: Math.max(0, total - suffix), end: total - 1 };
  }
  const start = Number(startText);
  const end = endText === "" ? total - 1 : Number(endText);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= total || end < start) return { invalid: true };
  return { start, end: Math.min(end, total - 1) };
}

async function ranged(response, request) {
  const header = request.headers.get("range");
  if (!header) return response;
  const buffer = await response.arrayBuffer();
  const range = byteRange(header, buffer.byteLength);
  const headers = new Headers(response.headers);
  headers.set("Accept-Ranges", "bytes");
  if (!range) return new Response(buffer, { status: 200, statusText: "OK", headers });
  if (range.invalid) {
    headers.set("Content-Range", `bytes */${buffer.byteLength}`);
    return new Response(null, { status: 416, statusText: "Range Not Satisfiable", headers });
  }
  const slice = buffer.slice(range.start, range.end + 1);
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${buffer.byteLength}`);
  headers.set("Content-Length", String(slice.byteLength));
  return new Response(slice, { status: 206, statusText: "Partial Content", headers });
}

async function cacheFirstMedia(request) {
  const cache = await caches.open(CACHE);
  let full = await cache.match(request, { ignoreSearch: true });
  if (!full) {
    const response = await fetch(request.url);
    if (!response.ok || response.status !== 200) return response;
    await cache.put(request.url, response.clone());
    full = response;
  }
  return ranged(full, request);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.status !== 206) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
    }
    return response;
  } catch {
    const hit = await caches.match(request, { ignoreSearch: true });
    if (hit) return hit;
    if (request.mode === "navigate") {
      const shell = await caches.match("index.html");
      if (shell) return shell;
    }
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(MEDIA.test(url.pathname) ? cacheFirstMedia(request) : networkFirst(request));
});
