# TOEIC 950+ Challenge

個人用 TOEIC 模考練習站（非官方）。純靜態網站，無後端、無 build。正式練習頁在 `codex/`；網站根目錄會轉到那一頁。部署、預覽、測試與 service worker 見 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 本機預覽
```
node serve.mjs        # 開發用：http://127.0.0.1:4180/ 會轉到 /codex/
npm test              # 單元測試（題庫結構 + 計分）
```
家裡的電腦請用 git 克隆裡的 `start-toeic.cmd`（`http://127.0.0.1:4190/`）。不要直接雙擊 index.html（瀏覽器會擋 fetch 題庫）。說明見 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 結構
- `codex/`：目前唯一的練習程式（題庫、畫面、PWA、圖片與音檔）。
- 根目錄 `index.html`：轉到 `codex/`。
- 根目錄 `data/questions.json`、`js/scoring.js`、`js/skills.js`：舊的 30 題題庫，單元測試仍會讀。畫面上不再使用。

## 注意
- 本 App 題目為依多益題型自行編寫的模擬題，並非 ETS 官方試題。 All questions are original simulations based on TOEIC question types; none are official ETS test questions.
- 分數為「非官方估計」，不等同 ETS 成績。 Scores are unofficial estimates and do not represent an ETS score.
- 聽力音質取決於裝置語音與已內建的固定配音。
- 作答進度與紀錄存在瀏覽器 localStorage（換瀏覽器／清除資料會消失）。
- GitHub 的 `main` 是唯一正式來源。其他副本請先拉取再改。
