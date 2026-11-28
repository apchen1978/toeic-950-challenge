// 考前輕鬆看一遍：Part 1–7 各挑幾題「用看的」，作答後立刻出現對錯與解析。不計分、不計時、不出新題，全部是題庫裡既有的題目。
// 選題是固定的（固定亂數種子），每次打開都一樣，方便對照；內容為本站原創題，個人整理，非官方。
import { createRng, isVerifiedCrossRef, isActiveGroup } from "./quick-form.js";

const typeOf = (group) => String(group.questions?.[0]?.questionType ?? "");
const hasType = (group, pattern) => group.questions.some((question) => pattern.test(String(question.questionType ?? "")));

function sample(list, count, random) {
  const pool = list.slice();
  const out = [];
  while (out.length < count && pool.length) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
}

export const EVE_DAY_TIPS = [
  { title: "劃卡", body: "選好就立刻劃，劃一次、劃滿即可。每換一個 Part，核對一次題號有沒有對上，錯位會連錯一整排。" },
  { title: "聽力（紙本）", body: "聽到答案就立刻劃卡，劃完馬上預讀下一題或下一組的題幹與選項。Part 3、4 先掃題幹找關鍵字（問誰、問什麼）。" },
  { title: "圖表題", body: "先掃一眼圖上的標籤，再聽。答案常是圖上有、但話裡沒念出來的那個詞：聽到的條件，要對到圖上的另一欄。" },
  { title: "閱讀配速", body: "Part 5 每題約 20 秒、Part 6 約 30 秒、Part 7 約 60 秒。看 5 秒決定不了就先跳；最後 5 分鐘把空白全部填滿。" },
  { title: "條件字與 NOT", body: "unless、only if、except、less than、no later than 圈起來；NOT 題三個選項各找一個證據，剩下的就是答案。兩份文件有同樣的代碼或數字，先找哪份說明它是什麼。" },
  { title: "穩住自己", body: "覺得心跳快就慢慢呼吸（吸 4 下、吐 6 下）。考前不對答案、不和人討論題目。不會的放掉，下一題才是重點。" }
];

export const EVE_STUDY_NOTE = "考前輕鬆看一遍：不計分、不計時，選一個答案就立刻看到對錯與解析。全部是題庫裡的既有題目，不出新題。累了就停，看到「對，考題就是這個套路」就可以收手。";

export function pickEveStudy(bank, seed = 20261128) {
  const random = createRng(seed);
  const active = bank.groups.filter(isActiveGroup);
  const part = (n) => active.filter((group) => group.part === n);
  const one = (group) => ({ group, questionIds: [group.questions[0].id] });
  const whole = (group) => ({ group, questionIds: group.questions.map((question) => question.id) });
  const sections = [];

  const p1 = part(1);
  sections.push({
    part: 1, title: "Part 1 照片題", minutes: 3,
    hint: "看「動作 vs. 狀態」：正在穿（putting on）和穿著（wearing）不同；沒有人的畫面裡，is being + 過去分詞要有人正在做，否則是陷阱。",
    items: [...sample(p1.filter((group) => typeOf(group) === "object-state-being-processed"), 2, random), ...sample(p1.filter((group) => typeOf(group) === "person-action"), 1, random)].map(one)
  });

  const p2 = part(2);
  sections.push({
    part: 2, title: "Part 2 應答題", minutes: 5,
    hint: "看「迂迴回答」：母語人士常不正面回答（問時間卻說還沒確認、用反問、推給別人）。也留意同音或重複用字的干擾選項。這裡直接看文字，不用聽。",
    items: [
      ...sample(p2.filter((group) => typeOf(group) === "indirect-response"), 2, random),
      ...sample(p2.filter((group) => typeOf(group) === "negative-or-tag-question"), 1, random),
      ...sample(p2.filter((group) => typeOf(group) === "counter-question"), 1, random),
      ...sample(p2.filter((group) => typeOf(group) === "statement-response"), 1, random)
    ].map(one)
  });

  const graphicIds = ["g-gm-p3-05", "g-gm-p4-03"];
  const graphics = graphicIds.map((id) => active.find((group) => group.id === id)).filter(Boolean);
  const intent = sample([...part(3), ...part(4)].filter((group) => hasType(group, /speaker-intent/) && !group.graphicView), 1, random);
  sections.push({
    part: 3, title: "Part 3、4 對話與獨白（圖表題）", minutes: 9,
    hint: "練「題幹掃描＋圖表對應」：先抓題幹關鍵字（問誰、問什麼），再確認聽到的資訊要對到圖表上「另一欄」的哪一個詞。這裡的文字稿直接給你看。",
    items: [...graphics, ...intent].map(whole)
  });

  const p5all = part(5);
  const fresh = p5all.filter((group) => group.id.startsWith("g-sp-p5-"));
  const p5 = fresh.length >= 8 ? fresh : p5all;
  sections.push({
    part: 5, title: "Part 5 單句填空", minutes: 7,
    hint: "只看易混淆的介系詞、連接詞與語意辨析的題目；基本詞性題先跳過。看每個錯誤選項為什麼錯。",
    items: [
      ...sample(p5.filter((group) => typeOf(group) === "preposition-conjunction"), 4, random),
      ...sample(p5.filter((group) => typeOf(group) === "vocabulary-collocation"), 4, random)
    ].map(one)
  });

  sections.push({
    part: 6, title: "Part 6 段落填空（句子插入）", minutes: 4,
    hint: "專看「要填入整句話」的那一題：它怎麼用代名詞（this、such、they）或轉折語氣，接上前一句、帶出下一句。",
    items: sample(part(6).filter((group) => hasType(group, /sentence-insertion/)), 1, random).map((group) => ({ group, questionIds: group.questions.filter((question) => /sentence-insertion/.test(String(question.questionType ?? ""))).map((question) => question.id) }))
  });

  const cross = part(7).filter((group) => isVerifiedCrossRef(group) && group.passage?.docs?.length >= 2);
  const not = part(7).filter((group) => hasType(group, /not-question/) && (group.passage?.docs?.length ?? 0) <= 2);
  sections.push({
    part: 7, title: "Part 7 閱讀（跨篇交叉比對與 NOT）", minutes: 9,
    hint: "不求快：看題目怎麼把 A 文件的時間、人名，跟 B 文件的表格、條件串起來考；也看清楚 NOT、TRUE 這些題幹字眼。",
    items: [...sample(cross, 1, random), ...sample(not, 1, random)].map(whole)
  });
  return sections.filter((section) => section.items.length);
}

