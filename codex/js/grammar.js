// TOEIC grammar guide. Original explanations, examples and practice items (not ETS material).
// Each topic: { id, title, rule, clues, examples: [[en, zh]], trap, quiz: [{ q, options, answer, why }] }.
// `answer` is the index of the correct option.
export const GRAMMAR = [
  {
    id: "base-vs-pp",
    title: "速查：後面接原形動詞 vs 過去分詞",
    rule: "看到這些詞，空格先想「原形」；看到另一批詞，先想「過去分詞」。這兩種是 Part 5 最容易靠規則直接選對的題。",
    clues: [
      "接原形：助動詞（will, can, must, should, may）· to 不定詞 · make／let／have ＋ 人 ＋ 原形 · 建議要求類動詞後 that 子句 · had better · would rather · please ＋ 原形",
      "接過去分詞：be ＋ p.p.（被動）· have／has／had ＋ p.p.（完成式）· have／get ＋ 物 ＋ p.p.（請人做）· 名詞後面修飾（the report sent yesterday）· 部分分詞片語（Given the delay, ...）",
      "接 V-ing：介系詞後（by, after, before, without）· look forward to · enjoy／avoid／consider／finish／suggest · 進行式 be ＋ V-ing"
    ],
    examples: [
      ["Please submit the form before Friday.", "請在週五前交表單。（please ＋ 原形）"],
      ["The report has been reviewed by the director.", "報告已由主管審閱。（has been ＋ p.p.）"],
      ["She is interested in working abroad.", "她有興趣到國外工作。（介系詞 in ＋ V-ing）"]
    ],
    trap: "「to」後面不一定是原形：look forward to、be committed to、be used to、contribute to 的 to 是介系詞，後面接 V-ing。",
    quiz: [
      { q: "The supervisor made the new employees ____ the safety video twice.", options: ["watch", "to watch", "watched", "watching"], answer: 0, why: "make ＋ 人 ＋ 原形，所以用 watch。" },
      { q: "Ms. Cho had her contract ____ by a lawyer before she signed it.", options: ["review", "reviewing", "reviewed", "to review"], answer: 2, why: "have ＋ 物 ＋ 過去分詞，表示請人處理。合約是被審閱的，所以用 reviewed。" }
    ]
  },
  {
    id: "subjunctive",
    title: "建議、要求類：that 子句用原形（假設語氣）",
    rule: "表示「建議、要求、命令、堅持」的動詞，後面 that 子句的動詞用原形，不管主詞是誰、什麼時態。被動時 be 也用原形 be。",
    clues: [
      "動詞：insist, demand, require, request, recommend, suggest, propose, ask, urge, advise, order",
      "形容詞：It is essential／important／necessary／vital／crucial／imperative／desirable that + 主詞 + 原形",
      "名詞：the recommendation／requirement／suggestion／demand that + 主詞 + 原形"
    ],
    examples: [
      ["The manager insists that every employee attend the training.", "經理堅持每位員工都要參加訓練。（attend，不加 s）"],
      ["It is essential that the report be submitted by Friday.", "報告務必在週五前提交。（be，不是 is）"],
      ["The contract requires that payment be made in full.", "合約要求全額付款。"]
    ],
    trap: "第三人稱單數不加 -s，被動用 be，不用 is／are。選項若同時有「原形」和「should ＋ 原形」，現實英文兩者都可，但多益通常只放一個對的；選項裡有 reduces／is 這種變化形，就是陷阱。另外 insist 如果是「堅持說某事是事實」，就不用原形：She insisted that she was at home.",
    quiz: [
      { q: "The board requires that all expense reports ____ submitted by the fifth of each month.", options: ["is", "are", "be", "being"], answer: 2, why: "require ＋ that ＋ 主詞 ＋ 原形；被動用 be submitted。" },
      { q: "Ms. Park recommended that the team ____ the proposal before the meeting.", options: ["review", "reviews", "reviewed", "reviewing"], answer: 0, why: "recommend 後 that 子句用原形，不管主詞是單數還是複數、不管時態。" },
      { q: "It is important that every visitor ____ a badge at all times.", options: ["wears", "wear", "wore", "wearing"], answer: 1, why: "It is important that ＋ 主詞 ＋ 原形。" }
    ]
  },
  {
    id: "word-forms",
    title: "詞性題：看位置、看字尾",
    rule: "四個選項是同一個字根的不同詞性時，不用懂意思，看空格在句子的位置就能選。",
    clues: [
      "冠詞／所有格／介系詞後 → 名詞（a／the／your ＋ ___ ；of／for／by ＋ ___）",
      "名詞前 → 形容詞；be／become／seem 後 → 形容詞",
      "助動詞與動詞之間、整句之後 → 副詞（-ly）",
      "字尾：名詞 -tion -ment -ness -ity -ance；形容詞 -ful -ive -ous -able -al；副詞 -ly；動詞 -ize -ify -ate -en"
    ],
    examples: [
      ["The manager quickly revised the schedule.", "經理很快修改了時程。（助動詞／主詞後、動詞前用副詞）"],
      ["Her decision surprised everyone.", "她的決定讓大家驚訝。（所有格後用名詞）"],
      ["The new design is very attractive.", "新設計很吸引人。（be 後用形容詞）"]
    ],
    trap: "名詞有人與事兩種：applicant（申請人）vs application（申請書）。單數可數名詞前面一定要有冠詞或所有格，所以 your ___ 通常是名詞。",
    quiz: [
      { q: "Please submit your ____ for the position by Friday.", options: ["apply", "applicant", "application", "applying"], answer: 2, why: "your 後面接名詞；submit 的是申請書，所以用 application。" },
      { q: "The finance team ____ reviewed every invoice before the audit.", options: ["careful", "carefully", "care", "carefulness"], answer: 1, why: "主詞與動詞之間用副詞修飾動詞，所以用 carefully。" }
    ]
  },
  {
    id: "passive",
    title: "主動 vs 被動",
    rule: "被動是 be ＋ 過去分詞。判斷法：空格後面有受詞 → 主動；空格後面是介系詞片語、副詞或什麼都沒有 → 被動。",
    clues: [
      "後面直接接名詞（受詞）→ 主動：The team completed the project.",
      "後面接 by、to、in 等介系詞片語或句號 → 被動：The project was completed on time.",
      "不及物動詞（happen, occur, arrive, rise, remain）沒有被動",
      "get ＋ p.p. 也是被動，口語一點：get promoted, get delayed"
    ],
    examples: [
      ["The meeting has been postponed until next Tuesday.", "會議已延到下週二。"],
      ["The new employees were trained by the HR manager.", "新進員工由人資經理訓練。"],
      ["Sales rose sharply in March.", "三月銷售量大增。（rise 是不及物動詞，沒有被動）"]
    ],
    trap: "及物動詞後面若已經有受詞就不能被動；而不及物動詞（happen／occur／arrive／remain）不能寫成 was happened。",
    quiz: [
      { q: "The annual report ____ by the finance team last week.", options: ["completed", "was completed", "has completing", "completes"], answer: 1, why: "report 是被完成的，後面沒有受詞，用被動 was completed。" },
      { q: "The shipment ____ at the warehouse yesterday morning.", options: ["was arrived", "arrived", "has been arrived", "was arriving at"], answer: 1, why: "arrive 是不及物動詞，不能用被動。" }
    ]
  },
  {
    id: "participles",
    title: "分詞當形容詞：-ing 還是 -ed",
    rule: "修飾名詞的分詞：名詞「主動做」某事或「令人…」用 -ing；名詞「被…」或人「感到…」用 -ed。",
    clues: [
      "事物令人…：exciting／interesting／disappointing／confusing results",
      "人感到…：excited／interested／disappointed／confused customers",
      "被動意義的名詞前：completed forms、signed contract、revised schedule、attached file",
      "主動意義：a company producing parts、employees working overtime、an increasing number of"
    ],
    examples: [
      ["The disappointing results worried the investors.", "令人失望的結果讓投資人擔心。"],
      ["All completed forms must be returned to the office.", "所有填妥的表格要交回辦公室。"],
      ["Employees working overtime will receive extra pay.", "加班的員工會有額外薪資。"]
    ],
    trap: "先問：名詞是做這件事，還是被這件事影響？forms 不會自己 complete，所以是 completed forms。多益常考 an increasing number of、a growing demand、a leading company、a qualified candidate。",
    quiz: [
      { q: "Please send the ____ documents to the legal department.", options: ["sign", "signing", "signed", "signs"], answer: 2, why: "文件是被簽署的，用過去分詞 signed。" },
      { q: "The ____ news about the merger made the staff nervous.", options: ["surprised", "surprising", "surprise", "surprisingly"], answer: 1, why: "news 是令人驚訝的，用 -ing。" }
    ]
  },
  {
    id: "tenses",
    title: "時態：靠時間線索",
    rule: "句子裡的時間詞通常直接決定時態。",
    clues: [
      "since／for／so far／recently／already／yet → 現在完成式 have／has ＋ p.p.",
      "yesterday／last week／in 2023／ago → 過去簡單式",
      "by the time ＋ 過去 → 前一件事用過去完成 had ＋ p.p.",
      "表示未來的時間或條件子句（if, when, as soon as, before, after, until）用現在簡單式，不用 will",
      "know／believe／own／contain／belong 等狀態動詞不用進行式"
    ],
    examples: [
      ["Ms. Lee has worked at the firm since 2015.", "李小姐自 2015 年起就在這間公司工作。"],
      ["We will send the invoice as soon as the payment arrives.", "款項一到，我們就寄發票。"],
      ["By the time we arrived, the meeting had started.", "我們到的時候，會議已經開始了。"]
    ],
    trap: "since 後面接過去時間點（since 2015／since last year），主句用現在完成式；for 後面接一段時間（for ten years）。時間或條件子句裡不能用 will。",
    quiz: [
      { q: "Ms. Lee ____ with the firm since 2015.", options: ["works", "worked", "has worked", "is working"], answer: 2, why: "since ＋ 過去時間點，主句用現在完成式。" },
      { q: "We will contact you as soon as the shipment ____.", options: ["will arrive", "arrives", "arrived", "arriving"], answer: 1, why: "as soon as 引導的時間子句，指未來也用現在簡單式。" }
    ]
  },
  {
    id: "agreement",
    title: "主詞與動詞一致",
    rule: "動詞跟著真正的主詞（中心名詞）變，不是跟著離它最近的名詞。",
    clues: [
      "主詞後面的介系詞片語不影響動詞：The list of new products ___ attached.",
      "each／every／one of／either／neither／everyone／somebody → 單數動詞",
      "動名詞（V-ing）當主詞 → 單數",
      "A and B → 複數；A as well as B／along with B → 跟 A",
      "both／several／few／many／a number of ＋ 複數名詞 → 複數；the number of → 單數"
    ],
    examples: [
      ["One of the managers is on leave this week.", "其中一位經理這週休假。"],
      ["The number of applicants has increased.", "應徵人數增加了。"],
      ["Reviewing the contracts takes a long time.", "審閱這些合約要花很多時間。"]
    ],
    trap: "常見陷阱是把中間的複數名詞當主詞：The cost of repairs ___ high → 主詞是 cost，用 is。",
    quiz: [
      { q: "The list of new products ____ attached to this email.", options: ["are", "is", "were", "have been"], answer: 1, why: "主詞是 list（單數），of new products 只是修飾語。" },
      { q: "A number of customers ____ complained about the delay.", options: ["has", "have", "is", "was"], answer: 1, why: "a number of ＋ 複數名詞 → 複數動詞；the number of 才是單數。" }
    ]
  },
  {
    id: "prep-vs-conj",
    title: "介系詞 vs 連接詞：despite／although、because of／because",
    rule: "後面接名詞（片語）用介系詞；後面接完整子句（主詞＋動詞）用連接詞。",
    clues: [
      "名詞 → despite／in spite of／because of／due to／owing to／during／for",
      "子句 → although／even though／though／because／since／while／whereas／if",
      "during ＋ 名詞；while ＋ 子句（或 while ＋ V-ing）",
      "連接副詞 however／therefore／moreover 不能單獨連接兩個子句，前面要用句號或分號"
    ],
    examples: [
      ["Despite the heavy rain, the event went on as planned.", "儘管下大雨，活動照常進行。"],
      ["We closed early because the system was down.", "因為系統當機，我們提早關門。"],
      ["The flight was delayed due to bad weather.", "航班因天氣不佳而延誤。"]
    ],
    trap: "Despite 後面不能接子句：Despite the weather was bad 是錯的。要接子句就改用 although。",
    quiz: [
      { q: "____ the heavy rain, the outdoor event went on as planned.", options: ["Although", "Despite", "Because", "However"], answer: 1, why: "後面是名詞片語 the heavy rain，用介系詞 Despite。" },
      { q: "The store closed early ____ the power was out.", options: ["because", "because of", "due to", "despite"], answer: 0, why: "後面是完整子句 the power was out，用連接詞 because。" }
    ]
  },
  {
    id: "gerund-infinitive",
    title: "動名詞 vs 不定詞",
    rule: "有些動詞後面只接 V-ing，有些只接 to ＋ 原形，得靠熟記。",
    clues: [
      "接 V-ing：enjoy, avoid, consider, finish, suggest, postpone, delay, deny, mind, keep",
      "接 to ＋ 原形：plan, decide, agree, refuse, hope, expect, afford, manage, promise, fail",
      "介系詞 to ＋ V-ing：look forward to, be committed to, be used to, object to, contribute to, in addition to",
      "be able／be likely／be willing／be ready ＋ to ＋ 原形"
    ],
    examples: [
      ["We look forward to seeing you next week.", "期待下週見到您。（to 是介系詞）"],
      ["The company decided to close the factory.", "公司決定關閉工廠。"],
      ["She suggested postponing the launch.", "她建議延後上市。"]
    ],
    trap: "look forward to 的 to 是介系詞，後面不能接原形。想不出來時，試試在 to 後面放名詞，如果通順（look forward to the meeting），那它就是介系詞。",
    quiz: [
      { q: "We look forward to ____ you at the conference next month.", options: ["see", "seeing", "saw", "be seeing"], answer: 1, why: "look forward to 的 to 是介系詞，後面接 V-ing。" },
      { q: "The board decided ____ the contract for another year.", options: ["renewing", "to renew", "renew", "renewed"], answer: 1, why: "decide ＋ to ＋ 原形。" }
    ]
  },
  {
    id: "relative",
    title: "關係代名詞：who／which／that／whose",
    rule: "先看先行詞（前面的名詞）是人還是物，再看空格後面缺什麼：缺主詞或受詞用 who／which／that；有名詞但缺所有格用 whose。",
    clues: [
      "人 → who／that；物 → which／that；人或物的所有格 → whose ＋ 名詞",
      "時間 → when；地點 → where；原因 → why",
      "逗號後面（補充說明）不能用 that，也不能省略",
      "介系詞後面只能用 which／whom，不能用 that"
    ],
    examples: [
      ["Applicants whose resumes are incomplete will not be considered.", "履歷不完整的應徵者不會被考慮。"],
      ["The software, which was released last month, has several bugs.", "上個月發布的那套軟體有幾個錯誤。"],
      ["This is the office where the meeting will be held.", "這是開會的辦公室。"]
    ],
    trap: "whose 後面一定接名詞：whose resume；而 who 後面接動詞：who submitted。",
    quiz: [
      { q: "Applicants ____ resumes are incomplete will not be considered.", options: ["who", "which", "whose", "whom"], answer: 2, why: "空格後面是名詞 resumes，要表示所屬關係，用 whose。" },
      { q: "The software, ____ was released last month, has several bugs.", options: ["that", "who", "which", "what"], answer: 2, why: "逗號後面補充說明，先行詞是物，用 which，不能用 that。" }
    ]
  },
  {
    id: "conditionals",
    title: "條件句與倒裝",
    rule: "依時間和可能性決定動詞形態。倒裝（Should／Were／Had 開頭）是 if 的書面省略說法。",
    clues: [
      "可能發生：If ＋ 現在簡單式, will／can／please ＋ 原形",
      "與現在事實相反：If ＋ 過去式（be 一律 were）, would ＋ 原形",
      "與過去事實相反：If ＋ had ＋ p.p., would have ＋ p.p.",
      "倒裝：Should you need help = If you should need help；Had we known = If we had known；Were I you = If I were you"
    ],
    examples: [
      ["If you submit the form today, we will process it tomorrow.", "今天交表單，我們明天處理。"],
      ["Should you require assistance, please call our hotline.", "如果您需要協助，請撥打服務專線。"],
      ["If I were you, I would check the contract first.", "如果我是你，我會先看合約。"]
    ],
    trap: "if 子句裡不用 will；Should you need ... 句中，you 後面的動詞用原形，不加 to。",
    quiz: [
      { q: "If you ____ the form today, we will process it tomorrow.", options: ["submit", "will submit", "submitted", "have submitting"], answer: 0, why: "可能發生的條件句，if 子句用現在簡單式。" },
      { q: "____ you require further assistance, please contact our help desk.", options: ["Should", "Would", "Do", "Had"], answer: 0, why: "Should you require ... 是 If you should require ... 的倒裝說法。" }
    ]
  },
  {
    id: "comparison",
    title: "比較級與最高級",
    rule: "兩者比用比較級（-er／more ... than），三者以上用最高級（the -est／the most）。",
    clues: [
      "比較級 than；強調比較級用 much／far／even／still／a lot，不用 very",
      "最高級前要有 the，後面常接 of／in／ever／所有人事物的範圍",
      "as ＋ 原級 ＋ as；the 比較級, the 比較級（越…越…）",
      "不規則：good → better → best；bad → worse → worst；far → farther／further"
    ],
    examples: [
      ["Sales this quarter were much higher than last quarter.", "本季銷售量比上季高很多。"],
      ["This is the quickest route to the airport.", "這是到機場最快的路線。"],
      ["The more you practice, the better you become.", "越練習，越進步。"]
    ],
    trap: "very 只能修飾原級（very high），不能修飾比較級（very higher 是錯的）；最高級前面不能漏掉 the。",
    quiz: [
      { q: "Sales this quarter were ____ higher than last quarter.", options: ["very", "much", "so", "too"], answer: 1, why: "強調比較級 higher 用 much／far／even；very 不行。" },
      { q: "This is ____ route to the airport.", options: ["quick", "more quick", "the quickest", "quicker"], answer: 2, why: "三條以上路線中最快的，用最高級，且前面要有 the。" }
    ]
  },
  {
    id: "causative",
    title: "使役與感官動詞：make／let／have／help",
    rule: "讓某人做某事、請別人做某事，動詞形態要看是人還是物。",
    clues: [
      "make／let／have ＋ 人 ＋ 原形：The manager had the assistant prepare the report.",
      "have／get ＋ 物 ＋ 過去分詞：We had the office painted.",
      "get ＋ 人 ＋ to ＋ 原形：I got him to check the file.",
      "help ＋ 人 ＋ (to) 原形；see／hear／watch ＋ 人 ＋ 原形或 V-ing"
    ],
    examples: [
      ["The manager had the assistant prepare the report.", "經理請助理準備報告。"],
      ["We had our office painted last week.", "我們上週請人粉刷辦公室。"],
      ["The new software helps employees save time.", "新軟體幫員工節省時間。"]
    ],
    trap: "have ＋ 人 ＋ 原形，但 have ＋ 物 ＋ 過去分詞；get 則是 get ＋ 人 ＋ to ＋ 原形。",
    quiz: [
      { q: "The director had the assistant ____ the revised schedule to all staff.", options: ["send", "sent", "sending", "to send"], answer: 0, why: "have ＋ 人 ＋ 原形。" },
      { q: "We had the broken printer ____ by a technician.", options: ["repair", "repairing", "repaired", "to repair"], answer: 2, why: "printer 是物，用 have ＋ 物 ＋ 過去分詞。" }
    ]
  },
  {
    id: "quantity",
    title: "可數、不可數與數量詞",
    rule: "數量詞要配合名詞是可數還是不可數。",
    clues: [
      "不可數：information, advice, equipment, furniture, luggage, merchandise, news, feedback, staff（集合）",
      "不可數用：much／little／a great deal of／an amount of",
      "可數複數用：many／few／several／a number of／a variety of",
      "兩者都可：a lot of／plenty of／some／any／most"
    ],
    examples: [
      ["We do not have much information about the delay.", "關於延誤，我們沒有太多資訊。"],
      ["Several employees have requested a day off.", "好幾位員工申請休假。"],
      ["The company provided new equipment to the factory.", "公司提供新設備給工廠。"]
    ],
    trap: "information、advice、equipment 後面不能加 s，也不能用 an：a piece of information、a piece of advice。",
    quiz: [
      { q: "We do not have ____ information about the delay yet.", options: ["many", "much", "several", "a few"], answer: 1, why: "information 是不可數名詞，用 much。" },
      { q: "____ employees have asked for flexible working hours.", options: ["Much", "Little", "Several", "A great deal of"], answer: 2, why: "employees 是可數複數，用 several。" }
    ]
  },
  {
    id: "connectors",
    title: "連接詞、連接副詞與對等結構",
    rule: "and／but／or 連接對等結構，所以前後詞性、形式要一樣；however／therefore 是副詞，要用分號或句號隔開。",
    clues: [
      "both A and B／either A or B／neither A nor B／not only A but also B：A、B 詞性要相同",
      "however, therefore, moreover, as a result, in addition 前面用句號或分號，後面加逗號",
      "so that ＋ 子句（為了）；in order to ＋ 原形",
      "either／neither／both／whether ... or 都要對稱"
    ],
    examples: [
      ["The shipment was delayed; therefore, we offered a refund.", "貨物延誤，因此我們提供退款。"],
      ["The new system is both faster and more reliable.", "新系統既快又更可靠。"],
      ["We hired two assistants so that the team could meet the deadline.", "我們請了兩位助理，好讓團隊趕上期限。"]
    ],
    trap: "but 前面可以用逗號連接兩個子句，however 不行，因為 however 是副詞。對等結構的兩邊必須一樣：both quickly and efficiently（兩個都是副詞）。",
    quiz: [
      { q: "The shipment was delayed; ____, we offered the customer a refund.", options: ["because", "therefore", "but", "although"], answer: 1, why: "分號後面接連接副詞 therefore。because／but／although 是連接詞，不能放在分號後。" },
      { q: "The new software is both faster ____ more reliable than the old one.", options: ["or", "but", "and", "nor"], answer: 2, why: "固定搭配 both A and B（既…又…）。" }
    ]
  }
];
