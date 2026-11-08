# PROGRESS

- last_machine: LAPTOP-IISERVR8
- last_updated: 2026-11-08T14:20:54+08:00
- sync_state: synced
- handoff: 2026-11-08 收工。使用者重新下載 FB 粉專匯出（`facebook-tcfcTAIWAN-2026-11-8-sl9t9nEA.zip`，74 KB／4 檔），已驗證是本粉專（`@tcfcTAIWAN`，分類「基督教會」，官網 `tcfc.tw`，地址衛道路112號），但**只有 `profile_information`，沒有貼文、相片、影片、粉絲名單、洞察報告**，再次印證 2026-11-06 的結論，Phase B 維持取消。已在專案根目錄建立 `教會資料\` 素材收件匣（01_粉專匯出／02_照片／03_文件／04_待分類），並列入 `.gitignore`；該 zip 已解壓進 `01_粉專匯出`，`profile_information.json` 另解碼成可讀的 `粉專基本資料.md`。**注意：`教會資料\` 不進 Git、也不同步，只存在本機（LAPTOP-IISERVR8）**。下次開工：等使用者把照片放進 `02_照片`，再盤點素材、挑圖上架；或續跑 FB 素材庫 Phase A（Graph API）。
- MCP：notebooklm, notion

## 目前目標

1. FB 歷史素材庫 Phase A：驗證 Meta Graph API 讀得到自家粉專資料（半天，不寫程式）。
2. 依 2026-10-27 健檢結論執行 Phase 0（下架測試公告、刪重複 draft、修正 09-12 檔名、下架 3 支失效直播、補 404／隱私頁、修正 CMS slug）。
3. 建立素材收件匣，把手上照片與文件集中，再挑選適合的內容上網站。

## 已完成

- 2026-10-27 全站健檢：sitemap 131 網址、43 期週報 PDF 全部 200、CMS OAuth worker 正常。
- 2026-10-28 從 GitHub clone 到本機工作區，改由 `D:\AI-Projects\教會網站_台中北屯貴格會` 作為正本；Synology `_CaseConflict` 資料夾不再編輯。
- 2026-10-28 建立 Synology 鏡像 `_mirror\教會網站_台中北屯貴格會`（277 檔、72.44 MB）；等雲端上傳確認後再把 `sync_state` 改 `synced`。
- 2026-11-06 建立 FB 歷史素材庫計畫（三層架構：原始層在 Synology、索引層進 repo、發布層精選壓縮；Phase A–E）。
- 2026-11-06 確認 Meta 已移除粉專層級一次性匯出，Phase B 取消；歷史資料改以 Meta Graph API 為唯一管道。
- 2026-11-06 確認 `sync_state: synced`（原待辦「確認 Synology 上傳後改 synced」已完成）。
- 2026-11-08 驗證使用者下載的 FB 粉專匯出 zip：確認為本粉專（`@tcfcTAIWAN`、分類「基督教會」、官網 `tcfc.tw`、衛道路112號），但內容僅 `profile_information` 4 檔，無貼文／相片／影片／粉絲／洞察。
- 2026-11-08 建立 `教會資料\` 素材收件匣（01_粉專匯出／02_照片／03_文件／04_待分類），已 gitignore；匯出檔解壓完成，並產出可讀的 `粉專基本資料.md`（含 321 理念與聚會時間）。
- 2026-11-08 更新 `.gitignore`（`教會資料/`）並發布（`6a2b322`）。

## 進行中

- 無。

## 待辦

1. FB 歷史素材庫 Phase A：建 Meta app、用 Graph API Explorer 打 `GET /me/accounts` 與 `GET /{page-id}/posts?limit=5`，確認自家粉專資料讀得到（約半天，不寫程式）。
2. Phase 0 健檢修正（見駕駛艙「下一步」）。
3. 等使用者把照片／文件放進 `教會資料\`，盤點素材並挑選適合上網站的內容（相簿、教會簡介、場地照）。
4. Phase 1.5：歷史週報 74 期匯入（2391–2465，2424 缺）。
5. Phase 1：補牧師團隊、信仰宣言、教會簡介、交通資訊與 2026.04.12 相簿。

## 風險／阻塞

- 本機尚無 `node_modules`；`astro dev`／`build` 需先 `npm install`。
- 發布腳本 `scripts/publish-site.mjs` 會自動 commit＋push＋等待 Actions；未安裝相依前不要執行。
- repo 是 GitHub Pages 使用者站（`t22319915-arch.github.io`），remote 名稱不可改。
- 2026-10-04 主日直播連結從缺、2424 期週報缺件（沿用舊紀錄）。
- 本站是 GitHub Pages（總量 1 GB、單檔 100 MB）且 repo 為公開：FB 原始照片與影片**不得進 Git**，只放精選壓縮後的相簿。
- 歷史照片與兒童肖像的使用同意原則尚未定案，會阻塞相簿上架（Phase D），不會阻塞 Phase A 驗證。
- 歷史資料取得只剩 Graph API 一條路（官方粉專匯出已不可用）；若 API 也不通，只能人工逐本相簿下載，約 30 本、可分次完成。
- 若貼文是先用個人帳號發布、再分享到粉專，不會出現在粉專 API，需人工補或放棄。
- `教會資料\`（素材收件匣）已 gitignore，**只存在目前這台 LAPTOP-IISERVR8，不會透過 Git 或 Synology 同步**；換電腦就看不到，重要素材要另外備份。

## 下一步

1. 使用者把照片／文件放進 `教會資料\`（建議一活動一資料夾、檔名帶日期），再盤點素材、挑選上網站的內容。
2. 跑 FB 素材庫 Phase A 第 1–4 步：建 Meta app（開發模式，不送審）→ Graph API Explorer 取 page token → 測 `me?fields=id,name,fan_count` 與 `me/posts?fields=id,created_time,message,permalink_url,attachments{media,subattachments}&limit=5`。
3. `npm install` 驗證本機可 `astro build`，再開 Phase 0。

## 工作日誌

- 2026-10-27：健檢與完善計畫；發布 2508 期週報與 10-25 直播（`afe4111`）。
- 2026-10-28：ASUS clone 本 repo，改為本機正本；補 `PROGRESS.md`。
- 2026-11-06：評估 FB 歷史資料取得方式（比較 Apify 模式、盤點 GitHub 現成專案），決議改走 Meta Graph API；建立 FB 歷史素材庫計畫（三層架構、Phase A–E），掛入待辦第 1 項。本項由 `ai-agent-external-tools` 轉入。
- 2026-11-06：實測粉專匯出，確認三個入口（粉專設定／Business Suite／專業主控板）都導向個人帳號「下載你的資訊」，「粉絲專頁」分類僅含按讚與追蹤。Phase B 取消，改以 Graph API 為唯一管道；`sync_state` 確認為 `synced`。
- 2026-11-08：驗證新下載的 FB 匯出 zip（僅 `profile_information`，無貼文與照片），確認是本粉專；建立 `教會資料\` 素材收件匣並 gitignore，解壓匯出檔、產出 `粉專基本資料.md`；發布 `6a2b322`。