export function eveStudyMinutes(sections) {
  return sections.reduce((sum, section) => sum + section.minutes, 3);
}

// Part 5-7 快速過一遍（約 22 分鐘）：挑最容易卡關的型態——Part 5 字彙換字／動詞形式／介連詞，Part 6 字彙功能與句子插入，
// Part 7 條件字與例外、短行程表的同義替換、NOT 題、兩份文件的交叉比對。全部是題庫既有的題目，固定選題。
export function pickReadingSkim(bank, seed = 20261129) {
  const random = createRng(seed);
  const active = bank.groups.filter(isActiveGroup);
  const part = (n) => active.filter((group) => group.part === n);
  const eve = pickEveStudy(bank);
  const used = new Set(eve.flatMap((section) => section.items.map((item) => item.group.id)));
  const fresh = (list) => list.filter((group) => !used.has(group.id));
  const take = (list, count) => { const picked = sample(fresh(list).length >= count ? fresh(list) : list, count, random); picked.forEach((group) => used.add(group.id)); return picked; };
  const one = (group) => ({ group, questionIds: [group.questions[0].id] });
  const whole = (group) => ({ group, questionIds: group.questions.map((question) => question.id) });
  const docs = (group) => group.passage?.docs?.length ?? 0;
  const text = (group) => JSON.stringify(group.passage ?? "");
  const sections = [];

  const p5 = part(5);
  sections.push({
    part: 5, title: "Part 5 單句填空（字彙換字、動詞形式、介連詞）", minutes: 5,
    hint: "這三類最花時間：字彙換字看搭配與語意、動詞形式看主詞與時間線索、介系詞與連接詞看後面是名詞還是子句。練「看一眼就能排除」。",
    items: [...take(p5.filter((group) => typeOf(group) === "vocabulary-collocation"), 3), ...take(p5.filter((group) => typeOf(group) === "verb-tense-voice"), 2), ...take(p5.filter((group) => typeOf(group) === "preposition-conjunction"), 1)].map(one)
  });

  const p6 = part(6);
  const insertion = p6.filter((group) => hasType(group, /sentence-insertion/));
  sections.push({
    part: 6, title: "Part 6 段落填空（字彙功能、句子插入）", minutes: 6,
    hint: "字彙題要看這句話在段落裡的功能（例如預防和偵測不同）；句子插入看代名詞、轉折，確認接得上前一句、帶得出下一句。",
    items: [...take(p6.filter((group) => hasType(group, /^vocabulary$/)), 1), ...take(insertion, 1)].map(whole)
  });

  const p7 = part(7);
  const conditions = p7.filter((group) => docs(group) >= 2 && group.questions.some((question) => /unless|except|only if|no later than|at least|less than/i.test(question.explanation ?? "")));
  const schedules = p7.filter((group) => docs(group) === 1 && group.questions.length === 2 && /schedule|agenda|itinerary|banquet|dinner|session/i.test(text(group)));
  const nots = p7.filter((group) => hasType(group, /not-question/) && docs(group) <= 2);
  const cross = p7.filter((group) => isVerifiedCrossRef(group) && docs(group) >= 2);
  sections.push({
    part: 7, title: "Part 7 閱讀（條件與例外、短行程表、NOT、交叉比對）", minutes: 13,
    hint: "unless、no later than 這類條件字要回另一份文件用日期或數字驗證；短行程表注意同義替換（例如 banquet = 特別晚宴）；NOT 題三個選項各找證據；兩份文件有同一個代碼，先找哪份說明它是什麼。",
    items: [...take(conditions, 1), ...take(schedules, 1), ...take(nots, 1), ...take(cross, 1)].map(whole)
  });
  return sections.filter((section) => section.items.length);
}
