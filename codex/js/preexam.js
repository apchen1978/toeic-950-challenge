// 考前黃金 30–60 分鐘: a short, scannable routine for the hour before the test.
// Wording is the site's own summary of public advice and common test-taker experience (not official ETS guidance).
// Anything that depends on the test centre is phrased as "check your exam notice" instead of stated as a rule.

export const PREEXAM_PRINCIPLE = "考前一小時不是學新東西，是把耳朵和手感叫醒，並且讓自己穩下來。看熟悉的、做簡單的、保持節奏。";

export const PREEXAM_BLOCKS = [
  {
    id: "leave",
    when: "出門前 · 前 60 分鐘",
    title: "穩住身體，備齊東西",
    intro: "這一段的目標是「不要出狀況」。別開新的模考。",
    items: [
      { id: "leave-docs", text: "證件與用品再點一次：准考證／身分證件、鉛筆與橡皮擦、手錶。實際規定以你的考試通知為準，前一晚先確認好。" },
      { id: "leave-food", text: "吃平常習慣的早餐，水喝夠；咖啡茶不要比平常多。考試中沒辦法離開，進場前先上廁所。" },
      { id: "leave-route", text: "確認出發時間和路線，抵達時間抓寬鬆，寧可早到在外面休息，也不要趕到喘。" },
      { id: "leave-no-new", text: "不背新單字、不學新文法、不做整份模考。想到新東西就先放著，考完再看。" }
    ]
  },
  {
    id: "road",
    when: "在路上 · 前 45–30 分鐘",
    title: "熱耳朵、看熟悉的東西",
    intro: "適合在車上、捷運上、坐在外面等的時間。手機一支就夠。",
    items: [
      { id: "road-ears", text: "戴耳機聽 3–5 分鐘英文（本站聽力小課程、新聞或 Podcast 都可以）。目標是讓耳朵習慣英文語速，不是聽懂每個字。" },
      { id: "road-traps", text: "看一遍下面「最容易錯的 10 件事」。只看，不要背。" },
      { id: "road-own", text: "翻你自己的錯題或文法快練裡答錯的題，快速掃一遍原因，不用重新做。" },
      { id: "road-pace", text: "默念一次時間節奏：Part 5 每題約 20 秒、Part 6 約 30 秒、Part 7 約 60 秒。" }
    ]
  },
  {
    id: "gate",
    when: "進考場前 · 前 30–5 分鐘",
    title: "暖身找題感，然後收手",
    intro: "用約 10 分鐘做幾題簡單的，找回「看到題目就知道怎麼切入」的感覺，然後就收手。",
    items: [
      { id: "gate-warmup", text: "做一次「題感暖機」：Part 5 暖身 10 題 ＋ 文法 5 題。目標是手感，不是分數；錯了看一眼原因就好。" },
      { id: "gate-stop", text: "暖身完就停，把手機收起來。考前不要對答案、不要和人討論題目或單字，分心比不會更傷。" },
      { id: "gate-breath", text: "覺得心跳快，就慢慢呼吸幾次：吸氣數 4 下，吐氣數 6 下，吐氣比吸氣長。重複 5 次。" },
      { id: "gate-phone", text: "依考場規定關機或靜音，並把手機收好。" }
    ]
  },
  {
    id: "seat",
    when: "入座後 · 開考前",
    title: "讓自己準備好",
    intro: "最後幾分鐘，只做這幾件小事。",
    items: [
      { id: "seat-card", text: "答案卡先看清楚：填卡的方式和你練習時一樣。每換一個 Part，都核對一次題號有沒有對上，錯位會連錯一整排。" },
      { id: "seat-directions", text: "聽力的 Directions 在念的時候，就是你預讀下一部分題目的時間，不要發呆。" },
      { id: "seat-mind", text: "對自己說一句：「每題一樣分，不會的放掉，下一題才是重點。」" }
    ]
  }
];

export const PREEXAM_WARMUP = [
  { action: "lessons", label: "聽 3 分鐘熱身聽力", hint: "本站聽力小課程，先把耳朵叫醒" },
  { action: "start-warmup", label: "Part 5 暖身 10 題", hint: "短時間限時，找回看題目的反應" },
  { action: "grammar-drill", label: "文法 5 題快練", hint: "祈使句、原形、詞性、時態" },
  { action: "flash-quick", label: "精選單字 10 個", hint: "只複習熟悉的字，不求多" }
];

