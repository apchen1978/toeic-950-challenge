// 7 個 Part 考前速查：每個 Part 3 個最經典的題型（怎麼認、怎麼做、常見陷阱）＋最後提醒。
// 本站自己的整理（個人整理，非官方）。題數與時間是公開的正式題型配置，做法是常見的參考做法，不是規定。

export const PART_GUIDE_NOTE = "個人整理，非官方，僅供練習參考。做法是常見的參考，不保證分數；實際規定以考試通知為準。";

export const PART_GUIDE = [
  {
    part: 1, section: "聽力", name: "照片描述", count: "6 題",
    glance: "四個選項都聽完再選；主詞和動作兩個都要對，只對一半就是陷阱。",
    types: [
      { name: "人物動作", spot: "照片裡有人在做事", how: "先抓畫面裡的人和動作，聽「主詞＋動詞」。", trap: "動作對、主詞錯；或把「正在被處理」安給畫面裡的人。" },
      { name: "物品狀態與位置", spot: "人很小或沒有人，重點是物品和場景", how: "看物品在哪（on、next to、behind）和狀態（stacked、empty、open）。", trap: "is being + 過去分詞要有人正在做；are stacked 才是「已經堆著」。" },
      { name: "沒有人的照片", spot: "風景、空辦公室、街景", how: "只聽物品、位置、狀態。", trap: "選項提到照片裡看不到的人（someone、pedestrians），一律不選。" }
    ],
    remember: ["不確定就用刪去法：看不到的人和東西都是錯的。", "每一句只要有一個細節對不上，整句就錯。"]
  },
  {
    part: 2, section: "聽力", name: "應答問題", count: "25 題",
    glance: "前三個字決定題型；一模一樣的字或音近字，多半是陷阱。",
    types: [
      { name: "Wh- 疑問句", spot: "who、when、where、why、how 開頭", how: "疑問詞對應答案：who＝人、when＝時間、where＝地點、why＝原因、how many＝數量。", trap: "用 Yes／No 回答 Wh-；選項和問句同音或重複用字。" },
      { name: "Yes／No 與選擇問句", spot: "Do、Is、Can 開頭，或 A or B？", how: "Yes／No 問句不一定出現 Yes／No；選擇問句直接挑一個，不回 Yes／No。", trap: "選擇問句回答 Yes／No 是錯的；否定問句要看事實（不是就說 No）。" },
      { name: "間接回答與陳述句", spot: "問句其實是請求、建議，或一句陳述", how: "想對方要什麼：同意、婉拒、提供資訊、推給別人（我去查、問經理）。", trap: "字面相同的選項反而是陷阱；答非所問卻合理的才是答案。" }
    ],
    remember: ["沒聽清楚就選最合理的，立刻準備下一題。", "這一段題本上沒有印字，只能靠耳朵，專心前三個字。"]
  },
  {
    part: 3, section: "聽力", name: "簡短對話", count: "39 題（13 段）",
    glance: "對話前和每組之間先讀題目；答案大致依對話順序出現；轉折後才是決定。",
    types: [
      { name: "主旨、地點、職業、目的", spot: "第一題常問在討論什麼、在哪裡、誰是誰", how: "聽對話前兩三句，抓場景和目的。", trap: "被中段細節帶走；選項只講到一個小細節。" },
      { name: "說話者意圖", spot: "What does the man mean when he says「…」？", how: "回到那句話的前後句，想他為什麼這樣說。", trap: "照字面翻譯，沒有放回上下文。" },
      { name: "圖表題與下一步", spot: "Look at the graphic；或問接下來會做什麼", how: "圖表：聽到的資訊對到圖上沒被念出來的欄位。下一步：聽最後兩三句的 I'll、Let's、Could you。", trap: "只看圖不聽；聽到第一個答案就選，後面其實改了。" }
    ],
    remember: ["三個人的對話要分清誰說了什麼。", "聽到 but、actually、instead 之後，才是最後的決定。"]
  },
  {
    part: 4, section: "聽力", name: "簡短獨白", count: "30 題（10 段）",
    glance: "先讀題目；結尾常交代下一步；數字和日期的變更要抓 before → after。",
    types: [
      { name: "主旨、說話者與聽眾", spot: "Who is the speaker？Why is the speaker calling？", how: "開頭一兩句交代；先判斷是廣播、留言、導覽還是公告。", trap: "把一個細節當成主旨。" },
      { name: "圖表題", spot: "Look at the graphic；表格、地圖、行程表", how: "聽到的時間或價格，對到圖上對應的名稱。", trap: "答案是圖上沒有被念出來的那一欄。" },
      { name: "結尾的請求與下一步", spot: "What are listeners asked to do？What will happen next？", how: "回想最後兩三句（Please、Remember to、Don't forget）。", trap: "拿前面的背景當成行動。" }
    ],
    remember: ["獨白只念一次，抓大意，不需要每個字都聽懂。", "公告類：改了什麼、何時改、為什麼改。"]
  },
  {
    part: 5, section: "閱讀", name: "句子填空", count: "30 題（約 10 分）",
    glance: "先看選項分類是文法題還是字彙題，不要翻譯整句；卡住就先跳。",
    types: [
      { name: "詞性", spot: "四個選項是同一個字根的不同詞性", how: "看空格位置：冠詞、所有格後接名詞；be 後接形容詞；修飾動詞用副詞。", trap: "只看字義，沒看位置。" },
      { name: "動詞：時態、語態、主詞動詞一致", spot: "選項是同一個動詞的不同形式", how: "找時間線索（yesterday、by next week、since）；主詞是做事還是被做，決定主動或被動。", trap: "單複數沒對上；被動漏了 be。" },
      { name: "介系詞、連接詞、字彙搭配", spot: "選項是意思不同的字", how: "空格後是名詞用介系詞（despite、because of）；是子句用連接詞（although、because）；字彙題代入看搭配。", trap: "despite 和 although 混用。" }
    ],
    remember: ["30 題約 10 分鐘，平均每題約 20 秒；看 5 秒決定不了就跳。", "建議、要求（suggest、require）後的 that 子句用原形。"]
  },
  {
    part: 6, section: "閱讀", name: "段落填空", count: "16 題（約 8 分）",
    glance: "它不是單句題：要讀前後句；插入句看連接詞和代名詞。",
    types: [
      { name: "句子插入", spot: "選項是四個完整的句子", how: "看選項裡的 However、This、Also 或代名詞，確認接得上前一句、帶得出下一句。", trap: "只看那一句自己通不通順。" },
      { name: "連接副詞與轉折", spot: "選項是 However、Therefore、In addition", how: "判斷前後兩句的關係：轉折、因果還是補充。", trap: "只讀空格那一句，沒讀前一句。" },
      { name: "文法詞形（要看上下文）", spot: "時態、代名詞指誰", how: "往前往後各讀一兩句，找時間線索或代名詞指的對象。", trap: "當成 Part 5 單句題做，漏掉上下文。" }
    ],
    remember: ["先做快的詞形題，再做插入句。", "16 題約 8 分鐘，每題約 30 秒。"]
  },
  {
    part: 7, section: "閱讀", name: "閱讀理解", count: "54 題（約 52 分）",
    glance: "先看題目再回文章找；NOT、推論和多篇整合留到同一組的最後做。",
    types: [
      { name: "細節題與 NOT 題", spot: "題目有人名、數字、日期；或大寫的 NOT、EXCEPT", how: "細節：用關鍵詞定位，核對那一句。NOT：三個選項各找一個證據，剩下的就是答案。", trap: "選項有出現原字就選，反而常是干擾；NOT 題看漏了 NOT。" },
      { name: "推論、同義字、簡訊意圖", spot: "implied、suggested、closest in meaning、When he writes「…」", how: "推論：答案是暗示，不會原句出現。同義字：代回原句看語意通不通。意圖：放回前後句。", trap: "推論過度；把字典意思硬套進去。" },
      { name: "多篇整合與句子插入", spot: "雙篇或三篇文件；[1][2][3][4] 插入位置", how: "多篇：兩份文件的資訊合起來才知道。插入：先找插入句的線索詞，再找前後句接得起來的位置。", trap: "只看一份文件就選。" }
    ],
    remember: ["單題平均約 1 分鐘；卡住先跳，最後 5 分鐘把空白全部填滿（不倒扣）。", "常見做法是先做單篇，多篇留到後面。"]
  }
];
