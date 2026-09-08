# 台中北屯貴格會官方網站

- **網站網址**：<https://t22319915-arch.github.io/>
- **管理後台**：<https://t22319915-arch.github.io/admin>（需先完成下方「啟用後台登入」）
- **費用**：全免費（GitHub Pages 託管＋Cloudflare 授權代理免費額度）
- **技術**：Astro 靜態網站＋Tailwind CSS＋Decap CMS（繁體中文後台）

日常維護**不需要寫程式**，全部在後台用滑鼠操作。發布後約 1–2 分鐘網站自動更新。

---

## 目錄

1. [啟用後台登入（只需做一次）](#1-啟用後台登入只需做一次)
2. [每週更新主日直播連結](#2-每週更新主日直播連結約-30-秒)
3. [發布公告／活動消息](#3-發布公告活動消息約-1-分鐘)
4. [上傳活動相簿](#4-上傳活動相簿約-2-分鐘)
5. [新增牧師／同工介紹](#5-新增牧師同工介紹)
6. [修改基本資料（地址、電話、聚會時間）](#6-修改基本資料地址電話聚會時間)
7. [網站地圖](#7-網站地圖)
8. [本機開發（給協作者）](#8-本機開發給協作者)
9. [常見問題](#9-常見問題)

---

## 1. 啟用後台登入（只需做一次）

後台登入需要一個免費的「授權代理」。詳細步驟請看 [`cms-auth-worker/README.md`](cms-auth-worker/README.md)，
摘要如下：

1. 在 GitHub 註冊一個 OAuth App（Settings → Developer settings → OAuth Apps），
   callback 填 `https://<你的worker>.workers.dev/callback`，記下 Client ID／Client secret。
2. 在 Cloudflare（免費註冊）建立一個 Worker，把 `cms-auth-worker/worker.js` 貼上，
   並在 Variables 設定 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`。
3. 把 Worker 網址填入 `public/admin/config.yml` 的 `backend.base_url`，推送到 GitHub。
4. 開啟 `/admin` →「使用 GitHub 登入」→ 授權 → 看到中文選單即成功。

---

## 2. 每週更新主日直播連結（約 30 秒）

1. 開啟後台 → **主日直播連結** → **新增**（或編輯本週那筆）。
2. 填寫：
   - **標題**：如 `2026.09.14 主日禮拜`
   - **日期**：選擇主日日期
   - **YouTube 連結**：貼上該場直播的網址（未公開影片的連結也可，見下方注意）
   - **設為本週直播**：打勾（記得把上一週那筆的勾取消，一次只留一筆）
3. 按 **發布** → 等 1–2 分鐘 → 首頁與影音專區自動換上新直播。

> **YouTube 設定注意**：直播影片請設為「公開」或「未公開」。
> 「未公開」表示只有知道連結的人能看（不會出現在搜尋），但放在網站上大家都看得到；
> 若設為「私人」，網站上的播放器會無法播放。

---

## 3. 發布公告／活動消息（約 1 分鐘）

例如：郊外禮拜通知、暫停實體聚會一次、聖誕晚會報名等。

1. 後台 → **最新消息與活動** → **新增**。
2. 填寫標題、日期，**分類**選「公告事項」或「活動訊息」。
3. **摘要**寫一句話（會顯示在列表卡片上）。
4. 需要時上傳**封面圖片**；需要置頂在首頁公告欄請勾選**置頂**。
5. 內文支援粗體、條列、連結（工具列按鈕操作即可）。
6. 按 **發布**。暫時不想公開可先勾**草稿**。

---

## 4. 上傳活動相簿（約 2 分鐘）

1. 後台 → **活動相簿** → **新增**。
2. **相簿標題**建議含日期，如 `2026.09.06 郊外禮拜`；**活動日期**選當天（相簿依此排序）。
3. **照片**欄位可一次選多張上傳（建議每張 2MB 以下、橫式，手機拍完直接上傳即可）。
4. 可選一張**封面圖片**（不選則自動用第一張）。
5. 按 **發布** → 顯示在首頁「活動剪影」與影音專區。

---

## 5. 新增牧師／同工介紹

後台 → **牧師與同工** → **新增**：填姓名、職銜、上傳照片（建議正方形）、
**排序**數字小的排前面，簡介寫在內文區 → 發布。

---

## 6. 修改基本資料（地址、電話、聚會時間）

後台 → **網站基本設定** → **基本資料**：教會名稱、標語、地址、電話、Email、
Facebook／YouTube 連結、**聚會時間表**（可新增、刪除、調整順序）都可直接改 → 發布。
頁首、頁尾、首頁聚會表、聯絡頁會同步更新。

---

## 7. 網站地圖

| 路徑 | 說明 |
| ---- | ---- |
| `/` | 首頁：Hero、最新公告、本週直播、近期消息、聚會時間、牧師／相簿預覽 |
| `/about` | 關於我們：教會簡介、信仰宣言、牧師團隊 |
| `/announcements` | 最新消息列表（可篩選公告／活動） |
| `/announcements/[slug]` | 單則消息內頁（含上下則導覽） |
| `/media` | 影音專區：本週直播、過往直播、活動相簿 |
| `/media/gallery/[slug]` | 相簿內頁（點擊放大、左右切換） |
| `/contact` | 聯絡我們：資訊卡、地圖、社群連結 |
| `/admin` | 管理後台（不列入搜尋引擎） |

---

## 8. 本機開發（給協作者）

```sh
npm install
npm run dev      # http://localhost:4321
npx astro check  # 型別檢查
npm run build    # 產出 dist/
```

推送到 `main` 分支即自動部署（`.github/workflows/deploy.yml`：安裝→檢查→建置→發布到 Pages，約 1–2 分鐘）。

### 專案結構

```text
├── public/                 # 原樣發布：logo、og-cover、robots、admin(CMS)
├── src/
│   ├── assets/             # 需優化圖片（Logo、Hero）
│   ├── components/         # Header/Footer/Hero/直播卡/相簿卡…共 10 個
│   ├── content/            # Markdown 內容（CMS 資料來源）
│   │   ├── announcements/  # 最新消息
│   │   ├── liveStream/     # 直播連結
│   │   ├── pastors/        # 牧師同工
│   │   ├── gallery/        # 相簿
│   │   └── beliefs/        # 信仰宣言
│   ├── data/site.json      # 網站基本設定（CMS「網站基本設定」）
│   ├── layouts/Layout.astro# HTML 骨架＋SEO/OG meta
│   ├── pages/              # 7 個頁面路由
│   ├── styles/global.css   # Tailwind v4＋品牌色＋Markdown 排版
│   └── utils/              # YouTube 網址解析、日期格式
├── cms-auth-worker/        # CMS 登入用 OAuth 代理（Cloudflare Workers）
└── .github/workflows/      # 自動部署
```

---

## 9. 常見問題

**Q：發布後網站沒馬上更新？**
A：正常需 1–2 分鐘（GitHub 自動重新建置）。可在 repo 的 Actions 頁看到進度；
若超過 5 分鐘，檢查 Actions 是否紅燈報錯。

**Q：後台按發布出現錯誤？**
A：多半是登入逾時，重新整理後台再登入一次即可。

**Q：照片太大傳不上去？**
A：單張請壓到 2MB 以下（手機相簿→編輯→裁一下或降解析度即可）。

**Q：想換網址（如 tcctaiwan.org）？**
A：買好域名後，在 repo Settings → Pages → Custom domain 填入，
並到域名商加一筆 CNAME 指到 `t22319915-arch.github.io`，再把 `astro.config.mjs` 的
`site` 改為新網址即可，全站 canonical／sitemap 自動跟著換。

**Q：這台電腦用 Synology Drive 同步，node_modules 很大怎麼辦？**
A：`node_modules/`、`dist/`、` .astro/` 已在 `.gitignore`（不會上傳 GitHub），
但仍會佔用同步空間。建議在 Synology Drive 用戶端的「選擇性同步／檔案篩選」排除
`node_modules`（重新需要時跑 `npm install` 即可還原）。

**Q：想加新功能（線上奉獻、報名表單…）？**
A：直接找開發者加元件即可，架構已預留擴充空間。
