/**
 * Decap CMS GitHub OAuth 授權代理（Cloudflare Workers，免費方案即可）
 *
 * 用途：讓教會網站後台（/admin）可以用 GitHub 帳號登入，
 *       登入後在後台發布的內容會自動變成 GitHub 上的 commit，並觸發網站重新部署。
 *
 * 部署方式（詳見同目錄 README.md）：
 *  1. 在 Cloudflare 建立一個 Worker，把本檔案內容貼上。
 *  2. 在 Worker 的 Settings → Variables 設定兩個 Secret：
 *     - GITHUB_CLIENT_ID
 *     - GITHUB_CLIENT_SECRET
 *     （來自 GitHub → Settings → Developer settings → OAuth Apps 註冊的應用程式，
 *      Authorization callback URL 請填：https://<你的worker>.workers.dev/callback）
 *  3. 把 Worker 網址填入網站 public/admin/config.yml 的 backend.base_url。
 *
 * 協定說明（Decap CMS github backend 專用）：
 *  - GET /auth      → 302 導向 GitHub 授權頁
 *  - GET /callback  → 用 code 換 token，回傳 postMessage 給 CMS 視窗
 */

function successPage(payloadJson) {
  // Decap CMS 期待的訊息格式：authorization:<provider>:success:<json>
  // payloadJson 只包含 token 與 provider 字串，不含使用者可控的引號，可安全內嵌。
  return `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><title>授權成功</title></head>
<body>
<p style="font-family:sans-serif">授權成功，視窗即將自動關閉…</p>
<script>
(function () {
  var message = 'authorization:github:success:' + ${payloadJson};
  function send() {
    if (window.opener) window.opener.postMessage(message, '*');
  }
  send();
  var timer = setInterval(send, 500);
  setTimeout(function () { clearInterval(timer); window.close(); }, 4000);
})();
</script>
</body>
</html>`;
}

function failPage(title, detail) {
  const safe = String(detail || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  return `<!doctype html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><title>授權失敗</title></head>
<body>
<h1 style="font-family:sans-serif">${title}</h1>
<p style="font-family:sans-serif">${safe}</p>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 健康檢查
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    // Step 1：導向 GitHub 授權頁
    if (url.pathname === '/auth') {
      if (!env.GITHUB_CLIENT_ID) {
        return new Response(failPage('尚未設定', 'Worker 缺少 GITHUB_CLIENT_ID Secret。'), {
          status: 500,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      const scope = url.searchParams.get('scope') || 'repo';
      const authorize = new URL('https://github.com/login/oauth/authorize');
      authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      authorize.searchParams.set('redirect_uri', `${url.origin}/callback`);
      authorize.searchParams.set('scope', scope);
      authorize.searchParams.set('state', crypto.randomUUID());
      return Response.redirect(authorize.toString(), 302);
    }

    // Step 2：用 code 換 token，回傳給 CMS
    if (url.pathname === '/callback') {
      const error = url.searchParams.get('error');
      const errorDesc = url.searchParams.get('error_description') || '';
      const code = url.searchParams.get('code');

      if (error || !code) {
        return new Response(failPage('授權失敗', error ? `${error}：${errorDesc}` : '缺少授權碼。'), {
          status: 400,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      try {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
          }),
        });
        const data = await tokenRes.json();

        if (data.error || !data.access_token) {
          return new Response(
            failPage('授權失敗', data.error_description || data.error || '無法取得 token。'),
            { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          );
        }

        const payload = JSON.stringify({ token: data.access_token, provider: 'github' });
        return new Response(successPage(payload), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      } catch (e) {
        return new Response(failPage('授權失敗', '連線 GitHub 時發生錯誤，請稍後再試。'), {
          status: 502,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
