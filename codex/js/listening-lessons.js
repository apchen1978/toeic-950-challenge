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
  }
];
