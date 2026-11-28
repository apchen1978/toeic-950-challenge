// 終極精選 30 分鐘：Part 1–7 的 Tips、重要方向與最值得看的題目，全部中英對照。不計分、不計時，選答案立刻看對錯與解析。
// 題目是題庫與聽力小課程裡既有的內容，固定選題；個人整理，非官方。

export const ULT_INTRO_EN = "Ultimate Pick · about 30 minutes · English on top, Chinese below · tap an answer to see right or wrong at once.";
export const ULT_INTRO_ZH = "終極精選，約 30 分鐘，英文在上、中文在下；點選一個答案就立刻看到對錯與解析。不計分、不計時，累了就停。";

export const ULT_DAY_TIPS = [
  { en: "Marking", zh: "劃卡", tip: "Mark as soon as you decide; one solid fill is enough. Check the question number at every new Part.", tipZh: "決定了就立刻劃，劃一次劃滿即可；每換一個 Part，核對題號有沒有對上。" },
  { en: "Listening (paper test)", zh: "聽力（紙本）", tip: "Mark the moment you hear the answer, then preview the next question.", tipZh: "聽到答案就劃卡，劃完馬上預讀下一題。" },
  { en: "Graphics", zh: "圖表題", tip: "Scan the labels first. The answer is on the graphic but usually not spoken.", tipZh: "先掃圖上的標籤；答案常在圖上，話裡不會直接念出來。" },
  { en: "Reading pace", zh: "閱讀配速", tip: "About 20 s per Part 5 item, 30 s for Part 6, 60 s for Part 7. Skip if stuck; fill every blank in the last 5 minutes.", tipZh: "Part 5 約 20 秒、Part 6 約 30 秒、Part 7 約 60 秒；卡住先跳，最後 5 分鐘把空白全部填滿。" },
  { en: "Conditions and NOT", zh: "條件字與 NOT", tip: "Circle unless / only if / no later than; for NOT, find evidence for each of the other three options.", tipZh: "unless、only if、no later than 圈起來；NOT 題三個選項各找證據，剩下的就是答案。" },
  { en: "Stay steady", zh: "穩住自己", tip: "Breathe in for 4, out for 6. Skip what you do not know; the next question is what matters.", tipZh: "吸 4 下、吐 6 下；不會的放掉，下一題才是重點。" }
];

