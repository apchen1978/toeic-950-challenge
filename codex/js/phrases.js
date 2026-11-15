// 片語・搭配詞・同義改寫・Email 常用句。內容為本站整理的原創例句與說明，非 ETS 官方題目或字表。
// 搭配詞每筆：[片語, 中文, 英文例句, 例句中文, 挖空用的關鍵字]（關鍵字必須出現在例句中）。

export const COLLOCATIONS = [
  ["meet a deadline", "如期完成、趕上期限", "Our team worked overtime to meet the deadline.", "我們團隊加班以趕上期限。", "meet"],
  ["place an order", "下訂單", "You can place an order online or by phone.", "你可以在線上或用電話下訂單。", "place"],
  ["submit a proposal", "提交企劃書", "Please submit a proposal by the end of the month.", "請在月底前提交企劃書。", "submit"],
  ["conduct a survey", "進行問卷調查", "The firm will conduct a survey of its customers.", "公司將對顧客進行問卷調查。", "conduct"],
  ["reach an agreement", "達成協議", "The two companies reached an agreement on the price.", "兩家公司就價格達成協議。", "reached"],
  ["address a concern", "處理疑慮", "The manager addressed the concerns raised by staff.", "經理處理了員工提出的疑慮。", "addressed"],
  ["hold a meeting", "召開會議", "The board will hold a meeting next Tuesday.", "董事會下週二召開會議。", "hold"],
  ["take effect", "生效", "The new policy takes effect on July 1.", "新政策 7 月 1 日生效。", "takes"],
  ["be subject to change", "可能變更", "All prices are subject to change without notice.", "所有價格可能不另行通知而變動。", "subject"],
  ["be responsible for", "負責", "Ms. Lee is responsible for training new employees.", "李小姐負責訓練新進員工。", "responsible"],
  ["be eligible for", "有資格獲得", "Full-time employees are eligible for health benefits.", "全職員工有資格享有健康福利。", "eligible"],
  ["be committed to + V-ing", "致力於", "The company is committed to reducing waste.", "公司致力於減少浪費。", "committed"],
  ["in compliance with", "符合（規定）", "The building was renovated in compliance with safety rules.", "這棟建築依安全規定整修。", "compliance"],
  ["on behalf of", "代表", "I am writing on behalf of the sales department.", "我代表業務部寫這封信。", "behalf"],
  ["be in charge of", "主管、負責", "Mr. Park is in charge of the Seoul office.", "朴先生主管首爾辦公室。", "charge"],
  ["make a reservation", "預約、訂位", "I would like to make a reservation for four people.", "我想訂四個人的位子。", "make"],
  ["issue a refund", "核發退款", "The store will issue a refund within ten days.", "商店會在十天內核發退款。", "issue"],
  ["file a complaint", "提出申訴", "Customers may file a complaint through our website.", "顧客可透過網站提出申訴。", "file"],
  ["provide feedback", "提供意見回饋", "Please provide feedback on the new training program.", "請對新的訓練課程提供意見。", "provide"],
  ["run out of", "用完", "We are running out of printer paper.", "我們的影印紙快用完了。", "running"],
  ["comply with", "遵守", "All visitors must comply with the safety regulations.", "所有訪客都必須遵守安全規定。", "comply"],
  ["result in", "導致（結果）", "Poor planning resulted in a delay.", "規劃不佳導致延誤。", "resulted"],
  ["look into", "調查、研究", "We will look into the problem right away.", "我們會馬上調查這個問題。", "look"],
  ["call off", "取消", "The outdoor event was called off because of rain.", "戶外活動因下雨而取消。", "called"],
  ["put off", "延後", "The CEO decided to put off the announcement.", "執行長決定延後發布。", "put"],
  ["carry out", "執行、實施", "The team carried out a detailed inspection.", "團隊進行了詳細檢查。", "carried"],
  ["fill out a form", "填寫表格", "Please fill out the form and return it to the front desk.", "請填寫表格並交回櫃台。", "fill"],
  ["follow up on", "後續追蹤", "I will follow up on your request tomorrow.", "我明天會追蹤你的需求。", "follow"],
  ["turn down", "拒絕", "She turned down the job offer.", "她拒絕了那份工作邀約。", "turned"],
  ["take over", "接手", "Mr. Chen will take over the project next month.", "陳先生下個月接手這個專案。", "take"],
  ["sign up for", "報名", "Employees can sign up for the workshop online.", "員工可在線上報名工作坊。", "sign"],
  ["set up", "安排、設立、架設", "The IT team will set up the new computers.", "資訊組會架設新電腦。", "set"],
  ["apply for", "申請", "He applied for a position in the finance department.", "他申請財務部的職缺。", "applied"]
];

// 同義改寫：題目與選項常把原文換個說法。每筆 [原文常見說法, 選項可能換成, 備註]。
export const PARAPHRASES = [
  ["postpone", "push back／reschedule", "延後、改期"],
  ["cancel", "call off", "取消"],
  ["purchase", "buy／acquire", "購買"],
  ["inquire about", "ask about", "詢問"],
  ["assist", "help／support", "協助"],
  ["require", "need／be required to", "需要、規定"],
  ["reimburse", "pay back／refund", "報銷、退款"],
  ["complimentary", "free of charge", "免費的"],
  ["prior to", "before", "在……之前"],
  ["commence", "begin／start", "開始"],
  ["vacancy", "job opening／open position", "職缺"],
  ["inventory", "stock", "庫存"],
  ["revenue", "income／sales", "營收"],
  ["shipment", "delivery", "出貨、運送的貨物"],
  ["renovation", "remodeling／refurbishment", "整修"],
  ["personnel", "staff／employees", "人員"],
  ["attend", "take part in／be present at", "出席、參加"],
  ["supervisor", "manager／person in charge", "主管"]
];

// Email 常用句：讀信先抓寄信目的。每筆 [句型, 意思／目的]。
export const EMAIL_PHRASES = [
  ["I am writing to inquire about ...", "目的是詢問（常是信的第一段重點）"],
  ["I would appreciate it if you could ...", "客氣請求對方做某事"],
  ["Please find attached ...", "附上附件（要找信裡提到的附件內容）"],
  ["We regret to inform you that ...", "壞消息：拒絕、取消或延誤"],
  ["Please be advised that ...", "正式通知，後面常是規定或變更"],
  ["at your earliest convenience", "請盡快（沒有明確期限，但要儘早）"],
  ["Please feel free to contact me", "有問題請聯絡（常見結尾，不是新資訊）"],
  ["pending approval", "等待核准（還沒定案）"],
  ["in the event of ...", "萬一發生……（說明例外狀況怎麼處理）"],
  ["Thank you for your prompt reply", "感謝對方快速回覆（表示這是回信）"]
];

export function clozeOf(item) {
  const [, , en, , key] = item;
  return en.replace(key, "_____");
}
