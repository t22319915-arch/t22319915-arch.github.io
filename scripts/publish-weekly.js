/**
 * 每週主日直播＋週報一鍵備檔腳本（台中北屯貴格會）
 *
 * 用法：
 *   1. 預覽模式（只檢查＋列出將寫入的檔案，不動任何檔案）：
 *      node scripts/publish-weekly.js --pdf "D:/path/週報2507(20261018).pdf" --date 2026-10-18 --issue 2507 --youtube "https://www.youtube.com/watch?v=xxxx"
 *   2. 寫入模式（檢查通過後實際複製 PDF、產生 .md）：
 *      node scripts/publish-weekly.js --pdf ... --date ... --issue ... --youtube ... --write
 *   3. 該週無直播連結：省略 --youtube，只上週報：
 *      node scripts/publish-weekly.js --pdf ... --date 2026-10-04 --issue 2505 --write
 *
 * 參數：
 *   --pdf      來源週報 PDF 路徑（絕對或相對 --root）
 *   --date     主日日期 YYYY-MM-DD（同時是檔名與排序依據）
 *   --issue    週報期號，純數字（例：2507）
 *   --youtube  YouTube 連結（選填；省略則只處理週報）
 *   --root     網站根目錄（預設：腳本上一層，即 repo 根目錄）
 *   --force    目標檔已存在時覆寫（預設：已存在即報錯停下，避免誤蓋）
 *   --write    實際寫入（省略則為預覽模式）
 *
 * 流程：參數檢查 → 目標清單預覽（印出完整內容供覆核）→（--write）複製 PDF＋寫入 .md
 * 推送上線仍走 git：檢查 `git status` 清單無誤後 commit → push 到 main → 等 Actions 綠燈。
 */

import { copyFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, resolve, dirname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = join(__dirname, '..');

// ─── 參數解析 ──────────────────────────────────────────
function getArg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}
const WRITE_MODE = process.argv.includes('--write');
const FORCE_MODE = process.argv.includes('--force');

const ROOT = resolve(getArg('root') ?? DEFAULT_ROOT);
const pdfArg = getArg('pdf');
const dateArg = getArg('date');
const issueArg = getArg('issue');
const youtubeArg = getArg('youtube');

const errors = [];

// ─── 檢查 ──────────────────────────────────────────────
if (!pdfArg) errors.push('缺少 --pdf（來源週報 PDF 路徑）');
if (!dateArg || !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  errors.push('缺少或格式錯誤的 --date（須為 YYYY-MM-DD，例：2026-10-18）');
} else {
  const d = new Date(`${dateArg}T00:00:00Z`);
  if (Number.isNaN(+d) || d.toISOString().slice(0, 10) !== dateArg) {
    errors.push(`--date 不是合法日期：${dateArg}`);
  }
}
if (!issueArg || !/^\d+$/.test(issueArg)) {
  errors.push('缺少或格式錯誤的 --issue（須為純數字期號，例：2507）');
}

const pdfPath = pdfArg ? (isAbsolute(pdfArg) ? pdfArg : join(ROOT, pdfArg)) : '';
if (pdfArg) {
  if (!existsSync(pdfPath)) errors.push(`PDF 不存在：${pdfPath}`);
  else if (!pdfPath.toLowerCase().endsWith('.pdf')) errors.push(`不是 PDF 檔：${pdfPath}`);
  else if (!statSync(pdfPath).isFile()) errors.push(`不是檔案：${pdfPath}`);
}

/** 接受 watch?v=、youtu.be、/live/、/shorts/、/embed/ 任一形式，回傳 11 碼影片 ID */
function extractVideoId(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
  if (host === 'youtube.com' || host === 'youtu.be') {
    const v = u.searchParams.get('v');
    if (v && /^[\w-]{11}$/.test(v)) return v;
    const m = u.pathname.match(/\/(?:live|shorts|embed|v)\/([\w-]{11})/);
    if (m) return m[1];
  }
  return null;
}

let videoId = null;
if (youtubeArg) {
  videoId = extractVideoId(youtubeArg);
  if (!videoId) errors.push(`YouTube 連結無法解析出影片 ID：${youtubeArg}`);
}

if (errors.length > 0) {
  console.error('❌ 參數檢查失敗：');
  for (const e of errors) console.error(`   - ${e}`);
  console.error('\n用法：node scripts/publish-weekly.js --pdf <PDF> --date YYYY-MM-DD --issue <期號> [--youtube <URL>] [--write] [--force]');
  process.exit(1);
}

// ─── 產出內容 ──────────────────────────────────────────
const dotted = dateArg.replaceAll('-', '.'); // 2026-10-18 → 2026.10.18
const pdfName = `bulletin-${dateArg}.pdf`;
const pdfDest = join(ROOT, 'public', 'uploads', 'bulletins', pdfName);
const bulletinMdPath = join(ROOT, 'src', 'content', 'bulletins', `${dateArg}.md`);
const liveMdPath = join(ROOT, 'src', 'content', 'liveStream', `${dateArg}.md`);

const bulletinMd = `---\ntitle: ${issueArg}期 ${dotted}\ndate: ${dateArg}\npdf: /uploads/bulletins/${pdfName}\ndraft: false\n---\n\n${issueArg}期主日週報。\n`;
const liveMd = `---\ntitle: ${dotted} 主日禮拜\ndate: ${dateArg} 09:00\nyoutubeUrl: ${youtubeArg}\nisCurrentWeek: true\n---\n\n本週主日禮拜直播，歡迎線上一起敬拜。\n`;

const targets = [
  { kind: 'PDF 複製', from: pdfPath, to: pdfDest },
  { kind: '週報 .md', to: bulletinMdPath, content: bulletinMd },
];
if (youtubeArg) targets.push({ kind: '直播 .md', to: liveMdPath, content: liveMd });

// 覆寫保護
const existed = targets.filter((t) => existsSync(t.to)).map((t) => t.to);
if (existed.length > 0 && !FORCE_MODE) {
  console.error('❌ 以下目標檔已存在（避免誤蓋，已停止；確認要覆寫請加 --force）：');
  for (const f of existed) console.error(`   - ${f}`);
  process.exit(1);
}

// ─── 預覽（預設；--write 才執行） ───────────────────────
console.log(`模式：${WRITE_MODE ? '寫入' : '預覽（未寫入任何檔案）'}`);
console.log(`來源 PDF：${pdfPath}`);
if (youtubeArg) console.log(`YouTube：${youtubeArg}（影片 ID：${videoId}）`);
else console.log('YouTube：未提供 → 只處理週報');
console.log('');
for (const t of targets) {
  console.log(`── [${t.kind}] ${t.to}${existsSync(t.to) ? '（將覆寫 --force）' : ''}`);
  if (t.content) console.log(t.content);
  else console.log(`   ← 複製自 ${t.from}`);
}

if (!WRITE_MODE) {
  console.log('✅ 檢查通過。內容無誤請加 --write 再跑一次以實際寫入。');
  process.exit(0);
}

// ─── 寫入 ──────────────────────────────────────────────
mkdirSync(dirname(pdfDest), { recursive: true });
mkdirSync(dirname(bulletinMdPath), { recursive: true });
copyFileSync(pdfPath, pdfDest);
writeFileSync(bulletinMdPath, bulletinMd, 'utf8');
if (youtubeArg) {
  mkdirSync(dirname(liveMdPath), { recursive: true });
  writeFileSync(liveMdPath, liveMd, 'utf8');
}
console.log('✅ 已寫入以下檔案，請用 git status 複核後再 commit＋push：');
for (const t of targets) console.log(`   - ${t.to}`);
