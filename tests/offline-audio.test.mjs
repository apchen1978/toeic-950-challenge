import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { audioEntries, countCached, downloadAll, formatMB, MEDIA_CACHE } from "../codex/js/offline.js";
import { LESSONS } from "../codex/js/listening-lessons.js";

const manifest = JSON.parse(readFileSync(new URL("../codex/audio/manifest.json", import.meta.url), "utf8"));
const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");

function fakeCaches() {
  const store = new Map();
  return { store, open: async () => ({
    match: async (url) => store.get(url),
    put: async (url, res) => { store.set(url, res); }
  }) };
}

test("audio list covers every mp3 file the app can request", () => {
  const urls = new Set(audioEntries(manifest, LESSONS).map((e) => e.url));
  const disk = readdirSync(new URL("../codex/audio/", import.meta.url)).filter((f) => f.endsWith(".mp3")).map((f) => `audio/${f}`);
  assert.deepEqual(disk.filter((f) => !urls.has(f) && f !== "audio/letter-a.mp3"), []); // letter-a.mp3 is not referenced anywhere
  assert.deepEqual([...urls].filter((f) => !disk.includes(f)), []);
  assert.match(formatMB(52 * 1048576), /^52 MB$/);
});

test("download skips cached files, counts failures and can be resumed", async () => {
  const cacheStorage = fakeCaches();
  const urls = ["audio/a.mp3", "audio/b.mp3", "audio/c.mp3"];
  const calls = [];
  const fetchFn = async (url) => { calls.push(url); return url === "audio/b.mp3" ? { ok: false, status: 404 } : { ok: true, status: 200 }; };
  let result = await downloadAll(urls, { cacheStorage, fetchFn, concurrency: 2 });
  assert.equal(result.done, 2); assert.equal(result.failed, 1);
  assert.equal(await countCached(urls, cacheStorage), 2);
  calls.length = 0;
  result = await downloadAll(urls, { cacheStorage, fetchFn: async (u) => { calls.push(u); return { ok: true, status: 200 }; } });
  assert.deepEqual(calls, ["audio/b.mp3"]);
  assert.equal(result.done, 3); assert.equal(result.failed, 0);
});

test("abort stops downloading without counting failures", async () => {
  const controller = new AbortController();
  const cacheStorage = fakeCaches();
  const urls = Array.from({ length: 10 }, (_, i) => `audio/${i}.mp3`);
  const fetchFn = async () => { controller.abort(); return { ok: true, status: 200 }; };
  const result = await downloadAll(urls, { cacheStorage, fetchFn, concurrency: 1, signal: controller.signal });
  assert.equal(result.aborted, true); assert.equal(result.failed, 0); assert.ok(result.done < 10);
});

test("service worker keeps audio in a version-independent cache", () => {
  assert.equal(MEDIA_CACHE, "toeic950-audio-offline");
  assert.match(worker, /const MEDIA_CACHE = "toeic950-audio-offline"/);
  assert.match(worker, /caches\.open\(MEDIA_CACHE\)/);
  assert.doesNotMatch(worker, /startsWith\("toeic950-audio/);
  assert.match(worker, /"js\/offline\.js"/);
});

test("home focus mode hides extras, filters nav and auto-enables near the exam", () => {
  assert.match(app, /function homeFocus\(\)/);
  assert.match(app, /days <= 14/);
  for (const id of ["nav-vocab", "nav-grammar", "nav-practice"]) assert.match(app, new RegExp(`class="[^"]*home-extra[^"]*"[^>]*id="${id}"`));
  assert.match(app, /case "toggle-focus"/);
  assert.match(app, /offsetParent !== null/);
  const css = readFileSync(new URL("../codex/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.home-focus \.home-extra \{ display: none; \}/);
});
