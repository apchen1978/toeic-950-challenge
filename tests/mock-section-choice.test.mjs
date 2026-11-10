import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sectionChoiceHtml, selectMockSection } from "../codex/js/mock-section.js";

function selectedValues(html) {
  return [...html.matchAll(/<label class="segment-item( is-selected)?"><input type="radio"[^>]*value="([^"]+)" aria-checked="(true|false)"( checked)?>/g)]
    .filter((match) => match[1] && match[3] === "true" && match[4])
    .map((match) => match[2]);
}

test("tapping a section selects it, and every card render shows that saved choice", () => {
  let saved = selectMockSection(undefined);
  assert.equal(saved, "full");
  saved = selectMockSection("reading");
  const quick = sectionChoiceHtml(saved, "mock-section-quick");
  const forms = sectionChoiceHtml(saved, "mock-section-forms");
  assert.match(quick, /name="mock-section-quick"/);
  assert.match(forms, /name="mock-section-forms"/);
  assert.equal(quick.includes('name="mock-section-forms"'), false);
  assert.deepEqual(selectedValues(quick), ["reading"]);
  assert.deepEqual(selectedValues(forms), ["reading"]);
  assert.match(quick, /is-selected"><input type="radio" role="radio" name="mock-section-quick" value="reading" aria-checked="true" checked><span class="segment-mark" aria-hidden="true">✓<\/span>只考閱讀/);
  assert.equal(quick.includes("is-selected\"><input type=\"radio\" role=\"radio\" name=\"mock-section-quick\" value=\"full\""), false);
  assert.equal(quick.includes("is-selected\"><input type=\"radio\" role=\"radio\" name=\"mock-section-quick\" value=\"listening\""), false);
  const css = readFileSync(new URL("../codex/styles.css", import.meta.url), "utf8");
  assert.match(css, /\.segment-item\.is-selected \{[^}]*background: #1f4fd8;[^}]*color: #fff;/);
  assert.match(css, /\.segment-item \{[^}]*min-height: 44px;/);
  assert.match(css, /\.segment-item:focus-within/);
});
