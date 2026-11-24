/**
 * 發布前內容檢查（只警告，不阻擋）
 *
 * 用法：
 *   node scripts/preflight-check.mjs          只警告，exit 0
 *   node scripts/preflight-check.mjs --strict 有問題 exit 1
 *
 * 檢查項目：
 *   1. liveStream／bulletins 的檔名與 frontmatter `date` 是否同一天
 *   2. 週報 `pdf` 指到的檔案是否真的存在於 public/
 *   3. 直播 YouTube 連結是否重複
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STRICT = process.argv.includes('--strict');
const issues = [];

/** 讀取 frontmatter 的簡單 key: value（只取第一層，足夠本專案使用） */
function readFrontmatter(file) {
  const text = readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    data[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
  return data;
}

const dayOf = (value) => (value || '').slice(0, 10);

function list(folder) {
  const dir = join(ROOT, folder);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({ name, stem: name.replace(/\.md$/, ''), data: readFrontmatter(join(dir, name)) }));
}

// ── 直播：檔名 vs 日期、重複影片 ─────────────────────────
const streams = list('src/content/liveStream');
const seenVideoIds = new Map();
for (const { name, stem, data } of streams) {
  if (dayOf(data.date) !== stem) {
    issues.push(`[直播] ${name}：檔名 ${stem} 與日期 ${data.date || '（缺）'} 不一致`);
  }
  const videoId = (data.youtubeUrl || '').match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1];
  if (!videoId) {
    issues.push(`[直播] ${name}：youtubeUrl 抓不到影片 ID（${data.youtubeUrl || '（缺）'}）`);
    continue;
  }
  if (seenVideoIds.has(videoId)) {
    issues.push(`[直播] ${name}：影片 ${videoId} 與 ${seenVideoIds.get(videoId)} 重複`);
  } else {
    seenVideoIds.set(videoId, name);
  }
}

// ── 週報：檔名 vs 日期、PDF 是否存在 ─────────────────────
const bulletins = list('src/content/bulletins');
for (const { name, stem, data } of bulletins) {
  const draft = data.draft === 'true';
  if (dayOf(data.date) !== stem) {
    issues.push(`[週報] ${name}：檔名 ${stem} 與日期 ${data.date || '（缺）'} 不一致${draft ? '（draft）' : ''}`);
  }
  const pdf = data.pdf || '';
  if (!pdf) {
    issues.push(`[週報] ${name}：缺少 pdf 欄位${draft ? '（draft）' : ''}`);
  } else if (!existsSync(join(ROOT, 'public', pdf.replace(/^\//, '')))) {
    issues.push(`[週報] ${name}：PDF 不存在 public${pdf}${draft ? '（draft）' : ''}`);
  }
}

console.log(`[preflight] 掃描直播 ${streams.length} 筆、週報 ${bulletins.length} 筆`);
if (issues.length === 0) {
  console.log('[preflight] 通過：沒有日期或路徑問題');
} else {
  for (const issue of issues) console.log(`[preflight] ⚠️  ${issue}`);
  console.log(`[preflight] 共 ${issues.length} 項，請在發布前確認`);
}
process.exit(STRICT && issues.length > 0 ? 1 : 0);
