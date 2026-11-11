import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const worker = readFileSync(new URL("../codex/sw.js", import.meta.url), "utf8");
const shell = [...worker.match(/const SHELL = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);

test("install precache is the app shell and data, not photos or speech files", () => {
  assert.match(worker, /const CACHE = "toeic950-codex-v61"/);
  assert.match(worker, /cache\.addAll\(SHELL\)/);
  assert.doesNotMatch(worker, /manifest\.groups/);
  for (const file of [
    "index.html", "styles.css", "manifest.webmanifest",
    "js/app.js", "js/vocabulary.js", "js/srs.js", "js/listening-lessons.js", "js/audio.js", "js/scoring.js", "js/skills.js", "js/timer.js", "js/quick-form.js", "js/official-listening.js", "js/mock-section.js", "js/graphic.js", "js/tips.js", "js/abilities.js", "js/choice-legacy.js",
    "data/questions.json", "audio/manifest.json"
  ]) assert.ok(shell.includes(file), file);
  assert.equal(shell.some((item) => item.startsWith("images/")), false);
  assert.equal(shell.some((item) => item.endsWith(".mp3")), false);
});

test("images and audio are cached on demand, including mobile byte ranges", () => {
  assert.match(worker, /function cacheFirstMedia/);
  assert.match(worker, /status: 206/);
  assert.match(worker, /png\|jpe\?g\|webp\|gif\|svg\|mp3/);
  assert.match(worker, /request\.mode === "navigate"/);
});

test("site root redirects to codex without registering a service worker", () => {
  const root = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(root, /url=codex\//);
  assert.match(root, /location\.replace\("codex\/"\)/);
  assert.doesNotMatch(root, /serviceWorker/);
  assert.doesNotMatch(root, /questions\.json/);
  assert.doesNotMatch(root, /googleapis|gstatic|youtube|fonts\.google/i);
});

test("vocabulary lists vacancy once and the home page has no internal asset note", () => {
  const vocabulary = readFileSync(new URL("../codex/js/vocabulary.js", import.meta.url), "utf8");
  const heads = [...vocabulary.matchAll(/^\s*\[(?:'([^']+)'|"([^"]+)")\s*,/gm)].map((match) => match[1] || match[2]);
  assert.equal(heads.filter((word) => word === "vacancy").length, 1);
  const app = readFileSync(new URL("../codex/js/app.js", import.meta.url), "utf8");
  assert.doesNotMatch(app, /官方題庫到貨/);
  assert.doesNotMatch(app, /素材核對/);
});
