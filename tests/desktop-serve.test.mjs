import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyUpdate, createAppServer, ipv4Hosts, isAllowedPath } from "../codex/serve.mjs";

const bank = JSON.parse(readFileSync(new URL("../codex/data/questions.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("../codex/audio/manifest.json", import.meta.url), "utf8"));

test("desktop allowlist accepts every asset the app requests and rejects escapes", () => {
  const shell = [
    "/index.html", "/styles.css", "/sw.js", "/manifest.webmanifest",
    "/js/app.js", "/js/vocabulary.js", "/js/audio.js", "/js/scoring.js", "/js/skills.js", "/js/timer.js", "/js/quick-form.js",
    "/data/questions.json", "/audio/manifest.json",
    "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png", "/icons/apple-touch-icon.png",
    "/audio/quick-au-g-airport-talk-d.mp3", "/audio/quick-gb-s03-talk2.mp3", "/images/future-photo.webp"
  ];
  for (const path of shell) assert.equal(isAllowedPath(path), true, path);
  for (const group of bank.groups) {
    if (group.image) assert.equal(isAllowedPath(`/${group.image}`), true, group.image);
  }
  for (const entry of Object.values(manifest.groups)) assert.equal(isAllowedPath(`/${entry.file}`), true, entry.file);
  for (const path of [
    "/serve.mjs", "/.nojekyll", "/../package.json", "/js/../data/questions.json",
    "/images/photo-meeting.jpg.exe", "/audio/../../index.html", "/data/questions.json.bak",
    "/js/app.js%00.png", "/images/%2e%2e/serve.mjs"
  ]) assert.equal(isAllowedPath(path), false, path);
});

test("update fast-forwards a clean main branch and never resets", () => {
  const calls = [];
  const result = applyUpdate((args) => {
    calls.push(args.join(" "));
    if (args[0] === "rev-parse") return { code: 0, stdout: "main\n", stderr: "" };
    if (args[0] === "status") return { code: 0, stdout: "", stderr: "" };
    return { code: 0, stdout: "Already up to date.\n", stderr: "" };
  });
  assert.equal(result.action, "updated");
  assert.deepEqual(calls, ["rev-parse --abbrev-ref HEAD", "status --porcelain", "pull --ff-only"]);
});

test("update skips another branch, a dirty tree, and a failed pull", () => {
  const branch = applyUpdate((args) => ({ code: args[0] === "rev-parse" ? 0 : 1, stdout: "feature\n", stderr: "" }));
  assert.equal(branch.action, "skip");
  assert.match(branch.message, /feature/);

  const calls = [];
  const dirty = applyUpdate((args) => {
    calls.push(args.join(" "));
    if (args[0] === "rev-parse") return { code: 0, stdout: "main\n", stderr: "" };
    return { code: 0, stdout: " M codex/sw.js\n", stderr: "" };
  });
  assert.equal(dirty.action, "skip");
  assert.equal(calls.includes("pull --ff-only"), false);

  const offline = applyUpdate((args) => {
    if (args[0] === "pull") return { code: 1, stdout: "", stderr: "Could not resolve host\n" };
    if (args[0] === "status") return { code: 0, stdout: "", stderr: "" };
    return { code: 0, stdout: "main\n", stderr: "" };
  });
  assert.equal(offline.action, "skip");
  assert.match(offline.message, /Could not resolve host/);
});

test("this checkout is not fast-forwarded while it is away from a clean main", () => {
  const result = applyUpdate();
  assert.equal(result.action, "skip");
  assert.match(result.message, /不是 main|未提交|不是 git/);
});

test("LAN address list keeps public IPv4 addresses only", () => {
  assert.deepEqual(ipv4Hosts({
    lo: [{ family: "IPv4", internal: true, address: "127.0.0.1" }],
    wifi: [{ family: "IPv4", internal: false, address: "192.168.1.20" }, { family: "IPv6", internal: false, address: "fe80::1" }]
  }), ["192.168.1.20"]);
});

test("desktop server serves codex at its root and hides the rest of the repo", async () => {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  try {
    const image = await fetch(`http://127.0.0.1:${port}/images/photo-meeting.jpg`);
    assert.equal(image.status, 200);
    assert.equal(image.headers.get("content-type"), "image/jpeg");
    assert.ok((await image.arrayBuffer()).byteLength > 1000);
    const audio = await fetch(`http://127.0.0.1:${port}/audio/g-new-conv1.mp3`);
    assert.equal(audio.status, 200);
    assert.equal(audio.headers.get("content-type"), "audio/mpeg");
    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /serviceWorker/);
    const hidden = await fetch(`http://127.0.0.1:${port}/../package.json`);
    assert.equal(hidden.status, 404);
    assert.equal(await hidden.text(), "Not found");
    const script = await fetch(`http://127.0.0.1:${port}/serve.mjs`);
    assert.equal(script.status, 404);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
