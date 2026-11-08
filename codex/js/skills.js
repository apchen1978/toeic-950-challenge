// Skill tags used in data/questions.json. Labels and study tips are shown in the UI (Traditional Chinese).
export const SKILLS = {
  "l-photo": { label: "聽力・照片描述", tip: "先看人物動作和物品位置，再辨認語音中相近但不符合畫面的描述。" },
  "l-response": { label: "聽力・應答（間接回答）", tip: "練習聽出「答非所問卻合理」的回答：反問、推給他人、說明原因。看到 Yes/No 回答 Wh- 問題、或單字／音近重複，先打叉。" },
  "l-conversation": { label: "聽力・對話細節", tip: "先讀題目再聽，抓數字、日期、人名；注意「提出的時間」與「最後同意的時間」不同的陷阱。" },
  "l-inference": { label: "聽力・推論／意圖／下一步", tip: "聽對話最後 2–3 句找 next action；遇到引述句，回到上一句找原因。" },
  "l-talk": { label: "聽力・獨白（公告）", tip: "公告類每個「改變」都可能成題：誰改、何時改、為什麼。邊聽邊記 before → after。" },
  "r-grammar": { label: "閱讀・句型文法", tip: "先判斷空格詞性與句型（連接詞、關係代名詞、主詞動詞一致），再看選項。複習 neither...nor、whose、條件連接詞。" },
  "r-vocabulary": { label: "閱讀・字彙搭配", tip: "背搭配詞而非單字：discrepancies in records、consolidate budgets。錯題整理成搭配詞卡。" },
  "r-purpose": { label: "閱讀・目的／主旨", tip: "只看首段與結尾請求，找出「這封信要讀者做什麼」。" },
  "r-detail": { label: "閱讀・細節", tip: "用關鍵詞定位，注意否定句與限制條件（only、except、at least）。" },
  "r-inference": { label: "閱讀・推論", tip: "選項不會出現原句，找「文中暗示但未明說」的內容；警告或但書常是推論來源。" },
  "r-contract": { label: "閱讀・合約／法律用語", tip: "把 may / shall / provided that / survive / cure 當成固定詞組熟悉；區分「為方便終止」與「因違約終止」的條件。" },
  "r-intent": { label: "閱讀・對話串意圖", tip: "把慣用語放回前後句：這句話在回應對方哪個擔心？" },
  "r-crossref": { label: "閱讀・雙篇交叉比對", tip: "先把兩篇各自的條件列出，再對照日期與人數；常見陷阱是已過期的優惠與不可併用的折扣。" }
};

export function skillLabel(key) {
  return SKILLS[key]?.label ?? key;
}
