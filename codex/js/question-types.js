// 題型標籤與一句解法提醒（本站整理，非官方）。用在練習作答畫面和解析畫面。
// 以 questionType 為 key；有些題型在聽力和閱讀的做法不同，用 listening／reading 分開寫。

const SAME = (label, hint) => ({ label, hint });

export const QUESTION_TYPES = {
  // Part 1
  "object-state-being-processed": SAME("照片：物品狀態", "留意 being + 過去分詞的被動：是誰在做、什麼東西正在被處理。"),
  "object-position": SAME("照片：物品位置", "看物品在哪裡，介系詞（on、next to、behind）要和照片一致。"),
  "person-action": SAME("照片：人物動作", "主詞和動作都要對上照片，只對一半的選項是陷阱。"),
  // Part 2
  "5w1h-question": SAME("應答：Wh- 疑問句", "先抓開頭的疑問詞（who、when、where、why、how），再找對應類型的回答。"),
  "yes-no-question": SAME("應答：Yes／No 疑問句", "Yes／No 不是唯一答案，間接回答（我去查、問某人）也可能是對的。"),
  "indirect-response": SAME("應答：間接回答", "答非所問卻合理的回答：反問、推給別人、說明原因。"),
  "statement-response": SAME("應答：直述句", "回應要接得上語氣：同意、建議、說明處理方式。"),
  "negative-or-tag-question": SAME("應答：否定／附加問句", "看事實是不是，不要被字面的 Yes／No 騙。"),
  "counter-question": SAME("應答：反問", "用問題回答問題也可以是對的。"),
  "request-or-suggestion": SAME("應答：請求／建議", "常見回應是同意、婉拒或提出替代。"),
  "choice-question": SAME("應答：選擇問句", "直接選其中一個，不用 Yes／No。"),
  // Part 3 / 4 / 7 shared names
  detail: { listening: { label: "細節題", hint: "聽之前先看題目，聽到關鍵詞（人名、數字、時間）附近再確認答案。" }, reading: { label: "細節題", hint: "用題目裡的人名、數字、地點等關鍵詞回文章定位，核對那一句話。" } },
  "main-purpose": { listening: { label: "主旨／目的", hint: "主旨通常在開頭幾句；整段聽完再選最概括的。" }, reading: { label: "主旨／目的", hint: "看標題、第一段和結尾的請求，不要被中段的細節帶走。" } },
  inference: SAME("推論題", "答案不會原句出現；找文中暗示的內容，轉折或但書常是線索。"),
  "speaker-intent": SAME("說話者意圖", "回到那句話的前後句，想他為什麼這樣說，不要照字面翻。"),
  "next-action": SAME("接下來做什麼", "聽最後兩三句的 I'll、Let's、Could you 這類句型。"),
  graphic: SAME("圖表題", "聽到的數字或時間，要對到圖上沒被念出來的名稱。"),
  "cross-document": SAME("跨文件整合", "答案要把兩份文件的資訊合起來才知道，只看一份常少一個條件。"),
  "not-question": SAME("NOT 題", "三個選項符合文章，選不符合的那個；逐項回文章找一次。"),
  synonym: SAME("同義字", "把選項放回原句替換，看語意通不通，不要只憑字典意思。"),
  "chat-intent": SAME("簡訊／聊天意圖", "把那句話放回前後句，看它在回應什麼、想要對方做什麼。"),
  "text-insertion": SAME("句子插入位置", "看插入句裡的 However、This 或代名詞，找前後句接得起來的位置。"),
  // Part 5 / 6
  "part-of-speech": SAME("詞性", "先看空格的位置判斷需要名詞、動詞、形容詞還是副詞，再看選項字尾。"),
  "verb-tense-voice": SAME("時態／語態", "找時間線索（yesterday、by next week、since），再看主詞是做事的人還是承受者。"),
  "preposition-conjunction": SAME("介系詞／連接詞", "看後面接的是名詞還是完整子句，再決定用介系詞還是連接詞。"),
  pronoun: SAME("代名詞", "先找代名詞指的是誰，再判斷要主格、受格、所有格還是反身代名詞。"),
  "relative-pronoun": SAME("關係詞", "先判斷先行詞是人還是物，再看空格後面缺主詞還是缺受詞。"),
  "vocabulary-collocation": SAME("字彙搭配", "把動詞＋名詞或形容詞＋介系詞當成一組記，不要拆開。"),
  vocabulary: SAME("字彙", "把四個選項代回句子，選語意和前後文都通的。"),
  grammar: SAME("文法", "先判斷空格需要的句型或詞性，再排除不合文法的選項。"),
  "conjunctive-adverb": SAME("連接副詞", "看前後句的關係：轉折、因果、補充，再選對應的連接副詞。"),
  "sentence-insertion": SAME("Part 6 插入句", "看選項裡的連接詞和代名詞，確認接得上前一句、也帶得出下一句。")
};

// part：題組所在的 Part（3、4 是聽力，7 是閱讀；Part 5、6 為閱讀）。找不到就回傳 null，畫面就不顯示。
export function questionTypeInfo(type, part) {
  const entry = QUESTION_TYPES[type];
  if (!entry) return null;
  if (entry.listening || entry.reading) return Number(part) <= 4 ? entry.listening : entry.reading;
  return entry;
}

// 題型提示的三種模式：練習時顯示（預設）、全部顯示（含正式模擬）、關閉。
export const TYPE_MODES = [
  ["practice", "練習時顯示（預設）"],
  ["all", "全部顯示（含正式模擬）"],
  ["off", "關閉"]
];
export function normalizeTypeMode(value) {
  return TYPE_MODES.some(([id]) => id === value) ? value : "practice";
}
// 作答畫面要不要顯示題型提示。official 是正式模擬（快速模考、完整模擬、快練、200 題）。
export function typeHintVisible(mode, official) {
  const m = normalizeTypeMode(mode);
  if (m === "off") return false;
  if (m === "all") return true;
  return !official;
}
