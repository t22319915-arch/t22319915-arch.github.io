# CMS 授權代理部署說明（給網站管理者）

教會網站後台（`/admin`）登入時，需要這個小小的「授權代理」幫忙跟 GitHub 溝通。
以下步驟只需做 **一次**，約 10 分鐘，全部免費。

## 準備：註冊 GitHub OAuth App（取得兩組密碼）

1. 登入 GitHub，右上角頭像 → **Settings** → 左側最下方 **Developer settings** → **OAuth Apps** → **New OAuth App**。
2. 填寫：
   - Application name：`台中北屯貴格會網站 CMS`
   - Homepage URL：`https://t22319915-arch.github.io`
   - Authorization callback URL：先填 `https:// church-cms-auth.<你的帳號>.workers.dev/callback`
     （Worker 建好後若網址不同，回來改這格即可）
3. 按 **Register application** → 記下 **Client ID**。
4. 按 **Generate a new client secret** → 記下 **Client secret**（只顯示一次，請複製保存）。

## 步驟：在 Cloudflare 建立 Worker

1. 到 <https://dash.cloudflare.com> 註冊／登入（免費）。
2. 左側選 **Workers & Pages** → **Create** → **Create Worker** → 取名（如 `church-cms-auth`）→ **Deploy**。
3. 進入該 Worker → **Edit code**，把同目錄 `worker.js` 的全部內容貼上 → **Deploy**。
4. 回到 Worker 頁面 → **Settings** → **Variables and Secrets** → **Add**：
   - `GITHUB_CLIENT_ID` = 步驟一的 Client ID
   - `GITHUB_CLIENT_SECRET` = 步驟一的 Client secret
   （Type 選 **Secret**，按 Encrypt／Save）
5. 回到 **Overview** 複製 Worker 網址（如 `https://church-cms-auth.xxx.workers.dev`），
   用瀏覽器開啟 `https://…/health`，看到 `OK` 即成功。

## 收尾：把網址填回網站設定

1. 若 Worker 網址與 OAuth App 的 callback 不同，回去把 callback 改為 `https://<你的worker>/callback`。
2. 把 Worker 網址告訴網站開發人員（或自行修改 `public/admin/config.yml` 的 `backend.base_url`），
   之後推送到 GitHub，後台登入即生效。

## 測試登入

1. 開啟 `https://t22319915-arch.github.io/admin`。
2. 按 **使用 GitHub 登入** → 授權 → 應可看到「網站基本設定」「主日直播連結」等選單。
