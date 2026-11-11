export const ABILITIES = {
  L1: { section: "listening", title: "短對話主旨與目的", detail: "理解短對話談話主旨與目的" },
  L2: { section: "listening", title: "長對話／獨白主旨與目的", detail: "掌握長對話或獨白的主旨與目的" },
  L3: { section: "listening", title: "短對話細節", detail: "定位短句、照片描述與短對話的細節" },
  L4: { section: "listening", title: "長對話／獨白細節", detail: "定位長對話或獨白中的細節與條件" },
  L5: { section: "listening", title: "說話者意圖／隱含意思", detail: "從語氣、措辭與上下文推斷意圖" },
  R1: { section: "reading", title: "推論", detail: "從文章證據推斷未直接說明的意思" },
  R2: { section: "reading", title: "特定資訊", detail: "定位人物、日期、數字與明確條件" },
  R3: { section: "reading", title: "連結多句／多篇資訊", detail: "整合句子、文件與更新資訊" },
  R4: { section: "reading", title: "字彙", detail: "依上下文判斷字詞意思與用法" },
  R5: { section: "reading", title: "文法", detail: "運用句型、詞性、時態與連接關係" }
};

const MAIN_PURPOSE = /main purpose|mainly about|primary purpose|purpose of|what is the message|what are the speakers discussing|what .* speakers (?:are )?discussing|why are the speakers discussing/i;
const IMPLIED = /infer|imply|suggest|intend|mean\b|why does .* say|why does .* mention|why is .* said|most likely|probably|indirect|implied|隱含|間接/i;

export function assignAbility(group, question) {
  if (group.section === "listening") {
    const prompt = question.prompt ?? "";
    const explanation = question.explanation ?? "";
    if (group.part === 1) return "L3";
    if (group.part === 2) {
      const statement = (group.script ?? []).some((line) => !/[?？]\s*$/.test(line.text ?? ""));
      return statement || question.skill === "l-inference" || IMPLIED.test(`${prompt} ${explanation}`) ? "L5" : "L3";
    }
    if (IMPLIED.test(prompt) || question.skill === "l-inference" || question.skill === "l-intent") return "L5";
    if (MAIN_PURPOSE.test(prompt)) return group.part === 3 ? "L1" : "L2";
    return "L4";
  }

  if (question.skill === "r-grammar") return "R5";
  if (question.skill === "r-vocabulary") return "R4";
  if (question.crossRef === true || question.skill === "r-crossref") return "R3";
  if (group.part === 6 && /sentence/i.test(question.prompt ?? "")) return "R3";
  if (question.skill === "r-inference" || question.skill === "r-intent") return "R1";
  if (group.part === 7 && question.skill === "r-purpose") return "R1";
  return "R2";
}

export function abilityStats(questions, answers = {}) {
  const result = Object.fromEntries(Object.keys(ABILITIES).map((id) => [id, { correct: 0, answered: 0 }]));
  for (const question of questions ?? []) {
    const answer = answers[question.id];
    if (answer === undefined || answer === null) continue;
    const ability = result[question.ability];
    if (!ability) continue;
    ability.answered += 1;
    if (answer === question.answer) ability.correct += 1;
  }
  return result;
}

export function scoreBand(section, score) {
  if (!Number.isFinite(score)) return null;
  if (section === "listening") {
    if (score >= 400) return { level: "約 400+", strength: "能掌握多數職場對話與廣播的主旨、細節及常見推論。", gap: "語速較快、資訊密集或語氣含蓄時，仍可能漏掉關鍵條件。", next: "練習多人口音對話、說話者意圖與臨時變更題。" };
    if (score >= 300) return { level: "約 300–395", strength: "通常能理解常見主題和明確資訊。", gap: "同義改述、轉折與跨句細節容易混淆。", next: "每組先預讀問題，聽完記下時間、地點與改動，再核對逐字稿。" };
    if (score >= 200) return { level: "約 200–295", strength: "熟悉情境中的關鍵字與簡短回應較容易辨認。", gap: "較長內容、連續資訊和間接回答仍有負擔。", next: "用短段落反覆聽，先抓主旨，再練日期、人物和因果細節。" };
    return { level: "低於約 200", strength: "在簡短、熟悉的句子中已能累積部分線索。", gap: "連續語音中的關鍵詞、句意與說話者目的仍需加強。", next: "從短句與應答開始，聽一遍後看逐字稿，再重聽確認辨音。" };
  }
  if (score >= 450) return { level: "約 450+", strength: "能處理多數職場文本、細節與跨文件資訊。", gap: "資訊密集、字彙較難或條件分散時仍可能漏讀。", next: "練習長篇與多篇限時題，特別核對例外條款、日期和更新。" };
  if (score >= 350) return { level: "約 350–445", strength: "通常能定位明確資訊，也能理解一般通知與書信。", gap: "較難把同篇不同段落或多篇文件的訊息連起來。", next: "多做 cross-reference、NOT 題與長篇閱讀，逐題回原文找證據。" };
  if (score >= 250) return { level: "約 250–345", strength: "短篇與明確事實題已有可用基礎。", gap: "同義改寫、句子關係及長文細節較容易失分。", next: "交替練 Part 5/6 和單篇閱讀，再逐步加入雙篇題。" };
  if (score >= 150) return { level: "約 150–245", strength: "能從短文本找到部分直接資訊。", gap: "常見字彙、句型和較長句子的關係仍需穩固。", next: "先複習高頻職場字彙與基本句型，再練短通知和 email。" };
  return { level: "低於約 150", strength: "短句和明確標示可作為建立閱讀習慣的起點。", gap: "基本字義與句子結構會影響理解。", next: "從短通知、簡單 email 和核心字彙開始，讀完再對照原句。" };
}
