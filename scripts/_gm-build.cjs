// Builds the g-gm-* groups from Codex's draft (gm-groups.json) with CC's review edits, renders the graphics and balances answer positions.
// Usage: node scripts/_gm-build.cjs <draft.json> <out.json>
const fs = require('fs');
const draft = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const S = 'stroke="currentColor"';
const text = (x, y, t, o = {}) => `<text x="${x}" y="${y}" fill="currentColor" font-size="${o.size || 12}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.bold ? ' font-weight="700"' : ''}>${esc(t)}</text>`;
const line = (x1, y1, x2, y2, sw = 2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${S} stroke-width="${sw}"/>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-hidden="true">${body}</svg>`;
function flow(spec) {
  const n = spec.steps.length, w = 62, gap = 14, x0 = 12, h = 56;
  const total = x0 * 2 + n * w + (n - 1) * gap;
  let b = text(total / 2, 18, spec.caption, { anchor: 'middle', bold: true, size: 13 });
  spec.steps.forEach((label, i) => {
    const x = x0 + i * (w + gap);
    b += `<rect x="${x}" y="40" width="${w}" height="${h}" fill="none" ${S} stroke-width="2"/>` + text(x + w / 2, 58, 'Step ' + (i + 1), { anchor: 'middle', size: 10, bold: true });
    label.split(' ').forEach((word, k) => { b += text(x + w / 2, 74 + k * 12, word, { anchor: 'middle', size: 10 }); });
    if (i < n - 1) b += line(x + w, 68, x + w + gap - 3, 68, 2) + `<polygon points="${x + w + gap - 1},68 ${x + w + gap - 7},64 ${x + w + gap - 7},72" fill="currentColor"/>`;
  });
  return svg(total, 112, b);
}
function bar(spec) {
  const max = Math.max(...spec.values), top = Math.ceil(max / 100) * 100, W = 360, H = 215, plot = 150;
  let b = text(190, 14, spec.caption, { anchor: 'middle', bold: true, size: 12 }) + line(50, 28, 50, 28 + plot, 2) + line(50, 28 + plot, 340, 28 + plot, 2);
  for (let v = 0; v <= top; v += 100) b += text(44, 32 + plot - v * plot / top, String(v), { anchor: 'end', size: 10 });
  const step = 280 / spec.values.length;
  spec.values.forEach((v, i) => {
    const h = v * plot / top, bw = Math.min(40, step - 14), x = 50 + i * step + (step - bw) / 2;
    b += `<rect x="${x}" y="${28 + plot - h}" width="${bw}" height="${h}" fill="currentColor" fill-opacity="0.55" ${S}/>` + text(x + bw / 2, 28 + plot - h - 4, String(v), { anchor: 'middle', size: 10 }) + text(x + bw / 2, 28 + plot + 14, spec.labels[i].slice(0, 3), { anchor: 'middle', size: 11 });
  });
  return svg(W, H, b);
}
const view = (spec, listHeaders) => {
  if (spec.kind === 'table') return { kind: 'table', caption: spec.caption, headers: spec.headers, rows: spec.rows };
  if (spec.kind === 'list') return { kind: 'table', caption: spec.caption, headers: listHeaders || ['Item', 'Assignment'], rows: spec.rows };
  if (spec.kind === 'flow') return { kind: 'svg', caption: spec.caption, svg: flow(spec) };
  if (spec.kind === 'bar') return { kind: 'svg', caption: spec.caption, svg: bar(spec) };
  throw new Error('kind ' + spec.kind);
};
const G = Object.fromEntries(draft.map((g) => [g.id, g]));
const setQ = (gid, qid, patch) => { const q = G[gid].questions.find((x) => x.id === qid); if (!q) throw new Error(qid); Object.assign(q, patch); };
const setLine = (gid, i, t) => { G[gid].script[i].text = t; };
// ---- CC review edits: every graphic question must depend on BOTH the audio and the graphic ----
setQ('g-gm-p3-02', 'GMP302C', { prompt: 'Look at the graphic. Which step is the woman working on now?', options: ['Confirm order', 'Check stock', 'Prepare package', 'Arrange pickup'], answer: 2, explanation: 'She is wrapping the glass pieces now. On the chart that is the Prepare package step; stock was already checked and the pickup is booked next.' });
setLine('g-gm-p3-03', 2, 'Not at our time. The room that fits twenty-two people and opens at ten is the one we want, and the instructor can start then.');
setQ('g-gm-p3-03', 'GMP303B', { explanation: 'Willow is not free at ten, Birch and Pine are too small, and Maple seats 24 and is available at 10:00. The room name is never said.' });
setQ('g-gm-p3-04', 'GMP304C', { prompt: 'Look at the graphic. Which step has already been completed?', options: ['Log request', 'Inspect device', 'Order part', 'Test repair'], answer: 0, explanation: 'The woman says a service request has already been logged, which is the first step on the workflow.' });
setLine('g-gm-p3-06', 2, 'No, attendance dipped after June and then reached its highest point later in the summer.');
setLine('g-gm-p3-06', 3, "Let's use the figures from that busiest month in the annual report.");
setQ('g-gm-p3-06', 'GMP306A', { prompt: 'What will the man include in the annual report?', options: ['Figures from the busiest month', 'The spring event schedule', 'The July budget', 'The June survey'], answer: 0, explanation: 'He says they will use the figures from the busiest month.' });
setQ('g-gm-p3-06', 'GMP306C', { prompt: 'Look at the graphic. About how many visitors will be reported for that month?', options: ['320', '390', '460', '520'], answer: 3, explanation: 'The busiest month is the one after the dip, August, with 520 visitors. The month and the number are never said.' });
G['g-gm-p4-01'].script[0].text = "Good morning, drivers. Today's first stops are listed on the dispatch board. Medical supplies and bakery orders go out first. The route carrying garden materials is delayed until the afternoon because of a road inspection. Please load the library returns last. Check your vehicle number with the desk before leaving.";
setQ('g-gm-p4-01', 'GMP401B', { prompt: 'Look at the graphic. Which route is delayed until the afternoon?', options: ['North loop', 'Market route', 'River district', 'Hill route'], answer: 3, explanation: 'The route carrying garden materials is delayed. The list shows garden materials on the Hill route, which is never named.' });
setQ('g-gm-p4-02', 'GMP402C', { prompt: 'Look at the graphic. Which step should wait until an incomplete address is fixed?', options: ['Verify payment', 'Confirm address', 'Pick items', 'Pack order'], answer: 2, explanation: 'The speaker says to contact the customer before picking any items, so the Pick items step waits.' });
G['g-gm-p4-03'].script[0].text = "Registration is open for next month's community classes. The wood carving course now has two additional seats, and the supply list will be sent after enrollment. The evening class on fixing household items begins at six on Thursdays. Please note that fees must be paid online before the first session. Call the center if you need an accessible entrance or wish to change your registration.";
setQ('g-gm-p4-03', 'GMP403A', { prompt: 'What must participants do before the first session?', options: ['Pay online', 'Buy supplies', 'Call the center', 'Send a photo'], answer: 0, explanation: 'The speaker says fees must be paid online before the first session.' });
setQ('g-gm-p4-03', 'GMP403C', { prompt: 'Look at the graphic. How much is the class that begins at six on Thursdays?', options: ['$26', '$38', '$30', '$18'], answer: 2, explanation: 'The Thursday evening class on fixing household items is Repair basics, which costs $30. The class name and price are not said.' });
G['g-gm-p4-04'].script[0].text = "The museum's late-year program attracted strong attendance. October exceeded September, but the following month was a little quieter. Attendance then reached its peak, helped by the evening exhibit. The last month on the chart stayed above the September level, although it did not match the peak. We will keep the exhibit open one extra week next year and compare the results.";
setQ('g-gm-p4-04', 'GMP404B', { prompt: "How does the speaker describe the last month's attendance?", options: ['The highest of the program', 'Above September but below the peak', 'Lower than September', 'The same as October'], answer: 1, explanation: 'The last month stayed above the September level but did not match the peak.' });
setQ('g-gm-p4-04', 'GMP404C', { explanation: 'The month after the quieter one reached the peak. On the chart that is December, the tallest bar at 610. The month is never named.' });
setQ('g-gm-p4-06', 'GMP406C', { prompt: 'Look at the graphic. At which step does the facilities team contact the requester about an unavailable room?', options: ['Submit request', 'Review schedule', 'Prepare room', 'Complete work'], answer: 1, explanation: 'The team reviews the schedule each morning and contacts the requester if a room will be unavailable. That is the Review schedule step.' });

const listHeaders = { 'g-gm-p4-01': ['Route', 'Cargo'], 'g-gm-p4-05': ['Booth', 'Group'] };
// options whose order carries meaning (numbers, months, steps, booth letters) must not be shuffled
const fixedOrder = new Set(['Log request|Inspect device|Order part|Test repair', 'Verify payment|Confirm address|Pick items|Pack order', 'Submit request|Review schedule|Prepare room|Complete work', 'Confirm order|Check stock|Prepare package|Arrange pickup', 'North loop|Market route|River district|Hill route', 'Birch|Maple|Willow|Pine']);
const ordered = (q) => fixedOrder.has(q.options.join('|')) || q.options.every((o) => /^(Pier \d|Booth [A-D]|Gate|\$\d|\d+$|Step|January|February|March|April|May|June|July|August|September|October|November|December)/.test(o));
const out = draft.map((g) => ({
  id: g.id, section: 'listening', part: g.part, accent: g.accent, title: g.title, graphic: true,
  graphicView: view(g.graphicSpec, listHeaders[g.id]),
  script: g.script.map((l) => ({ speaker: l.speaker, text: l.text })),
  questions: g.questions.map((q) => ({ id: q.id, skill: g.part === 3 ? 'l-conversation' : 'l-talk', prompt: q.prompt, options: q.options.slice(), answer: q.answer, explanation: q.explanation, graphic: !!q.graphic, ability: 'L4', questionType: q.graphic ? 'graphic' : 'detail' }))
}));
const count = () => { const c = [0, 0, 0, 0]; out.forEach((g) => g.questions.forEach((q) => c[q.answer]++)); return c; };
console.error('before', count());
for (let pass = 0; pass < 60; pass++) {
  const c = count(); const lo = c.indexOf(Math.min(...c)), hi = c.indexOf(Math.max(...c));
  if (c[hi] - c[lo] <= 2) break;
  const cand = out.flatMap((g) => g.questions).find((q) => q.answer === hi && !ordered(q));
  if (!cand) break;
  const correct = cand.options[cand.answer]; const rest = cand.options.filter((_, i) => i !== cand.answer);
  rest.splice(lo, 0, correct); cand.options = rest; cand.answer = lo;
}
console.error('after', count());
fs.writeFileSync(process.argv[3], JSON.stringify(out));
