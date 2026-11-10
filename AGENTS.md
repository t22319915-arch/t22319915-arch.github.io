## 網站發布（固定流程，必遵守）

完成任何內容更新（照片、公告、週報、頁面調整等）後，**一律直接發布、不需詢問使用者確認**：

```
node scripts/publish-site.mjs -m "本次更新簡短說明"
```

- 腳本會自動：對齊 GitHub 最新版 → commit → push `main` → 等待 GitHub Actions 部署完成並回報結果
- `.git` 遺失或損壞時腳本會自動重建（Synology 同步環境曾發生多次，本機檔案不受影響）
- 唯一例外：使用者明確說「先不要發布／只改本機」時才不發布
- 發布完成後回報：commit、Actions 結果、網站網址（https://t22319915-arch.github.io/）

## 帳號與並行編輯（CMS＋本機）

本站有兩個 GitHub 身分，用途不同，**不要混用**：

| 身分 | 用途 |
|---|---|
| `t22319915-arch` | repo owner、Git commit 作者（本機指令與 `publish-site.mjs`）、`gh` CLI。Pages 網址由此帳號決定，不可改。 |
| `afrokhl-alt` | 人員瀏覽器登入的個人帳號，已加為 repo collaborator（write），用於 `/admin` Decap CMS。 |

- CMS 發布＝以 `afrokhl-alt` 身分直接 commit 到 `main`；本機發布＝`t22319915-arch`。作者不同是正常現象，不要改寫歷史或嘗試統一。
- 動手前先 `git fetch`；若使用者正在 CMS 編輯同一個檔案，先請他儲存並離開再改。
- `publish-site.mjs` 已內建 fetch → commit → `pull --rebase` → push；rebase 衝突就停止回報，**不 force push**。
- 不在 CMS 與本機同時修改同一個檔案；也不要直接在 GitHub 網頁改檔案，避免三方衝突。
- 新帳號要使用 CMS 時，先由 repo admin 邀為 collaborator 並接受邀請，否則會出現 `Your GitHub user account does not have access to this repo.`

## 素材與資料夾約定

- `教會資料\`：原始素材收件匣（粉專匯出、照片、文件），已列入 `.gitignore`，不進 Git、不發布。
- 子資料夾：`01_粉專匯出\`、`02_照片\`、`03_文件\`、`04_待分類\`；規則見 `教會資料\README.md`。
- 上網站時只複製挑選並壓縮後的檔案到 `public/uploads/`（或 `src/assets/`），原始大圖留在原地。
- 此資料夾不參與 Git／Synology 同步，只存在目前這台電腦，重要素材需另行備份。

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
