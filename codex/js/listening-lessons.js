// Original practice material, narrated with synthetic voices; not an ETS recording.
export const LESSONS = [
  {
    id: 'flight-delay', title: '航班延誤，重新安排行程', accent: '美式英語',
    audio: 'audio/lesson-flight-delay.mp3',
    transcript: 'Good morning, everyone. This is an update on the team traveling to Singapore. Their flight has been delayed because of bad weather, and they are now expected to arrive at six this evening. The client meeting will still take place tomorrow morning, but the team dinner has been moved to seven thirty. If you have a reservation for the original time, you do not need to make a new one. The hotel has already updated the booking. Please let the client know about the later arrival, and send the revised schedule to everyone on the trip. We will share another update if the airline changes the departure time again.',
    summary: '前往新加坡的團隊因天氣延誤，預計傍晚六點抵達。明早客戶會議照常，晚餐改到七點半；飯店已更改訂位。請同事通知客戶並傳送更新行程。',
    phrases: [['be delayed', '延誤'], ['is expected to arrive', '預計抵達'], ['revised schedule', '更新後的行程']]
  },
  {
    id: 'meeting-change', title: '會議改期與文件準備', accent: '英式英語',
    audio: 'audio/lesson-meeting-change.mp3',
    transcript: 'Hello, this is an announcement for everyone working on the Riverside project. The budget review has been moved from Tuesday to Thursday at ten in the morning. The change gives the finance team more time to check the latest figures. Please upload your department updates to the shared folder by Wednesday afternoon. If your figures are not final, mark them as estimates and explain what is still being checked. The meeting will be held in the usual conference room, and a video link will be sent to anyone joining remotely. Contact the project coordinator if you cannot attend, so we can arrange a short follow-up afterwards.',
    summary: 'Riverside 專案的預算檢討改到週四上午十點，讓財務團隊有更多時間核對數字。各部門週三下午前上傳資料；未定數字須標示為估計值。',
    phrases: [['budget review', '預算檢討'], ['latest figures', '最新數字'], ['follow-up', '後續跟進']]
  },
  {
    id: 'delivery-update', title: '訂單延遲與客戶通知', accent: '澳洲英語',
    audio: 'audio/lesson-delivery-update.mp3',
    transcript: 'Here is the latest update on the office furniture order. The chairs are ready to ship, but the desks will not leave the warehouse until Friday. One of the desk components arrived later than planned, so the supplier needs two extra days to finish the order. Our customer has agreed to receive the chairs first, provided that there is no additional delivery charge. The supplier has confirmed that both deliveries will be covered by the original price. Please send the customer the tracking number when the chairs are collected, and check again on Thursday that the desks will be ready for dispatch.',
    summary: '辦公椅可先出貨，桌子因零件晚到，預計週五才出倉。客戶同意先收椅子，條件是不加運費；供應商已確認原價包含兩次配送。',
    phrases: [['ready to ship', '準備出貨'], ['additional delivery charge', '額外運費'], ['tracking number', '追蹤編號'], ['ready for dispatch', '準備發送']]
  },
  {
    id: 'hotel-reservation', title: '飯店訂房與延後入住', accent: '美式英語', audio: 'audio/lesson-hotel-reservation.mp3',
    transcript: 'This is a message for Ms. Chen regarding her hotel reservation for next Monday. We understand that your train is scheduled to arrive after nine in the evening. Your room will be held for you, so there is no need to change the reservation. The front desk is open around the clock, and a member of our team will be available to help with your luggage. Breakfast is included in your room rate and is served on the second floor from six thirty. If your arrival time changes again, please contact us using the number in your confirmation email. We look forward to welcoming you.',
    summary: '飯店確認會為陳女士保留房間，晚到不必更改訂房；櫃台二十四小時開放，房價包含早餐，若抵達時間再變動可致電通知。',
    phrases: [['room will be held', '保留房間'], ['around the clock', '全天二十四小時'], ['room rate', '房價'], ['confirmation email', '確認郵件']]
  },
  {
    id: 'invoice-discrepancy', title: '發票金額核對', accent: '美式英語', audio: 'audio/lesson-invoice-discrepancy.mp3',
    transcript: 'I am calling about the invoice we received for the office supplies delivered last week. The total is higher than the amount on our purchase order because a delivery fee has been added. Our agreement includes free delivery for orders over five hundred dollars, and this order qualifies. Could you review the invoice and send us a corrected copy? We are scheduled to process payments on Friday, so receiving the revised invoice by Thursday afternoon would be helpful. If there is a reason the fee applies, please let us know and include the relevant details. Thank you for looking into this.',
    summary: '辦公用品發票多收運費，但訂單達到免運門檻。來電者請供應商核對並在週四下午前提供更正發票，以便週五付款。',
    phrases: [['purchase order', '採購單'], ['qualify for', '符合資格'], ['corrected copy', '更正後的副本'], ['process payments', '處理付款']]
  },
  {
    id: 'training-session', title: '新人培訓與線上參加', accent: '美式英語', audio: 'audio/lesson-training-session.mp3',
    transcript: 'Welcome to the customer service team. Your introductory training begins on Wednesday at nine in the morning in Room 204. During the first session, you will learn how to access customer records and send requests to the appropriate department. Please bring your laptop and make sure you can sign in before the session starts. If you are working remotely, use the meeting link in your welcome email instead. The trainer will record the presentation, and the recording will be available to registered participants afterwards. If you have any trouble accessing the system, contact the support desk before Tuesday afternoon.',
    summary: '新人培訓週三上午九點開始，內容包括查詢客戶資料與轉交需求。請事先確認筆電登入；遠端人員使用郵件連結，課後可觀看錄影。',
    phrases: [['introductory training', '入門培訓'], ['appropriate department', '相關部門'], ['sign in', '登入'], ['registered participants', '已報名參加者']]
  },
  {
    id: 'office-maintenance', title: '辦公室維修公告', accent: '英式英語', audio: 'audio/lesson-office-maintenance.mp3',
    transcript: 'Please note that maintenance work will take place on the third floor this Saturday. The building team will replace several lights and inspect the air conditioning system. During the work, the meeting rooms on that floor will be unavailable, but the first-floor meeting rooms can still be booked as usual. Employees who need to collect materials from the third floor should do so before six on Friday evening. The work is expected to finish by Sunday afternoon. If the schedule changes, an update will be posted at the main entrance and sent by email. Thank you for your cooperation.',
    summary: '週六三樓將維修照明及檢查空調，三樓會議室暫停使用，一樓會議室仍可預訂。需取用三樓物品者，請在週五下午六點前完成。',
    phrases: [['maintenance work', '維修工作'], ['unavailable', '暫時無法使用'], ['as usual', '照常'], ['main entrance', '主要入口']]
  },
  {
    id: 'conference-registration', title: '研討會報到與場地變更', accent: '澳洲英語', audio: 'audio/lesson-conference-registration.mp3',
    transcript: 'Thank you for registering for the regional business conference. Registration will open at eight thirty on Friday morning in the lobby of the Harbour Centre. Please bring the confirmation email on your phone or as a printed copy. The opening presentation will begin at nine fifteen in Hall B, rather than Hall A as listed in the original programme. Morning tea will be served just outside the hall, and lunch is included for all registered guests. If you have a dietary request that you have not yet mentioned, please contact the events team by Wednesday so they can inform the catering staff.',
    summary: '商務研討會週五上午八點半起在 Harbour Centre 大廳報到，請出示確認郵件。開場演講改到 B 廳；如有特殊飲食需求，請週三前通知活動團隊。',
    phrases: [['registration will open', '開始報到'], ['opening presentation', '開場演講'], ['rather than', '而非'], ['dietary request', '飲食需求']]
  },
  {
    id: "train-platform-change", title: "月台變更與無障礙協助", accent: "英式英語", audio: "audio/lesson-train-platform-change.mp3",
    transcript: "Good evening, passengers. This is an announcement for the eighteen-forty service to Manchester. Due to a signal fault, this train will now depart from platform nine instead of platform four. Please take care when using the stairs, as the lifts are currently being repaired. Passengers who need assistance should speak to a member of staff near the ticket office. We apologise for the inconvenience and thank you for your patience.",
    summary: "前往曼徹斯特的 18:40 班車因號誌故障，月台由四號改為九號。電梯維修中，需要協助的旅客請到售票處旁找工作人員。",
    phrases: [["depart from", "從……出發"], ["instead of", "而不是"], ["signal fault", "號誌故障"], ["ticket office", "售票處"]]
  },
  {
    id: "store-sale-announcement", title: "賣場限時促銷廣播", accent: "澳洲英語", audio: "audio/lesson-store-sale-announcement.mp3",
    transcript: "Attention shoppers. For the next two hours, all kitchen appliances on the second floor are twenty percent off. This offer applies to both small and large items, but it cannot be combined with other discounts. Customers who spend over two hundred dollars will also receive a free gift card at the checkout counter. The sale ends at five o'clock sharp, so please bring your items to the registers before then.",
    summary: "二樓廚房電器未來兩小時打八折，大小商品都適用，但不能與其他折扣合併。消費滿兩百元可在結帳櫃台領禮物卡；五點整結束。",
    phrases: [["be twenty percent off", "打八折"], ["cannot be combined with", "不能與……合併"], ["checkout counter", "結帳櫃台"], ["five o'clock sharp", "五點整"]]
  },
  {
    id: "job-interview-voicemail", title: "面試邀請語音留言", accent: "英式英語", audio: "audio/lesson-job-interview-voicemail.mp3",
    transcript: "Hello, this is Rachel Evans from Hartley Logistics. Thank you for applying for the operations coordinator position. We would like to invite you for an interview next Tuesday at two thirty. Please bring a copy of your résumé and two references. The office is on the fifth floor, and visitors must sign in at the front desk. If that time is inconvenient, please call me back to arrange another.",
    summary: "物流公司邀請應徵者下週二下午兩點半面試，請帶履歷與兩位推薦人資料；到五樓、先在櫃台登記。時間不方便可回電改期。",
    phrases: [["apply for", "應徵"], ["references", "推薦人"], ["sign in", "登記簽到"], ["arrange another time", "另約時間"]]
  },
  {
    id: "product-launch-talk", title: "新品發表會致詞", accent: "澳洲英語", audio: "audio/lesson-product-launch-talk.mp3",
    transcript: "Good morning, everyone, and thank you for joining our product launch. Today we are introducing a new line of lightweight laptops designed for people who travel frequently. The battery lasts up to fourteen hours, and the screen is brighter than in previous models. Orders will open on Monday, and customers who register in advance will receive free shipping. After my presentation, our engineers will be available to answer your questions.",
    summary: "公司發表為常出差者設計的輕薄筆電：電池可用十四小時、螢幕更亮。週一開放訂購，事先登記可免運；簡報後工程師回答問題。",
    phrases: [["product launch", "新品發表"], ["designed for", "專為……設計"], ["in advance", "事先"], ["be available to", "可以來……"]]
  },
  {
    id: "traffic-report", title: "早晨路況報導", accent: "美式英語", audio: "audio/lesson-traffic-report.mp3",
    transcript: "This is your morning traffic update. A truck has broken down on the eastbound lanes of Highway 12, causing delays of up to thirty minutes. Drivers are encouraged to use Maple Avenue as an alternative route. Meanwhile, the downtown bridge remains open, but one lane will close tonight at ten for repair work. We will bring you another report in fifteen minutes.",
    summary: "十二號公路東向因卡車拋錨，延誤最長三十分鐘，建議改走 Maple 大道。市區橋樑仍開放，但今晚十點起封閉一線道維修。十五分鐘後再報。",
    phrases: [["break down", "拋錨"], ["alternative route", "替代路線"], ["delays of up to", "最多延誤"], ["repair work", "維修工程"]]
  },
  {
    id: "museum-tour", title: "博物館導覽開場", accent: "加拿大英語", audio: "audio/lesson-museum-tour.mp3",
    transcript: "Welcome to the Harbour Science Museum. My name is Daniel, and I will be your guide today. Our tour begins in the main hall, where you can see our collection of early navigation tools. Afterward, we will move to the third floor to visit the new robotics exhibit. Please remember that photography is allowed, but flash photography is not. The tour lasts about forty minutes, and a gift shop is located next to the exit.",
    summary: "導覽員歡迎大家：先在大廳看早期航海工具，再到三樓看新的機器人展。可拍照但不能用閃光燈；導覽約四十分鐘，出口旁有禮品店。",
    phrases: [["collection", "收藏品"], ["exhibit", "展覽"], ["flash photography", "閃光燈拍照"], ["next to the exit", "出口旁"]]
  },
  {
    id: "safety-briefing", title: "班前安全叮嚀", accent: "英式英語", audio: "audio/lesson-safety-briefing.mp3",
    transcript: "Before we begin the morning shift, I would like to remind everyone of two safety rules. First, all employees must wear protective glasses in the production area, even for short visits. Second, any spill should be reported to a supervisor immediately and not cleaned up alone. New staff members will receive a safety handbook this afternoon. If you have any questions, my office is just past the loading dock.",
    summary: "班前提醒兩條安全規則：進入生產區一律戴護目鏡，即使只是短暫停留；任何溢出物要立刻通報主管，不要自己清理。新人下午領安全手冊。",
    phrases: [["protective glasses", "護目鏡"], ["production area", "生產區"], ["report to", "向……通報"], ["loading dock", "裝卸碼頭"]]
  },
  {
    id: "restaurant-special", title: "餐廳午間特餐留言", accent: "澳洲英語", audio: "audio/lesson-restaurant-special.mp3",
    transcript: "Thanks for calling Marlow's Kitchen. Our lunch special this week is grilled salmon with vegetables and a small salad for fourteen dollars. The special is available from eleven thirty to two, Monday through Friday. We also offer a private dining room for groups of up to twenty, and reservations can be made on our website. We close early on Sundays, at four in the afternoon.",
    summary: "本週午間特餐是烤鮭魚佐蔬菜與小沙拉，十四元，週一到週五十一點半到兩點供應。可預約最多二十人的包廂；週日四點提早打烊。",
    phrases: [["lunch special", "午間特餐"], ["private dining room", "包廂"], ["make a reservation", "訂位"], ["close early", "提早打烊"]]
  },
  {
    id: "software-update", title: "夜間軟體更新通知", accent: "美式英語", audio: "audio/lesson-software-update.mp3",
    transcript: "Attention all employees. Tonight at eleven, the IT department will install a security update on all office computers. Please save your work and log out before leaving the building. The update should take about an hour, and you will not need to restart your computer in the morning. If you work remotely, you will receive a notification on your screen. Contact the help desk if you notice any problems tomorrow.",
    summary: "資訊部今晚十一點為辦公室電腦安裝安全更新，離開前請存檔並登出。約一小時，明早不必重開機；遠端員工會收到螢幕通知。有問題請洽客服台。",
    phrases: [["security update", "安全更新"], ["log out", "登出"], ["work remotely", "遠端工作"], ["help desk", "客服台"]]
  },
  {
    id: "radio-ad-gym", title: "健身房新會員廣告", accent: "加拿大英語", audio: "audio/lesson-radio-ad-gym.mp3",
    transcript: "Ready to start the new year feeling stronger? Visit Northside Fitness this month and enjoy our new member offer. Join before the thirty-first, and your first two months are half price. Our modern gym is open twenty-four hours, with free classes every weekday evening. Bring a friend, and you will both receive a free personal training session. Visit our website or stop by our front desk today.",
    summary: "健身房廣告：本月三十一日前入會，前兩個月半價；全天開放，平日晚上有免費課程。帶朋友一起來，兩人各得一堂免費私人教練課。",
    phrases: [["new member offer", "新會員優惠"], ["half price", "半價"], ["free classes", "免費課程"], ["stop by", "順道拜訪"]]
  },
  {
    id: "client-visit-voicemail", title: "客戶來訪行程確認", accent: "澳洲英語", audio: "audio/lesson-client-visit-voicemail.mp3",
    transcript: "Hi Mr. Patel, it's Olivia from Brightway Consulting. I'm calling to confirm your visit to our Sydney office next Wednesday. Your first meeting is at nine with our finance director, followed by a tour of the facility at eleven. A car will pick you up from your hotel at eight fifteen. Please let me know if you have any dietary requirements for lunch. I look forward to seeing you.",
    summary: "顧問公司確認 Patel 先生下週三到雪梨辦公室：九點與財務長開會，十一點參觀設施，八點十五分派車到飯店接送。午餐若有飲食限制請告知。",
    phrases: [["confirm your visit", "確認來訪"], ["followed by", "接著是"], ["pick up from", "到……接送"], ["dietary requirements", "飲食需求"]]
  },
  {
    id: "office-relocation", title: "辦公室搬遷說明", accent: "英式英語", audio: "audio/lesson-office-relocation.mp3",
    transcript: "I would like to update everyone on next month's office move. Our team will relocate to the new building on Canal Street on the fifteenth. Packing boxes will be delivered to each department this Friday, and all items must be labelled with your name and floor number. Parking passes for the new building will be handed out on Monday. Please note that the current office will be closed for cleaning after the move.",
    summary: "下個月十五日團隊搬到 Canal 街新大樓。本週五各部門會收到紙箱，物品須標示姓名與樓層；週一發放新大樓停車證，搬完後舊辦公室關閉清潔。",
    phrases: [["relocate to", "搬遷到"], ["be labelled with", "標示上"], ["parking pass", "停車證"], ["closed for cleaning", "關閉清潔"]]
  },
  {
    id: "catering-order-change", title: "活動訂餐人數變更（兩人對話）", accent: "美式英語", audio: "audio/lesson-catering-order-change.mp3",
    transcript: "Woman: Hi Marcus, it's Dana. I'm afraid we need to change the lunch order for Thursday's workshop.\nMan: Sure, Dana. How many people are we looking at now?\nWoman: The headcount went from forty to fifty-five after two more departments signed up.\nMan: That's fine, but I'll need your list of dietary restrictions by tomorrow noon so the kitchen can prepare.\nWoman: Understood. I'll send it this afternoon. Could you also add a vegetarian option?\nMan: Of course. We'll include a pasta dish. I'll email you a revised quote within the hour.",
    summary: "活動企劃 Dana 打給外燴業者 Marcus：週四工作坊的午餐人數從四十人增為五十五人。Marcus 需要明天中午前收到飲食限制名單；Dana 要求加素食選項，Marcus 會加入義大利麵，並在一小時內寄出修正報價。",
    phrases: [["headcount", "人數"], ["dietary restrictions", "飲食限制"], ["revised quote", "修正報價"], ["sign up", "報名"]],
    questions: [
      { id: "LQ-CATER-1", prompt: "Why is the woman calling?", options: ["To order more food","To change a lunch order","To cancel an event","To ask about a price"], answer: 1, explanation: "She says they need to change the lunch order for Thursday's workshop because more people signed up." },
      { id: "LQ-CATER-2", prompt: "How many people will attend now?", options: ["Forty","Forty-five","Fifty-five","Sixty"], answer: 2, explanation: "The headcount went from forty to fifty-five." },
      { id: "LQ-CATER-3", prompt: "What will the man do within the hour?", options: ["Visit the venue","Call the kitchen","Cancel a dish","Send a revised quote"], answer: 3, explanation: "He says he will email a revised quote within the hour." }
    ]
  },
  {
    id: "printer-jam-meeting", title: "影印機故障與稽核報告（三人對話）", accent: "美式英語", audio: "audio/lesson-printer-jam-meeting.mp3",
    transcript: "Woman 1: Tom, thanks for coming up. The printer on our floor keeps jamming, and the audit reports are due on Monday.\nMan: I checked it this morning. A roller is worn out, so I need to order a replacement part. It should arrive next Wednesday.\nWoman 2: Wednesday is too late for us. Could we use the printer on the fourth floor until then?\nMan: That should work. I'll give you the access codes before lunch.\nWoman 1: Great. Priya, please print the reports in two batches so we don't overload it.\nWoman 2: Will do. And I'll ask the team to avoid color printing for now.\nMan: Good idea. I'll stop by on Thursday to make sure everything is working.",
    summary: "三樓的影印機一直卡紙，稽核報告週一要交；技師 Tom 說要換滾輪，下週三才到。Priya 說週三太晚，於是改用四樓影印機，Tom 午餐前提供存取碼，報告分兩批印、暫時避免彩色列印，Tom 週四再來檢查。",
    phrases: [["audit report", "稽核報告"], ["replacement part", "替換零件"], ["access code", "存取碼"], ["in two batches", "分兩批"]],
    questions: [
      { id: "LQ-PRINT-1", prompt: "What problem are the speakers discussing?", options: ["A printer is jamming","A computer is slow","A report is missing","A budget is late"], answer: 0, explanation: "The woman says the printer on their floor keeps jamming." },
      { id: "LQ-PRINT-2", prompt: "What will Tom give Priya before lunch?", options: ["A new printer","Access codes","A repair manual","Color cartridges"], answer: 1, explanation: "He says he will give them the access codes before lunch." },
      { id: "LQ-PRINT-3", prompt: "Why does Priya say, \"Wednesday is too late for us\"?", options: ["The part is expensive","Tom will be away","The office will be closed","The reports are due Monday"], answer: 3, explanation: "The audit reports are due on Monday, so a part arriving Wednesday is too late." }
    ]
  },
  {
    id: "client-visit-moved", title: "客戶來訪提前（三人對話）", accent: "美式英語", audio: "audio/lesson-client-visit-moved.mp3",
    transcript: "Woman 1: Thanks for joining, everyone. The Lakeside Hotels visit has moved from Thursday to Tuesday morning because their director has to travel.\nMan: That's earlier than planned. I'm not sure the new slides will be ready.\nWoman 2: I can finish the pricing section tonight if someone else prepares the product demo.\nMan: I'll take the demo. I just need the sample units from the warehouse.\nWoman 1: I'll email the warehouse now. Maria, could you also book a meeting room with a projector?\nWoman 2: Already done. Room 3B, at nine thirty.\nWoman 1: Perfect. Let's do a short rehearsal on Monday at four.",
    summary: "Lakeside Hotels 的來訪因其主管要出差，從週四提前到週二上午。Maria 今晚完成報價部分，Paul 負責產品示範並需要倉庫的樣品；經理寄信給倉庫，Maria 已訂好 3B 會議室（九點半），週一下午四點排練。",
    phrases: [["move up", "提前"], ["sample unit", "樣品"], ["book a meeting room", "預訂會議室"], ["rehearsal", "彩排"]],
    questions: [
      { id: "LQ-VISIT-1", prompt: "What has changed?", options: ["A client visit has been moved up","A hotel booking was canceled","A product was recalled","A director resigned"], answer: 0, explanation: "The visit moved from Thursday to Tuesday morning, which is earlier." },
      { id: "LQ-VISIT-2", prompt: "What does Maria mean when she says, \"Already done\"?", options: ["She forgot the projector","She will cancel the meeting","She has already reserved a room","She has finished the slides"], answer: 2, explanation: "She answers the request to book a meeting room by saying it is done: Room 3B at nine thirty." },
      { id: "LQ-VISIT-3", prompt: "What will happen on Monday at four?", options: ["A client visit","A rehearsal","A warehouse inspection","A budget review"], answer: 1, explanation: "The manager proposes a short rehearsal on Monday at four." }
    ]
  },
  {
    id: "part1-measuring-parts", title: "Part 1 照片題：量測金屬零件", accent: "澳洲英語", audio: "audio/lesson-part1-measuring-parts.mp3", image: "images/photo-16.jpg",
    transcript: "Narrator: Look at the photograph.\nA. A man is writing in a notebook.\nB. A man is measuring a metal part.\nC. Some gears are being packed into boxes.\nD. A lamp is hanging from the ceiling.",
    summary: "Part 1 照片題練習：先看照片再聽四個敘述。正解 B——照片裡的男子用游標卡尺量金屬零件。A 沒有人在寫字；C 的 are being packed 需要有人正在裝箱，但沒有；D 的燈是附在支架上，不是掛在天花板。",
    phrases: [["measure a part", "量測零件"], ["are being packed", "正被裝箱（需有人在做）"], ["hang from the ceiling", "懸掛在天花板"], ["safety glasses", "護目鏡"]],
    questions: [
      { id: "LQ-P1-1", prompt: "Which statement best describes the photo?", options: ["A man is writing in a notebook.","A man is measuring a metal part.","Some gears are being packed into boxes.","A lamp is hanging from the ceiling."], answer: 1, explanation: "He holds calipers against a small metal part. Nobody is writing or packing, and the lamp is on an arm, not hanging from the ceiling." }
    ]
  },
  {
    id: "part2-brochures", title: "Part 2 應答題：否定問句與間接回答", accent: "英式英語", audio: "audio/lesson-part2-brochures.mp3",
    transcript: "Man: Haven't the new brochures been delivered yet?\nA. Yes, the brochure cover is blue.\nB. They're supposed to come this afternoon.\nC. The printer is on the third floor.",
    summary: "Part 2 應答題：問「新型錄還沒送到嗎？」。正解 B——不直接說 yes/no，而是說下午會到（迂迴回答）。A 重複 brochure 的字但答非所問；C 提到 printer 是相關詞干擾。",
    phrases: [["be supposed to", "預計／應該"], ["be delivered", "被送達"], ["not yet", "還沒"], ["this afternoon", "今天下午"]],
    questions: [
      { id: "LQ-P2-1", prompt: "Choose the best response to the question.", options: ["Yes, the brochure cover is blue.","They're supposed to come this afternoon.","The printer is on the third floor."], answer: 1, explanation: "It answers the question indirectly with the expected time. A repeats \"brochure\" but does not answer; C is a related but unrelated fact." }
    ]
  },
  {
    id: "part3-room-double-booking", title: "Part 3 對話：會議室重複預約（澳洲）", accent: "澳洲英語", audio: "audio/lesson-part3-room-double-booking.mp3",
    transcript: "Woman: Hi Jack, I just checked the calendar. The finance team has also booked Room 5 for tomorrow at two.\nMan: Oh, I reserved it last week for the sales presentation. I never got a notice about a conflict.\nWoman: The system must have glitched. They have a client coming, so they can't move.\nMan: Then I'll switch to Room 7. It has a smaller screen, though.\nWoman: I can lend you the portable projector from my office.\nMan: That would be great. I'll pick it up this afternoon.",
    summary: "5 號會議室明天兩點被財務團隊重複預約（系統出錯）。財務有客戶不能改，男子改用 7 號室，但螢幕較小；女子借他可攜式投影機，他今天下午去拿。",
    phrases: [["double booking", "重複預約"], ["conflict", "衝突"], ["glitch", "小故障"], ["portable projector", "可攜式投影機"]],
    questions: [
      { id: "LQ-P3-1", prompt: "What problem are the speakers discussing?", options: ["A client canceled a visit","A room has been booked twice","A projector is broken","A presentation was postponed"], answer: 1, explanation: "The finance team also booked Room 5 at the same time the man had reserved it." },
      { id: "LQ-P3-2", prompt: "What is the man concerned about?", options: ["The cost of Room 7","The distance to Room 7","The size of a screen","The time of the meeting"], answer: 2, explanation: "He says Room 7 has a smaller screen." },
      { id: "LQ-P3-3", prompt: "What will the man do this afternoon?", options: ["Pick up a projector","Call the finance team","Print some slides","Move to Room 5"], answer: 0, explanation: "He says he will pick up the portable projector this afternoon." }
    ]
  },
  {
    id: "part4-parking-closure", title: "Part 4 獨白：停車場封閉公告（英式）", accent: "英式英語", audio: "audio/lesson-part4-parking-closure.mp3",
    transcript: "Attention, all employees. Starting next Monday, the main parking lot will be closed for resurfacing for two weeks. During that time, you may park in the lot behind the library, and a free shuttle will run every ten minutes between that lot and the main entrance. Carpool participants will be given priority spaces near the east gate. For more details, please check the notice board in the lobby or contact the facilities office.",
    summary: "下週一起主停車場因重鋪路面關閉兩週；員工可停在圖書館後方停車場，並有每十分鐘一班的免費接駁車到主入口。共乘者在東門附近有優先車位；詳情看大廳公佈欄或洽總務處。",
    phrases: [["resurfacing", "重鋪路面"], ["shuttle", "接駁車"], ["carpool", "共乘"], ["priority space", "優先車位"]],
    questions: [
      { id: "LQ-P4-1", prompt: "What will happen next Monday?", options: ["A library will open","A parking lot will be repaved","A shuttle service will end","A new gate will be built"], answer: 1, explanation: "The main parking lot will be closed for resurfacing starting next Monday." },
      { id: "LQ-P4-2", prompt: "What will be provided during the closure?", options: ["A free shuttle","Parking vouchers","Bicycle racks","Taxi fares"], answer: 0, explanation: "A free shuttle will run every ten minutes between the other lot and the main entrance." },
      { id: "LQ-P4-3", prompt: "Who will receive priority spaces?", options: ["Visitors","Library staff","Facilities managers","Carpool participants"], answer: 3, explanation: "Carpool participants will be given priority spaces near the east gate." }
    ]
  }
];