export const PREEXAM_TRAPS = [
  { id: "t1", part: "Part 2", title: "一模一樣的字多半是陷阱", body: "選項和題目聽起來一樣、或出現同一個單字，常常是誘答。先判斷題型（Wh- 還是 Yes/No），再選意思對得上的。" },
  { id: "t2", part: "Part 2", title: "間接回答也可以是對的", body: "不直接回答 Yes/No，而是說「我去問問看」「要看經理」，常常才是正解。別只因為沒說 Yes 就刪掉。" },
  { id: "t3", part: "Part 1", title: "人還是物？看主詞", body: "照片題先抓主詞和動作。is being moved 這種被動句，是物被處理，不是畫面裡的人在做。" },
  { id: "t4", part: "Part 3/4", title: "先看題目；轉折後才是答案", body: "有時間先掃題目和選項。聽到 but、actually、however、instead 之後，說話者的真正決定通常在後面。" },
  { id: "t5", part: "Part 3/4", title: "錯過一題，立刻跟上下一題", body: "聽力不能回頭。漏聽就選一個、馬上看下一題的題目，不要卡在上一題。" },
  { id: "t6", part: "Part 5", title: "先判斷是文法題還是單字題", body: "看選項是同字根的不同詞性（文法）還是不同意思的字（單字）。文法題看空格前後：冠詞、所有格、介系詞後是名詞，be 後是形容詞，助動詞後是原形。" },
  { id: "t7", part: "Part 5", title: "建議、要求後面用原形", body: "insist、demand、recommend、suggest、require 後面的 that 子句用原形動詞，主詞是第三人稱單數也不加 s。祈使句、Please 後面也是原形。" },
  { id: "t8", part: "Part 5", title: "介系詞 vs 連接詞", body: "despite／because of／due to 後面接名詞；although／because／while 後面接完整子句。空格後面有主詞和動詞，就選連接詞。" },
  { id: "t9", part: "Part 7", title: "先看題目再回去找答案", body: "不要從頭逐字讀。先看題目要找什麼，再回文章定位。NOT 題、推論題和要整合多篇文件的題目，留到同一組的最後做。" },
  { id: "t10", part: "全場", title: "畫卡錯位會連錯一排", body: "每換一個 Part、每翻一頁，都核對一次題號。有考生因為漏畫一題而整排錯位，這種錯最不值得。" }
];

export const PREEXAM_PACE = {
  title: "閱讀 75 分鐘配速參考",
  rows: [
    { label: "Part 5 每題", value: "約 20 秒" },
    { label: "Part 6 每題", value: "約 30 秒" },
    { label: "Part 7 每題", value: "約 60 秒（單篇較快、多篇較慢）" },
    { label: "最後 5 分鐘", value: "檢查畫卡，沒做的題全部填完" }
  ],
  note: "各家說法略有差異，這只是參考。用你自己做模擬考的實際用時去調整，別硬套。"
};

export const PREEXAM_RESCUE = [
  { id: "r1", title: "聽力卡住了", body: "放掉那一題，選一個答案，立刻看下一題。一題只是一題，失神一分鐘會丟掉三題。" },
  { id: "r2", title: "閱讀時間不夠", body: "不倒扣分，所以最後務必把空白都填滿。難題先跳過，留標記，有時間再回來。" },
  { id: "r3", title: "突然腦袋一片空白", body: "停一下，吐氣慢數 3 秒，把題目再讀一遍，從空格前後的字找線索。" },
  { id: "r4", title: "覺得整體做得很差", body: "你不知道別人的難度，也沒辦法在考場內評分。每題等值，專心做下一題。" }
];

export const PREEXAM_SOURCES = [
  { name: "ETS 應試者手冊：答錯不倒扣", href: "https://www.ets.org/content/dam/ets-org/fr/pdfs/toeic/toeic-listening-reading-test-examinee-handbook.pdf" },
  { name: "Dcard：多益閱讀時間如何分配", href: "https://www.dcard.tw/@snoweienglish/post/258439637" },
  { name: "PrepEdu：多益考試時間分配", href: "https://prepedu.com/zh-hant/blog/time-management-in-toeic-exam" },
  { name: "英語ハブ：TOEIC リーディング 3 つのポイント", href: "https://englishhub.jp/news/toeic-reading-3points.html" },
  { name: "Open Exam Prep：Part 5 文法重點", href: "https://open-exam-prep.com/study-guides/toeic/reading-incomplete-sentences/incomplete-sentences-grammar" }
];
