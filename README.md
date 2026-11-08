# TOEIC 950+ Challenge

個人用 TOEIC 模考練習站（非官方）。純靜態網站，無後端、無 build，可直接部署到 GitHub Pages。

## 本機預覽
```
cd C:\Users\grays\Documents\toeic-950-challenge
node serve.mjs        # 打開 http://127.0.0.1:4180/
npm test              # 單元測試（題庫結構 + 計分）
```
不要直接雙擊 index.html（瀏覽器會擋 fetch 題庫）。

## 結構
- `data/questions.json`：題庫（題組 → 題目）。擴充題目只改這個檔。
- `js/scoring.js`：計分、弱項統計、分數估計（純函式，有測試）。
- `js/audio.js`：聽力語音（瀏覽器內建 speech synthesis）。
- `js/skills.js`：題型標籤與中文練習建議。
- `js/app.js`：畫面與流程。

## 注意
- 所有題目為原創；分數為「非官方估計」，不等同 ETS 成績。
- 聽力音質取決於裝置語音：Edge 的 Natural/Online 語音最好；首頁「聽力音色」可選擇與試聽。
- 作答進度與紀錄存在瀏覽器 localStorage（換瀏覽器／清除資料會消失）。
