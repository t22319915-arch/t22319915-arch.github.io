# PROGRESS

- last_machine: AFRO
- last_updated: 2026-11-06T11:35:00+08:00
- sync_state: synced
- handoff: 2026-11-06 於 LAPTOP-IISERVR8 接續（**本機路徑 `C:\AI-Projects`，與原紀錄 `D:\AI-Projects` 不同**；`last_machine: AFRO` 為原歷史紀錄，未覆寫）。新增 FB 歷史素材庫計畫：自家粉專改走 Meta Graph API、不走爬蟲，先做 Phase A 驗證；完整計畫在 notes repo（private），本 repo 只留摘要。Phase 0 健檢修正與 Phase 1.5 歷史週報匯入仍未開始。

## 目前目標

1. FB 歷史素材庫 Phase A：驗證 Meta Graph API 讀得到自家粉專資料（半天，不寫程式）。
2. 依 2026-10-27 健檢結論執行 Phase 0（下架測試公告、刪重複 draft、修正 09-12 檔名、下架 3 支失效直播、補 404／隱私頁、修正 CMS slug）。

## 已完成

- 2026-10-27 全站健檢：sitemap 131 網址、43 期週報 PDF 全部 200、CMS OAuth worker 正常。
- 2026-10-28 從 GitHub clone 到本機工作區，改由 `D:\AI-Projects\教會網站_台中北屯貴格會` 作為正本；Synology `_CaseConflict` 資料夾不再編輯。
- 2026-10-28 建立 Synology 鏡像 `_mirror\教會網站_台中北屯貴格會`（277 檔、72.44 MB）；等雲端上傳確認後再把 `sync_state` 改 `synced`。

## 進行中

- 無。

## 待辦

1. FB 歷史素材庫 Phase A：建 Meta app、用 Graph API Explorer 打 `GET /me/accounts` 與 `GET /{page-id}/posts?limit=5`，確認自家粉專資料讀得到（約半天，不寫程式）。
2. Phase 0 健檢修正（見駕駛艙「下一步」）。
3. Phase 1.5：歷史週報 74 期匯入（2391–2465，2424 缺）。
4. Phase 1：補牧師團隊、信仰宣言、教會簡介、交通資訊與 2026.04.12 相簿。
5. 確認 Synology `_mirror\教會網站_台中北屯貴格會` 上傳完成後，把 `sync_state` 改 `synced`。

## 風險／阻塞

- 本機尚無 `node_modules`；`astro dev`／`build` 需先 `npm install`。
- 發布腳本 `scripts/publish-site.mjs` 會自動 commit＋push＋等待 Actions；未安裝相依前不要執行。
- repo 是 GitHub Pages 使用者站（`t22319915-arch.github.io`），remote 名稱不可改。
- 2026-10-04 主日直播連結從缺、2424 期週報缺件（沿用舊紀錄）。
- 本站是 GitHub Pages（總量 1 GB、單檔 100 MB）且 repo 為公開：FB 原始照片與影片**不得進 Git**，只放精選壓縮後的相簿。
- 歷史照片與兒童肖像的使用同意原則尚未定案，會阻塞相簿上架（Phase D），不會阻塞 Phase A 驗證。

## 下一步

1. 跑 FB 素材庫 Phase A（見待辦 1），確認 Graph API 通不通。
2. `npm install` 驗證本機可 `astro build`，再開 Phase 0。

## 工作日誌

- 2026-10-27：健檢與完善計畫；發布 2508 期週報與 10-25 直播（`afe4111`）。
- 2026-10-28：ASUS clone 本 repo，改為本機正本；補 `PROGRESS.md`。
- 2026-11-06：評估 FB 歷史資料取得方式（比較 Apify 模式、盤點 GitHub 現成專案），決議改走 Meta Graph API；建立 FB 歷史素材庫計畫（三層架構、Phase A–E），掛入待辦第 1 項。本項由 `ai-agent-external-tools` 轉入。
