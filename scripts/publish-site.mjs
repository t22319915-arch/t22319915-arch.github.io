/**
 * 網站一鍵發布腳本（台中北屯貴格會）
 *
 * 用法：
 *   node scripts/publish-site.mjs -m "更新說明"
 *   node scripts/publish-site.mjs --message "更新說明" --no-wait
 *
 * 流程：
 *   1. 環境檢查（git；GitHub CLI 需已登入）
 *   2. 確保本資料夾是有效 Git 儲存庫；.git 遺失或損壞時自動重建（本機檔案不受影響）
 *   3. 補回同步環境容易遺漏的基礎設施（.github、.vscode、.gitignore）
 *   4. 對齊 GitHub main 最新版 → commit → push
 *   5. 等待 GitHub Actions 部署完成並回報結果
 *
 * 注意：使用者明說「先不要發布／只改本機」時請勿執行本腳本。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_SLUG = 't22319915-arch/t22319915-arch.github.io';
const REMOTE_URL = `https://github.com/${REPO_SLUG}.git`;
const BRANCH = 'main';
const SITE_URL = 'https://t22319915-arch.github.io/';
const WORKFLOW = 'deploy.yml';
const IDENTITY = { name: 't22319915-arch', email: 't22319915-arch@users.noreply.github.com' };
/** 同步環境曾遺漏 dot 開頭的資料夾；這些是 repo 基礎設施，缺少時自動補回 */
const INFRA_PATHS = ['.github', '.vscode', '.gitignore'];
const WAIT_TIMEOUT_MS = 8 * 60 * 1000;
const POLL_INTERVAL_MS = 15 * 1000;

const args = process.argv.slice(2);
const noWait = args.includes('--no-wait');
const msgIndex = Math.max(args.indexOf('-m'), args.indexOf('--message'));
const message =
  msgIndex >= 0 && args[msgIndex + 1] ? args[msgIndex + 1] : `更新網站內容（${timestamp()}）`;

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function run(cmd, cmdArgs, { allowFail = false } = {}) {
  try {
    return execFileSync(cmd, cmdArgs, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (allowFail) return null;
    const stderr = error.stderr?.toString().trim();
    console.error(`❌ 指令失敗：${cmd} ${cmdArgs.join(' ')}`);
    if (stderr) console.error(stderr);
    process.exit(1);
  }
}

/** git 一律附上 gh 憑證，fetch／push 不需互動輸入 */
function git(gitArgs, opts = {}) {
  return run('git', ['-c', 'credential.helper=', '-c', 'credential.helper=!gh auth git-credential', ...gitArgs], opts);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log(`發布目標：${REPO_SLUG}（分支 ${BRANCH}）`);

// ─── 1. 環境檢查 ───────────────────────────────────────
if (run('git', ['--version'], { allowFail: true }) === null) {
  console.error('❌ 找不到 git，請先安裝 Git。');
  process.exit(1);
}
if (run('gh', ['auth', 'status'], { allowFail: true }) === null) {
  console.error('❌ GitHub CLI 未登入，請先執行 gh auth login。');
  process.exit(1);
}

// ─── 2. 確保 Git 儲存庫有效（遺失或損壞時重建） ─────────
const gitDir = join(ROOT, '.git');
const gitHealthy =
  existsSync(gitDir) &&
  run('git', ['rev-parse', '--is-inside-work-tree'], { allowFail: true }) === 'true';
if (!gitHealthy) {
  if (existsSync(gitDir)) {
    console.log('⚠️  偵測到損壞的 .git，自動重建（本機檔案不受影響）…');
    rmSync(gitDir, { recursive: true, force: true });
  } else {
    console.log('⚠️  偵測到 .git 遺失，自動重建（本機檔案不受影響）…');
  }
  git(['init', '-b', BRANCH]);
  git(['remote', 'add', 'origin', REMOTE_URL]);
  git(['fetch', 'origin', BRANCH]);
  git(['reset', '--mixed', `origin/${BRANCH}`]);
}
git(['config', 'user.name', IDENTITY.name]);
git(['config', 'user.email', IDENTITY.email]);
git(['config', 'core.autocrlf', 'true']);
git(['remote', 'set-url', 'origin', REMOTE_URL], { allowFail: true });

// ─── 3. 補回基礎設施 ───────────────────────────────────
for (const p of INFRA_PATHS) {
  if (!existsSync(join(ROOT, p))) {
    git(['checkout', '--', p], { allowFail: true });
    console.log(`已補回 ${p}`);
  }
}

// ─── 4. 加入變更並提交 ─────────────────────────────────
git(['fetch', 'origin', BRANCH]);
git(['add', '-A']);
const hasStagedChanges = git(['diff', '--cached', '--quiet'], { allowFail: true }) === null;
if (hasStagedChanges) {
  console.log('將發布以下變更：');
  console.log(git(['diff', '--cached', '--stat']));
  git(['commit', '-m', message]);
  console.log(`✅ 已建立 commit：${git(['log', '-1', '--oneline'])}`);
} else {
  console.log('本機沒有新變更。');
}

// ─── 5. 對齊遠端後推送 ─────────────────────────────────
git(['pull', '--rebase', 'origin', BRANCH]);
const aheadCount = Number(git(['rev-list', '--count', `origin/${BRANCH}..HEAD`]) || '0');
let pushed = false;
if (aheadCount > 0) {
  if (git(['push', 'origin', BRANCH], { allowFail: true }) === null) {
    console.log('push 失敗，重新對齊後再試一次…');
    git(['pull', '--rebase', 'origin', BRANCH]);
    git(['push', 'origin', BRANCH]);
  }
  pushed = true;
  console.log(`✅ 已推送：${git(['log', '-1', '--oneline'])}`);
} else {
  console.log('GitHub 已是最新，無需推送。');
}

// ─── 6. 等待 GitHub Actions 部署 ───────────────────────
if (pushed && !noWait) {
  const sha = git(['rev-parse', 'HEAD']);
  console.log('等待 GitHub Actions 部署（約 1～2 分鐘）…');
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  let finished = null;
  while (!finished) {
    const json = run(
      'gh',
      ['run', 'list', '--repo', REPO_SLUG, '--workflow', WORKFLOW, '--limit', '20', '--json', 'databaseId,headSha,status,conclusion,url'],
      { allowFail: true },
    );
    if (json) {
      const found = JSON.parse(json).find((r) => r.headSha === sha);
      if (found && found.status === 'completed') {
        finished = found;
        break;
      }
    }
    if (Date.now() >= deadline) break;
    await sleep(POLL_INTERVAL_MS);
  }
  if (!finished) {
    console.error('⚠️  等待逾時，請自行至 Actions 頁面確認：');
    console.error(`   https://github.com/${REPO_SLUG}/actions`);
    process.exit(1);
  }
  if (finished.conclusion === 'success') {
    console.log(`✅ 部署完成！網站已更新：${SITE_URL}`);
    console.log(`   Actions：${finished.url}`);
  } else {
    console.error(`❌ 部署失敗（${finished.conclusion}）：${finished.url}`);
    process.exit(1);
  }
} else if (pushed) {
  console.log('（--no-wait）已推送，Actions 部署進行中。');
}

console.log('發布流程結束。');
