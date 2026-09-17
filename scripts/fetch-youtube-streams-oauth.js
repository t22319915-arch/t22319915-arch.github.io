/**
 * YouTube 主日直播批次匯入腳本 — OAuth 版（可列出自己的不公開影片）
 *
 * 前置：Google Cloud Console → 憑證 → OAuth 用戶端 ID（電腦版應用程式）
 *
 * 用法（分兩段，因為中間要開瀏覽器授權）：
 *   1. 產出授權網址：
 *      node scripts/fetch-youtube-streams-oauth.js auth
 *   2. 開瀏覽器授權後，腳本自動收到 code，換 token 並抓取全部影片 → 輸出 CSV
 *   3. 確認 CSV 無誤後寫入 .md：
 *      node scripts/fetch-youtube-streams-oauth.js --write
 *
 * 憑證來源（優先順序）：環境變數 YT_CLIENT_ID / YT_CLIENT_SECRET
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src', 'content', 'liveStream');
const CSV_PATH = join(ROOT, 'streams-preview.csv');
const TOKEN_PATH = join(ROOT, '.yt-token.json'); // ⚠️ 本機暫存，勿提交（已在 .gitignore 應加入）

const CHANNEL_HANDLE = '北屯貴格會直播';
const SINCE_DATE = '2021-08-01';
const KEYWORDS = ['主日禮拜', '主日崇拜', 'Sunday Service', '主日'];
const WRITE_MODE = process.argv.includes('--write');
const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

const CLIENT_ID = process.env.YT_CLIENT_ID;
const CLIENT_SECRET = process.env.YT_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ 缺少環境變數 YT_CLIENT_ID / YT_CLIENT_SECRET');
  process.exit(1);
}

// ─── OAuth ─────────────────────────────────────────────
async function doAuth() {
  const server = await new Promise((resolve) => {
    const s = http.createServer(() => {});
    s.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = server.address().port;
  const redirectUri = `http://127.0.0.1:${port}/callback`;

  // 換成真正的 callback server
  await new Promise((r) => server.close(r));
  const codePromise = new Promise((resolve) => {
    const s2 = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      const code = url.searchParams.get('code');
      const err = url.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(err ? `<h1>授權失敗：${err}</h1>` : '<h1>✅ 授權成功！可以關閉此視窗，回到終端機繼續。</h1>');
      s2.close();
      resolve(code);
    });
    s2.listen(port, '127.0.0.1');
  });

  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

  console.log('\n🔑 請在瀏覽器開啟以下網址並授權：\n');
  console.log(authUrl);
  console.log('\n⏳ 等待授權中（5 分鐘內有效）…\n');

  const code = await Promise.race([
    codePromise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('授權逾時，請重跑')), 5 * 60 * 1000)),
  ]);
  if (!code) throw new Error('未收到授權碼');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokens = await tokenRes.json();
  if (tokens.error) throw new Error(`換 token 失敗：${tokens.error_description ?? tokens.error}`);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log('✅ 已取得存取權杖（暫存本機 .yt-token.json，勿提交）');
  return tokens.access_token;
}

async function getAccessToken() {
  if (existsSync(TOKEN_PATH)) {
    try {
      const saved = JSON.parse(readFileSync(TOKEN_PATH, 'utf-8'));
      if (saved.access_token) {
        console.log('ℹ️ 使用本機暫存權杖');
        return saved.access_token;
      }
    } catch { /* 重新授權 */ }
  }
  return doAuth();
}

// ─── YouTube Data API（OAuth 身份，可見自己的不公開影片） ──
let ACCESS_TOKEN = '';
async function yt(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } });
  const data = await res.json();
  if (data.error) {
    throw new Error(`YouTube API 錯誤 [${endpoint}]: ${data.error.message} (code ${data.error.code})`);
  }
  return data;
}

async function resolveChannelId(handle) {
  const data = await yt('channels', { part: 'id', forHandle: handle, mine: 'true' }).catch(() =>
    yt('channels', { part: 'id', forHandle: handle }),
  );
  if (data.items?.length > 0) return data.items[0].id;
  const s = await yt('search', { part: 'snippet', q: handle, type: 'channel', maxResults: '5' });
  if (!s.items?.length) throw new Error(`找不到頻道：${handle}`);
  return s.items[0].snippet.channelId;
}

