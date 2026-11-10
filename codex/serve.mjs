// Desktop/LAN server. The web root is this directory, so http://127.0.0.1:4190/
// matches the old non-git folder and keeps that origin's localStorage.
import http from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { networkInterfaces } from "node:os";
import { realpath, readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = resolve(fileURLToPath(new URL(".", import.meta.url)));
const repoRoot = resolve(appRoot, "..");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

// Photos are JPEG. webp is accepted so a later conversion is not blocked by the allowlist.
const ALLOWED = [
  /^\/index\.html$/,
  /^\/styles\.css$/,
  /^\/sw\.js$/,
  /^\/manifest\.webmanifest$/,
  /^\/js\/[A-Za-z0-9._-]+\.js$/,
  /^\/data\/questions\.json$/,
  /^\/audio\/manifest\.json$/,
  /^\/audio\/[A-Za-z0-9._-]+\.mp3$/,
  /^\/images\/[A-Za-z0-9._-]+\.(?:png|jpe?g|webp|svg)$/,
  /^\/icons\/[A-Za-z0-9._-]+\.png$/
];

export function isAllowedPath(pathname) {
  if (typeof pathname !== "string" || pathname.includes("\0") || pathname.includes("\\") || pathname.includes("%")) return false;
  if (pathname.includes("..")) return false;
  return ALLOWED.some((pattern) => pattern.test(pathname));
}

export function contentType(file) {
  return TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
}

export function ipv4Hosts(interfaces) {
  const hosts = [];
  for (const entries of Object.values(interfaces ?? {})) {
    for (const entry of entries ?? []) {
      const ip4 = entry.family === "IPv4" || entry.family === 4;
      if (ip4 && !entry.internal && entry.address) hosts.push(entry.address);
    }
  }
  return hosts;
}

export function gitResult(args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: options.timeout ?? 20000,
    windowsHide: true
  });
  return { code: result.status === null ? 1 : result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/** Fast-forward main only. Never resets, cleans, or checks out another branch. */
export function applyUpdate(run = gitResult) {
  const branch = run(["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch.code !== 0) {
    return { action: "skip", message: "略過更新：這裡不是 git 工作目錄，直接開啟目前檔案。(Skipped: not a git checkout.)" };
  }
  const name = branch.stdout.trim();
  if (name !== "main") {
    return { action: "skip", message: `略過更新：目前分支是 ${name}，不是 main。不會切換分支。(Skipped: not on main.)` };
  }
  const status = run(["status", "--porcelain"]);
  if (status.code !== 0) {
    return { action: "skip", message: "略過更新：無法讀取 git 狀態。繼續使用目前檔案。(Skipped: git status failed.)" };
  }
  if (status.stdout.trim()) {
    return { action: "skip", message: "略過更新：工作目錄有未提交或未追蹤的變更。不會重設或捨棄這些變更。(Skipped: dirty tree.)" };
  }
  const pull = run(["pull", "--ff-only"], { timeout: 20000 });
  if (pull.code !== 0) {
    const detail = (pull.stderr || pull.stdout || "").trim().split("\n").filter(Boolean).at(-1) ?? "";
    return {
      action: "skip",
      message: `略過更新：無法快轉 main（可能沒有網路，或遠端不能快轉）。繼續使用目前檔案。(Skipped: pull failed.)${detail ? `\n${detail}` : ""}`
    };
  }
  return { action: "updated", message: pull.stdout.trim() || "main 已是最新。(Already up to date.)" };
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
        res.end("Method not allowed");
        return;
      }
      let pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
      if (pathname.endsWith("/")) pathname += "index.html";
      if (!isAllowedPath(pathname)) throw new Error("forbidden");
      const file = resolve(appRoot, `.${pathname}`);
      const [realRoot, realFile] = await Promise.all([realpath(appRoot), realpath(file)]);
      const rootPrefix = realRoot.endsWith(sep) ? realRoot : realRoot + sep;
      if (realFile !== realRoot && !realFile.startsWith(rootPrefix)) throw new Error("forbidden");
      const body = await readFile(realFile);
      res.writeHead(200, { "Content-Type": contentType(realFile), "Cache-Control": "no-store" });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  });
}

function openBrowser(url) {
  const child = process.platform === "win32"
    ? spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore", windowsHide: true })
    : process.platform === "darwin"
      ? spawn("open", [url], { detached: true, stdio: "ignore" })
      : spawn("xdg-open", [url], { detached: true, stdio: "ignore" });
  child.on("error", () => {});
  child.unref();
}

function parseArgs(argv) {
  let port = 4190;
  const options = { port, open: false, lan: false, update: false };
  for (const arg of argv) {
    if (arg === "--open") options.open = true;
    else if (arg === "--lan") options.lan = true;
    else if (arg === "--update") options.update = true;
    else if (/^\d+$/.test(arg)) options.port = Number(arg);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function invokedDirectly() {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(resolve(entry)).href;
}

function main() {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (options.update) console.log(applyUpdate().message);
  const server = createAppServer();
  server.on("error", (error) => {
    console.error(error.code === "EADDRINUSE"
      ? `連接埠 ${options.port} 已被使用。請先關掉舊的練習視窗。(Port in use.)`
      : error.message);
    process.exit(1);
  });
  const host = options.lan ? "0.0.0.0" : "127.0.0.1";
  server.listen(options.port, host, () => {
    const local = `http://127.0.0.1:${options.port}/`;
    console.log(`TOEIC 練習頁：${local}`);
    if (options.lan) {
      const hosts = ipv4Hosts(networkInterfaces());
      if (!hosts.length) console.log("沒有找到區網 IPv4。請確認這台電腦已連上 Wi-Fi。(No LAN address.)");
      for (const address of hosts) console.log(`手機同一 Wi-Fi 開啟：http://${address}:${options.port}/`);
    }
    if (options.open) openBrowser(local);
  });
}

if (invokedDirectly()) main();
