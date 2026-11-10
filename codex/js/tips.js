// Short, attributable TOEIC listening and reading strategies. Chinese is the primary wording.
// These notes do not change timers or official audio pacing.

export const TIPS_STORAGE_KEY = "tips-on.v1";

export function tipsEnabled(stored) {
  return stored !== false;
}

export const TIP_SECTIONS = [
  {
    id: "p1",
    part: 1,
    title: "Part 1 照片描述 Photographs",
    short: "先看是「人在做」還是「東西正在被處理」。being + p.p. 常把動作安錯對象。",
    tips: [
      {
        title: "人與物要對上 People vs. object",
        body: "照片題會念四句，只有一句同時講對畫面裡的人、物和動作。先找主詞：句中是人在做事，還是物品本身。",
        why: "主詞對了、動作卻安在另一個人或另一件物品上，整句就不對。"
      },
      {
        title: "being + 過去分詞的被動陷阱",
        body: "聽到 is being moved / is being served，先問「誰是承受者」。人被服務，和人正在服務別人，是兩件不同的事。",
        why: "被動語態會讓你以為畫面裡的人正在做那件事，其實那個人只是被處理的對象。"
      }
    ],
    sources: [
      { name: "ETS 官方樣題 Directions：四句描述，只念一次", href: "https://www.ets.org/pdfs/toeic/toeic-listening-reading-sample-test.pdf" },
      { name: "忠欣：聽力題型與時間", href: "https://www.toeic.com.tw/toeic/listening-reading/about/content/" }
    ]
  },
  {
    id: "p2",
    part: 2,
    title: "Part 2 應答問題 Question-Response",
    short: "先聽第一個詞是 Wh- 還是 Yes/No。答案可以不直接，也可以不重複你聽到的單字。",
    tips: [
      {
        title: "先抓第一個詞 Wh- / Yes-No",
        body: "Where / When / Who / Why / How 要的是地點、時間、人、原因或方式。以 Yes 開頭的句子，常常答非所問。",
        why: "ETS 的範例 Where is the meeting room? 裡，To meet the new director. 和 Yes, at two o'clock. 都不是在回答地點。"
      },
      {
        title: "同音或相似字 Similar-sound traps",
        body: "選項裡出現題目剛剛說過的字，不代表它答對了問題。先判斷它有沒有回答被問的那一件事。",
        why: "重聽同一個字很容易選到語意無關的句子。"
      },
      {
        title: "間接回答 Indirect replies",
        body: "正確選項可以是反問、把事情推給別人，或說自己也不知道。例如 Ask Sarah, she's handling it.、Hasn't the memo gone out?、I just got here myself.",
        why: "練習時留意回應是否切合問題，即使它沒有直接說出答案，也不一定會重複問題中的單字。"
      }
    ],
    sources: [
      { name: "ETS Examinee Handbook 應答範例", href: "https://www.ets.org/content/dam/ets-org/de/pdfs/toeic/toeic-4-skills-tests-examinee-handbook.pdf" },
      { name: "ETS Global：不完整句與言外之意", href: "https://www.etsglobal.org/gp/en/help-center/test-content/format-questions-toeic-listening-reading" }
    ]
  },
  {
    id: "p3",
    part: 3,
    title: "Part 3 簡短對話 Conversations",
    short: "可利用方向說明和答完題後的時間，先看下一組問題。",
    tips: [
      {
        title: "先看問題 Preview",
        body: "在該部分的 Directions 時，以及一組三題答完、下一段還沒開始時，先讀下一組問題。選項可以略看。",
        why: "對話只念一次，而且不會印在題本上。先知道要聽什麼，比較不會整段聽完卻忘了問的是哪一句。"
      },
      {
        title: "依序留意對話重點",
        body: "一邊聽一邊留意問題需要的人物、時間和行動，再根據整段對話核對選項。",
        why: "先看問題能幫助你留意相關細節；不要假設答案一定依固定順序出現。"
      }
    ],
    sources: [
      { name: "ETS 官方樣題 Part 3 Directions", href: "https://www.ets.org/pdfs/toeic/toeic-listening-reading-sample-test.pdf" },
      { name: "IIBC：題型說明", href: "https://www.iibc-global.org/english/toeic/test/lr/about/format.html" }
    ]
  },
  {
    id: "p4",
    part: 4,
    title: "Part 4 簡短獨白 Talks",
    short: "圖表題要把聽到的數字或時間，對到圖上另一個沒被念出來的名稱。",
    tips: [
      {
        title: "圖表對應 Graphic mapping",
        body: "看到 Look at the graphic. 時，留意錄音中的時間、價格、位置或其他線索，再對照圖表確認選項。",
        why: "這類題需要結合聽到的內容和圖表資訊；不同題目的線索形式可能不同。"
      },
      {
        title: "三指記答案（可選，不是加分方法）",
        body: "一組三題可以暫時用手指記住 A/B/C，等這段念完再劃卡，眼睛就不用在錄音中途去找答案卡。這只是記憶方式，不保證比較高分，動作也要小，避免看起來像在傳訊。",
        why: "正式規則不允許在試題本劃記、做筆記，也不能使用計算紙。答案只算劃在答案卡上的那一格。"
      }
    ],
    sources: [
      { name: "ETS 官方樣題圖表題", href: "https://www.ets.org/pdfs/toeic/toeic-listening-reading-sample-test.pdf" },
      { name: "ETS Global：聽力與圖表的連結", href: "https://www.etsglobal.org/gp/en/help-center/test-content/format-questions-toeic-listening-reading" },
      { name: "忠欣：為什麼不能劃記題本", href: "https://www.toeic.com.tw/quick-links/faq/toeic-listening-reading/test-regulations/no-marking-test-book" },
      { name: "ETS Handbook：答案劃在答案卡，不可用計算紙", href: "https://toeic.com.tw/Upload/att/2020-11/202603171012062392298991.pdf" }
    ]
  },
  {
    id: "p5",
    part: 5,
    title: "Part 5 句子填空 Incomplete Sentences",
    short: "四個選項若是同一字根，先判斷空格要的詞性，不要先翻譯整句。卡住就先跳。",
    tips: [
      {
        title: "先看詞性 Part of speech",
        body: "選項若像 regular / regularity / regulate / regularly，先看空格前後：冠詞或介系詞後面常是名詞，名詞前常是形容詞，動詞或形容詞前常是副詞。",
        why: "這種題考的是字在句子裡的位置。意思大致相同，錯的是詞性。ETS 樣題第 103 題就是這一型。"
      },
      {
        title: "卡住就先跳 Skip when stuck",
        body: "一句超過你預期的時間還沒有把握，可先記住位置，做完後面的題再回來。正式考試不可在題本或答案卡上額外做記號；閱讀部分可在閱讀時間內回頭。",
        why: "ETS 考生手冊寫：不要在任何一題停留太久；不知道就先往下，有時間再回來。"
      }
    ],
    sources: [
      { name: "ETS 官方樣題 Part 5", href: "https://www.ets.org/pdfs/toeic/toeic-listening-reading-sample-test.pdf" },
      { name: "ETS Handbook：掌控閱讀時間", href: "https://toeic.com.tw/Upload/att/2020-11/202603171012062392298991.pdf" }
    ]
  },
  {
    id: "p6",
    part: 6,
    title: "Part 6 段落填空 Text Completion",
    short: "選句子填入空格時，先看連接詞和代名詞指的是上一句的誰。",
    tips: [
      {
        title: "插入句看連接詞 Sentence insertion",
        body: "四個選項若是完整句子，看 However、Therefore、Also、This、These 把空格和前後句接起來沒有。代名詞必須找得到前面的名詞。",
        why: "Part 6 除了單字和片語，也會要求選一句放進段落。ETS 說明這類題是在考句子和整段的關係。"
      }
    ],
    sources: [
      { name: "ETS Global：選句填入段落", href: "https://www.etsglobal.org/gp/en/help-center/test-content/format-questions-toeic-listening-reading" },
      { name: "IIBC Part 6：words, phrases, or a sentence", href: "https://www.iibc-global.org/english/toeic/test/lr/about/format.html" }
    ]
  },
  {
    id: "p7",
    part: 7,
    title: "Part 7 閱讀理解 Reading Comprehension",
    short: "先讀問題，再掃人名、日期和數字。多篇題要等兩份文件都對得上再作答。",
    tips: [
      {
        title: "先讀問題 Read the questions first",
        body: "每篇文章先看問題在問誰、什麼日期、哪一個數字，再回到文章找。不必從第一個字讀到最後一個字才開始答。",
        why: "單篇一篇只有 2 到 4 題。先知道目標，比較不會把時間花在沒有被問到的句子。"
      },
      {
        title: "掃人名與數字 Scan for names and numbers",
        body: "人名、金額、日期、百分比通常就是定位點。找到之後再讀那一句的前後。",
        why: "題目常把答案放在一個具體條件旁邊，而不是平均分布在全文。"
      },
      {
        title: "多篇的交叉順序 Cross-reference",
        body: "雙篇、三篇一組在正式考試是 5 題。先分清每份文件是誰寫的、日期先後，再答需要兩份文件合在一起才知道的題。只看一份就選，常常少了一個條件。",
        why: "ETS 的多篇題就是在考你能不能把相關文件放在一起讀，其中包含三份相關文件的題組。"
      }
    ],
    sources: [
      { name: "ETS Handbook：單篇 29 題、多篇每組 5 題", href: "https://www.ets.org/content/dam/ets-org/de/pdfs/toeic/toeic-4-skills-tests-examinee-handbook.pdf" },
      { name: "ETS Global：三份相關文件", href: "https://www.etsglobal.org/gp/en/help-center/test-content/format-questions-toeic-listening-reading" },
      { name: "忠欣 Part 7 題型", href: "https://www.toeic.com.tw/toeic/listening-reading/about/content/" }
    ]
  },
  {
    id: "pace",
    part: null,
    title: "閱讀 75 分鐘配速（參考，不是規定）",
    short: "一個可用的起點是 Part 5 約 10 分鐘、Part 6 約 8 分鐘、Part 7 約 55 分鐘。",
    tips: [
      {
        title: "建議區間，不是唯一節奏",
        body: "閱讀共 100 題、75 分鐘。一個練習起點是 Part 5 約 10 分鐘、Part 6 約 8 分鐘、Part 7 約 55 分鐘，餘下約 2 分鐘檢查。可依正確率調整，總時間以 75 分鐘為限。",
        why: "這只是練習時的參考。ETS 的要求是自己控時、不要在一題停太久，並在閱讀時間內把會的題答完。讀得比較慢的人可以把 Part 5、Part 6 再壓短一點，把時間留給 Part 7。"
      }
    ],
    sources: [
      { name: "ETS Handbook：閱讀 75 分鐘，不要在一題停留太久", href: "https://toeic.com.tw/Upload/att/2020-11/202603171012062392298991.pdf" },
      { name: "忠欣：閱讀 100 題、75 分鐘", href: "https://www.toeic.com.tw/toeic/listening-reading/before-test/notice/" },
      { name: "菁英國際：10 / 10 / 55 配速建議，本頁範例另留時間檢查", href: "https://www.language-center.com.tw/toeic/toeic-faq.html" }
    ]
  }
];

export function tipForPart(part) {
  return TIP_SECTIONS.find((section) => section.part === part) ?? null;
}
