/**
 * YouTube 主日直播批次匯入腳本（台中北屯貴格會）
 *
 * 用法：
 *   1. 設定環境變數 YOUTUBE_API_KEY（YouTube Data API v3 金鑰）
 *      PowerShell: $env:YOUTUBE_API_KEY = "AIzaSy..."
 *   2. 預覽模式（只產出 CSV，不寫入 .md）：
 *      node scripts/fetch-youtube-streams.js
 *   3. 寫入模式（使用者確認 CSV 無誤後）：
 *      node scripts/fetch-youtube-streams.js --write
 *
 * 流程：
 *   handle(@北屯貴格會直播) → channelId → 上傳播放清單 → 全部分頁抓取
 *   → 批次取影片詳情 → 篩選（日期≥2021-08-01、標題含關鍵字、排除私人）
 *   → 輸出 CSV 預覽 → （--write）寫入 src/content/liveStream/YYYY-MM-DD.md
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'src', 'content', 'liveStream');
const CSV_PATH = join(ROOT, 'streams-preview.csv');

// ─── 設定 ──────────────────────────────────────────────
const CHANNEL_HANDLE = '北屯貴格會直播'; // 不含 @
const SINCE_DATE = '2021-08-01';
const KEYWORDS = ['主日禮拜', '主日崇拜', 'Sunday Service', '主日'];
const WRITE_MODE = process.argv.includes('--write');

const API_KEY = process.env.YOUTUBE_API_KEY;
if (!API_KEY) {
  console.error('❌ 缺少環境變數 YOUTUBE_API_KEY');
  console.error('   PowerShell: $env:YOUTUBE_API_KEY = "AIzaSy..."');
  process.exit(1);
}

// ─── YouTube Data API v3 呼叫 ──────────────────────────
async function yt(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  url.searchParams.set('key', API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) {
    throw new Error(`YouTube API 錯誤 [${endpoint}]: ${data.error.message} (code ${data.error.code})`);
  }
  return data;
}

/** handle → channelId（優先 forHandle，失敗則 fallback 搜尋） */
async function resolveChannelId(handle) {
  try {
    const data = await yt('channels', { part: 'id', forHandle: handle });
    if (data.items?.length > 0) return data.items[0].id;
  } catch (e) {
    console.warn(`  forHandle 失敗，改用搜尋：${e.message}`);
  }
  const data = await yt('search', {
    part: 'snippet',
    q: handle,
    type: 'channel',
    maxResults: '5',
  });
  const hit = data.items?.find((i) => i.snippet.title.includes(handle.replace(/^@/, '')))
    ?? data.items?.[0];
  if (!hit) throw new Error(`找不到頻道：${handle}`);
  return hit.snippet.channelId;
}

/** channelId → 上傳播放清單 ID（UU 開頭） */
async function getUploadsPlaylistId(channelId) {
  const data = await yt('channels', { part: 'contentDetails', id: channelId });
  return data.items[0].contentDetails.relatedPlaylists.uploads;
}

/** 分頁抓取播放清單內所有 videoId */
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

/** 批次（50 支/次）取影片詳情 */
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

// ─── 篩選與正規化 ──────────────────────────────────────
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
  const title = `${yyyy}.${mm}.${dd} 主日禮拜`;
  // 描述：嘗試從原始描述擷取講員/經文（前 120 字），否則留空由後台補
  const rawDesc = (s.description ?? '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 3).join('｜').slice(0, 120);
  return {
    date: dateStr,
    title,
    videoId: video.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
    description: rawDesc,
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
  const lines = [header.join(',')];
  for (const r of rows) lines.push(header.map((h) => esc(r[h])).join(','));
  return '\uFEFF' + lines.join('\n'); // BOM，Excel 開啟不亂碼
}

// ─── 主流程 ────────────────────────────────────────────
async function main() {
  console.log(`模式：${WRITE_MODE ? '✍️ 寫入 .md' : '👁️ 預覽 CSV'}`);
  console.log(`頻道：@${CHANNEL_HANDLE}｜篩選：日期≥${SINCE_DATE}、標題含 ${KEYWORDS.join('/')}`);

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

  // 同一天多支 → 檔名加流水號
  const nameCount = {};
  for (const r of kept) {
    nameCount[r.date] = (nameCount[r.date] ?? 0) + 1;
    r.fileName = nameCount[r.date] === 1 ? `${r.date}.md` : `${r.date}-${nameCount[r.date]}.md`;
  }

  writeFileSync(CSV_PATH, toCsv(kept), 'utf-8');
  console.log(`\n✅ CSV 已輸出：${CSV_PATH}（${kept.length} 列，請抽查 10 筆）`);

  if (WRITE_MODE) {
    if (!existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });
    for (const r of kept) {
      writeFileSync(join(CONTENT_DIR, r.fileName), toMarkdown(r), 'utf-8');
    }
    console.log(`✅ 已寫入 ${kept.length} 個 .md 到 src/content/liveStream/`);
  } else {
    console.log('ℹ️ 預覽模式：未寫入 .md。確認 CSV 無誤後執行：node scripts/fetch-youtube-streams.js --write');
  }
}

main().catch((e) => {
  console.error(`\n❌ 執行失敗：${e.message}`);
  process.exit(1);
});
