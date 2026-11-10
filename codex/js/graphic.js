function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

export function graphicHtml(view) {
  if (!view || typeof view !== "object") return "";
  const caption = esc(view.caption || "Graphic");
  if (view.kind === "table" && Array.isArray(view.headers) && Array.isArray(view.rows)) {
    const head = view.headers.map((cell) => `<th scope="col">${esc(cell)}</th>`).join("");
    const body = view.rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("");
    return `<figure class="exam-graphic"><figcaption>${caption}</figcaption><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></figure>`;
  }
  if (view.kind === "svg" && typeof view.svg === "string" && view.svg.includes("<svg") && !/<script|javascript:|on\w+=/i.test(view.svg)) {
    return `<figure class="exam-graphic"><figcaption>${caption}</figcaption>${view.svg}</figure>`;
  }
  return "";
}
