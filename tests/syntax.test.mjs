import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";

// app.js needs a DOM so tests never import it; a syntax slip there once passed every test, so check every shipped script parses.
test("every shipped JavaScript file parses", () => {
  const dir = new URL("../codex/js/", import.meta.url);
  const files = readdirSync(dir).filter((name) => name.endsWith(".js"));
  assert.ok(files.includes("app.js") && files.includes("eve-study.js"));
  for (const name of files) {
    assert.doesNotThrow(() => execFileSync(process.execPath, ["--check", new URL(name, dir).pathname.replace(/^\/([A-Za-z]:)/, "$1")], { stdio: "pipe" }), name);
  }
});