export const ULT_PARTS = [
  {
    part: 1, title: "Part 1 照片題 · Photographs", minutes: 2,
    direction: { en: "Action vs. state", zh: "看「動作 vs. 狀態」" },
    tips: [
      ["putting on = in the act of dressing; wearing = already dressed.", "putting on 是「正在穿」，wearing 是「穿著」。"],
      ["No people in the photo? \"is being + past participle\" needs someone doing it, so it is a trap.", "沒有人的畫面，is being + 過去分詞要有人正在做，所以常是陷阱。"],
      ["Listen to all four. One wrong detail makes the whole sentence wrong.", "四個都聽完，只要有一個細節不對，整句就錯。"]
    ],
    items: [{ kind: "lesson", id: "part1-measuring-parts" }, { kind: "bank", id: "g-photo-04" }]
  },
  {
    part: 2, title: "Part 2 應答題 · Question–Response", minutes: 3,
    direction: { en: "Indirect answers", zh: "看「迂迴回答」" },
    tips: [
      ["Native speakers often do not say yes/no: \"Not yet\", \"I haven't seen…\", a counter-question, or pass it to someone else.", "母語人士常不直接說 yes/no：「還沒」「我還沒看」、反問、或推給別人。"],
      ["The same word or a sound-alike in an option is usually a trap.", "選項裡一模一樣的字或音近字，多半是陷阱。"],
      ["Focus on the first three words of the question.", "專心聽問句的前三個字。"]
    ],
    items: [{ kind: "lesson", id: "part2-brochures" }, { kind: "bank", id: "g-xl-p2-03" }, { kind: "bank", id: "g-a-p2-03" }]
  },
  {
    part: 3, title: "Part 3 對話 · Conversations（圖表題）", minutes: 3,
    direction: { en: "Scan the questions, then match the graphic", zh: "題幹掃描＋圖表對應" },
    tips: [
      ["Read the question stems first: who, what, which.", "先讀題幹：問誰、問什麼、哪一個。"],
      ["Map what you hear to a different column on the graphic.", "把聽到的資訊，對到圖上「另一欄」的詞。"],
      ["After \"but / actually / instead\", the final decision comes.", "聽到 but、actually、instead 之後，才是最後的決定。"]
    ],
    items: [{ kind: "bank", id: "g-gm-p3-05" }]
  },
  {
    part: 4, title: "Part 4 獨白 · Talks", minutes: 3,
    direction: { en: "Announcements: what changed, when, why", zh: "公告類：改了什麼、何時改、為什麼改" },
    tips: [
      ["Identify the speaker and audience in the first sentence or two.", "開頭一兩句先判斷說話者與聽眾。"],
      ["The ending often gives the next step: Please / Remember to.", "結尾常交代下一步（Please、Remember to）。"],
      ["Catch numbers and dates: before → after.", "數字與日期要抓「變更前 → 變更後」。"]
    ],
    items: [{ kind: "lesson", id: "part4-parking-closure" }]
  },
  {
    part: 5, title: "Part 5 單句填空 · Incomplete Sentences", minutes: 4,
    direction: { en: "Vocabulary, verb forms, prepositions and conjunctions", zh: "字彙換字、動詞形式、介系詞與連接詞" },
    tips: [
      ["Check the position first: noun, adjective, adverb, or verb?", "先看空格的位置：名詞、形容詞、副詞還是動詞？"],
      ["About 20 seconds each. If 5 seconds is not enough, skip.", "每題約 20 秒；看 5 秒決定不了就先跳。"],
      ["Preposition + noun; conjunction + clause.", "介系詞後接名詞，連接詞後接子句。"]
    ],
    items: [
      { kind: "bank", id: "xf-p5-28" }, { kind: "bank", id: "g-cov-p5-45" }, { kind: "bank", id: "g-xs-r11" },
      { kind: "bank", id: "g-cov-p5-29" }, { kind: "bank", id: "g-rdnew-002" }, { kind: "bank", id: "g-sp-p5-25" }
    ]
  },
  {
    part: 6, title: "Part 6 段落填空 · Text Completion", minutes: 4,
    direction: { en: "Function in context, sentence insertion", zh: "字彙功能與句子插入" },
    tips: [
      ["Read the sentence before and after the blank; do not treat it like Part 5.", "前後句都讀，不要當成 Part 5 單句題。"],
      ["For an inserted sentence, look at this / such / they and transitions linking the sentences.", "插入句看 this、such、they 與轉折語，確認接得上前後句。"]
    ],
    items: [{ kind: "bank", id: "g-new-text" }]
  },
  {
    part: 7, title: "Part 7 閱讀理解 · Reading Comprehension", minutes: 8,
    direction: { en: "Cross-referencing, conditions, NOT", zh: "跨篇交叉比對、條件字、NOT" },
    tips: [
      ["Circle unless / only if / no later than, then verify with dates or numbers in the other document.", "條件字圈起來，再用另一份文件的日期或數字驗證。"],
      ["Same code or number in two documents? Find which one explains it.", "兩份文件有同樣的代碼或數字，先找哪份說明它是什麼。"],
      ["Short two-question documents are quick points. Do not rush them.", "只有兩題的小文件是最容易拿分的快題，別趕。"]
    ],
    items: [{ kind: "bank", id: "s03-double" }, { kind: "bank", id: "p7f-s02-07" }]
  }
];

export function ultimateMinutes() {
  return 3 + ULT_PARTS.reduce((sum, part) => sum + part.minutes, 0);
}
