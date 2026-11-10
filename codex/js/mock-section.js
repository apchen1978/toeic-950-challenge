import { normalizeMockSection } from "./scoring.js";

export const MOCK_SECTION_OPTIONS = [
  ["full", "完整模考（聽力→閱讀）"],
  ["reading", "只考閱讀"],
  ["listening", "只考聽力"]
];

/** The value stored after a tap. Unknown values fall back to a full exam. */
export function selectMockSection(value) {
  return normalizeMockSection(value);
}

/**
 * One radiogroup. `groupName` must differ on every card: radios that share a
 * name are a single group, and the browser keeps only the last `checked` one.
 */
export function sectionChoiceHtml(current, groupName) {
  const selected = selectMockSection(current);
  const options = MOCK_SECTION_OPTIONS.map(([value, label]) => {
    const on = value === selected;
    return `<label class="segment-item${on ? " is-selected" : ""}"><input type="radio" role="radio" name="${groupName}" value="${value}" aria-checked="${on ? "true" : "false"}"${on ? " checked" : ""}><span class="segment-mark" aria-hidden="true">${on ? "✓" : ""}</span>${label}</label>`;
  }).join("");
  return `<div class="segment" role="radiogroup" aria-label="模考範圍">${options}</div>`;
}