async function getUploadsPlaylistId(channelId) {
  const data = await yt('channels', { part: 'contentDetails', id: channelId });
  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

async function getAllVideoIds(playlistId) {
  const ids = [];
  let pageToken = undefined;
  let page = 0;
  do {
    page++;
    const params = { part: 'contentDetails', playlistId, maxResults: '50' };
    if (pageToken) params.pageToken = pageToken;
    const data = await yt('playlistItems', params);
    for (const item of data.items ?? []) {
      if (item.contentDetails?.videoId) ids.push(item.contentDetails.videoId);
    }
    pageToken = data.nextPageToken;
    console.log(`  第 ${page} 頁：累計 ${ids.length} 支`);
  } while (pageToken);
  return ids;
}

async function getVideoDetails(videoIds) {
  const details = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await yt('videos', {
      part: 'snippet,status,contentDetails,statistics',
      id: batch.join(','),
    });
    details.push(...(data.items ?? []));
    console.log(`  詳情進度：${details.length}/${videoIds.length}`);
  }
  return details;
}

// ─── 篩選與輸出（與 API Key 版相同） ─────────────────────
function matchesKeyword(title) {
  return KEYWORDS.some((kw) => title.includes(kw));
}

function toRecord(video) {
  const s = video.snippet;
  const published = new Date(s.publishedAt);
  const yyyy = published.getFullYear();
  const mm = String(published.getMonth() + 1).padStart(2, '0');
  const dd = String(published.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  return {
    date: dateStr,
    title: `${yyyy}.${mm}.${dd} 主日禮拜`,
    videoId: video.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
    description: (s.description ?? '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 3).join('｜').slice(0, 120),
    privacy: video.status.privacyStatus,
    publishedAt: s.publishedAt,
    originalTitle: s.title,
  };
}

function toMarkdown(rec) {
  return `---\ntitle: ${rec.title}\ndate: ${rec.date}\nyoutubeUrl: ${rec.youtubeUrl}\ndescription: ${rec.description ? JSON.stringify(rec.description) : "''"}\nisCurrentWeek: false\n---\n\n${rec.date.replace(/-/g, ' 年 ').replace(' ', ' 月 ').replace(' ', ' 日')}主日禮拜直播存檔。\n`;
}

function toCsv(rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const header = ['date', 'title', 'videoId', 'youtubeUrl', 'description', 'privacy', 'originalTitle'];
  return '\uFEFF' + [header.join(','), ...rows.map((r) => header.map((h) => esc(r[h])).join(','))].join('\n');
}

async function main() {
  console.log(`模式：${WRITE_MODE ? '✍️ 寫入 .md' : '👁️ 預覽 CSV'}`);
  ACCESS_TOKEN = await getAccessToken();

  console.log('\n[1/5] 解析頻道 ID…');
  const channelId = await resolveChannelId(CHANNEL_HANDLE);
  console.log(`  channelId = ${channelId}`);

  console.log('\n[2/5] 取得上傳播放清單…');
  const playlistId = await getUploadsPlaylistId(channelId);
  console.log(`  playlistId = ${playlistId}`);

  console.log('\n[3/5] 抓取全部影片 ID…');
  const ids = await getAllVideoIds(playlistId);
  console.log(`  共 ${ids.length} 支`);

  console.log('\n[4/5] 批次取得影片詳情…');
  const details = await getVideoDetails(ids);

  console.log('\n[5/5] 篩選主日禮拜…');
  const since = new Date(SINCE_DATE);
  const kept = [];
  const skipped = { private: 0, tooOld: 0, noKeyword: 0 };
  for (const v of details) {
    if (v.status.privacyStatus === 'private') { skipped.private++; continue; }
    if (new Date(v.snippet.publishedAt) < since) { skipped.tooOld++; continue; }
    if (!matchesKeyword(v.snippet.title)) { skipped.noKeyword++; continue; }
    kept.push(toRecord(v));
  }
  kept.sort((a, b) => (a.date < b.date ? -1 : 1));
  console.log(`  保留 ${kept.length} 支｜排除：私人 ${skipped.private}、過早 ${skipped.tooOld}、非主日 ${skipped.noKeyword}`);

  const nameCount = {};
  for (const r of kept) {
    nameCount[r.date] = (nameCount[r.date] ?? 0) + 1;
    r.fileName = nameCount[r.date] === 1 ? `${r.date}.md` : `${r.date}-${nameCount[r.date]}.md`;
  }

  writeFileSync(CSV_PATH, toCsv(kept), 'utf-8');
  console.log(`\n✅ CSV 已輸出：${CSV_PATH}（${kept.length} 列，請抽查 10 筆）`);

  if (WRITE_MODE) {
    if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });
    for (const r of kept) writeFileSync(join(CONTENT_DIR, r.fileName), toMarkdown(r), 'utf-8');
    console.log(`✅ 已寫入 ${kept.length} 個 .md 到 src/content/liveStream/`);
  } else {
    console.log('ℹ️ 預覽模式：未寫入 .md。確認 CSV 無誤後執行：node scripts/fetch-youtube-streams-oauth.js --write');
  }
}

main().catch((e) => {
  console.error(`\n❌ 執行失敗：${e.message}`);
  process.exit(1);
});
