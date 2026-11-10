# 部署 / Deployment

`codex/` 是唯一上線的練習程式。網站根目錄的 `index.html` 只把訪客轉到 `codex/`（相對路徑，本機預覽與 GitHub Pages 都適用）。

The only live app is `codex/`. The repository root `index.html` redirects visitors there with a relative URL, so the same page works locally and on GitHub Pages.

## 網址

- 正式站：<https://apchen1978.github.io/toeic-950-challenge/> → `codex/`
- 練習頁：<https://apchen1978.github.io/toeic-950-challenge/codex/>
- 已加到主畫面的 PWA 仍從 `codex/manifest.webmanifest` 開啟（`start_url` 與 `scope` 都是 `./`）。根目錄轉址不會改掉這個範圍，也不要在根目錄註冊 service worker。

## 電腦、手機、公開網站

三個入口用的是同一份 `codex/` 程式，但網址不同，瀏覽器紀錄不會混在一起。

- **家裡的電腦：** 在 git 克隆的資料夾雙擊 `start-toeic.cmd`。它會在安全時快轉 `main`，再把 `codex/` 當成網站根目錄，開在 `http://127.0.0.1:4190/`。路徑是 `/`，不是 `/codex/`，所以這台電腦上的作答紀錄鍵仍是 `toeic950`，與舊的非 git 資料夾相同。請改用這份 git 克隆，不要再維持另一份桌面複本。
- **手機 PWA 與公開網站：** <https://apchen1978.github.io/toeic-950-challenge/codex/> 。加到主畫面後，範圍仍是 `codex/`。
- **電腦旁邊的手機，暫時看同一份檔案：** 雙擊 `start-phone.cmd`。它綁在區網並印出 Wi-Fi 網址，例如 `http://192.168.1.20:4190/`。這只是區域網路預覽，不是已安裝的 PWA。

The PC launcher is `start-toeic.cmd`. The installed phone PWA and the public site are GitHub Pages at `/codex/`. `start-phone.cmd` is only a same-Wi-Fi preview.

啟動器只在「目前分支是 `main`，而且工作目錄是乾淨的」時執行 `git pull --ff-only`。離線、不在 `main`、或有未提交／未追蹤的變更時，它會印出原因並繼續用目前檔案。它不會 `reset`、不會捨棄變更、也不會自動切換分支。

桌面伺服器有路徑允許清單，只提供練習頁會用到的檔案：`index.html`、`styles.css`、`sw.js`、`manifest.webmanifest`、`js/*.js`、`data/questions.json`、`audio/manifest.json`、`audio/*.mp3`、`images/*.(png|jpg|jpeg|webp|svg)`、`icons/*.png`。照片目前是 JPEG。允許清單也接受 webp，之後若改格式不會被伺服器擋下。

## 預覽與測試

```bash
node serve.mjs                          # 開發用：http://127.0.0.1:4180/ 會轉到 /codex/
node codex/serve.mjs 4190 --open --update   # 與 start-toeic.cmd 相同
npm test                                # node --test tests/*.test.mjs
```

不要直接雙擊 `index.html`。瀏覽器會擋住 `fetch` 題庫。

## Service worker 快取

安裝時只預先快取程式殼與資料（HTML、CSS、JS、`data/questions.json`、`audio/manifest.json`、圖示）。照片與 MP3 在第一次成功載入時寫入快取；之後同一檔案走 cache-first，離線可以再看、再聽。音檔的 `Range` 要求會從完整檔案回 206，避免手機播放中斷。

聽力音檔不在安裝清單裡，第一次播放才快取。改過程式殼、題庫、音檔清單或這個快取策略後，把 `codex/sw.js` 的 `CACHE` 從 `toeic950-codex-vN` 加一版再部署。目前版本是 `toeic950-codex-v48`。已安裝的人需要連網開啟一次才會換上新的 service worker。換版會清掉舊快取；看過的圖片與聽過的音檔要在連網時再打開一次，才會重新留下。

## 來源

GitHub 的 `main` 是唯一正式來源。其他電腦上的副本應先拉取 `main` 再修改，不要各自保存一份題庫、圖片或音檔。

GitHub `main` is the single source of truth. Pull it before editing a local copy; do not keep a separate question bank, image set, or audio set.

## 仍留在根目錄的舊檔

`tests/bank-and-scoring.test.mjs` 仍會讀根目錄的 `data/questions.json`、`js/scoring.js` 與 `js/skills.js`（舊的 30 題題庫）。因此這次不刪除舊題庫。根目錄的 `js/app.js`、`js/audio.js`、`styles.css` 已不再被首頁載入，但與舊題庫放在一起，避免只刪掉一半。

`codex/audio/letter-a.mp3` 沒有被練習頁或音檔 manifest 使用，但 `tests/recorded-audio.test.mjs` 與 `scripts/generate-letter-a.ps1` 仍引用這個檔名，所以保留。
