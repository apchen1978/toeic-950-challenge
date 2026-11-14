// 離線聽力：把全部音檔存進獨立快取。快取名稱不含程式版本，所以網站更新後不會被清掉。
export const MEDIA_CACHE = "toeic950-audio-offline";

function walk(value, visit) {
  if (!value || typeof value !== "object") return;
  if (typeof value.file === "string") visit(value);
  for (const child of Object.values(value)) walk(child, visit);
}

export function audioEntries(manifest, lessons = []) {
  const map = new Map();
  walk(manifest?.groups, (node) => {
    if (/\.mp3$/i.test(node.file)) map.set(node.file, Number(node.bytes) || 0);
  });
  for (const lesson of lessons) {
    if (lesson?.audio && /\.mp3$/i.test(lesson.audio) && !map.has(lesson.audio)) map.set(lesson.audio, 0);
  }
  return [...map].sort((a, b) => a[0].localeCompare(b[0])).map(([url, bytes]) => ({ url, bytes }));
}

export function formatMB(bytes) {
  return `${Math.max(1, Math.round(bytes / 1048576))} MB`;
}

export async function countCached(urls, cacheStorage) {
  if (!cacheStorage) return 0;
  const cache = await cacheStorage.open(MEDIA_CACHE);
  let n = 0;
  for (const url of urls) if (await cache.match(url, { ignoreSearch: true })) n += 1;
  return n;
}

// 依序（同時最多 concurrency 個）下載尚未快取的音檔。可用 signal 中止，失敗的會計入 failed。
export async function downloadAll(urls, { cacheStorage, fetchFn = fetch, onProgress = () => {}, signal, concurrency = 4 } = {}) {
  const cache = await cacheStorage.open(MEDIA_CACHE);
  const todo = [];
  let done = 0;
  for (const url of urls) {
    if (await cache.match(url, { ignoreSearch: true })) done += 1; else todo.push(url);
  }
  let failed = 0;
  let next = 0;
  const retry = [];
  onProgress({ done, failed, total: urls.length });
  async function worker() {
    while (next < todo.length && !signal?.aborted) {
      const url = todo[next++];
      try {
        const res = await fetchFn(url, { signal });
        if (!res.ok || res.status !== 200) throw new Error(String(res.status));
        await cache.put(url, res);
        done += 1;
      } catch {
        if (signal?.aborted) return;
        retry.push(url);
      }
      onProgress({ done, failed, total: urls.length });
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
  // 失敗的再各試一次（常見原因是網路瞬間不穩），仍失敗才算失敗。
  for (const url of retry) {
    if (signal?.aborted) break;
    try {
      const res = await fetchFn(url, { signal });
      if (!res.ok || res.status !== 200) throw new Error(String(res.status));
      await cache.put(url, res);
      done += 1;
    } catch {
      if (signal?.aborted) break;
      failed += 1;
    }
    onProgress({ done, failed, total: urls.length });
  }
  return { done, failed, total: urls.length, aborted: Boolean(signal?.aborted) };
}
