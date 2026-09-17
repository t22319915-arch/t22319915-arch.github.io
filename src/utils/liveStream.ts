/**
 * 本週直播自動判斷：直播上線 7 天內有效，過期自動卸下，
 * 不用再手動取消舊的「設為本週直播」勾選。
 *
 * 規則（`streams` 需先照日期倒序）：
 * 1. 有勾 `isCurrentWeek` 且日期在 7 天有效期內 → 採用（手動置頂仍有效，但一樣 7 天後失效）
 * 2. 否則找 7 天內最新的一筆 → 本週直播
 * 3. 7 天內一筆都沒有（空窗期）→ 取最新一筆當存檔頂替
 * 4. 一筆都沒有 → null（前台顯示「更新中」佔位）
 *
 * 有效期為「7 天前～明天」：往前 7 天自動卸下；
 * 往後多留 1 天寬限，讓週六先發週日直播的預備發布也能正常顯示。
 * （靜態網站只在重建時重新計算，需搭配每日排程部署才會每天生效，
 * 見 .github/workflows/deploy.yml 的 schedule。）
 */

export const CURRENT_WEEK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
/** 未來寬限：提早一天發布也算本週 */
const FUTURE_GRACE_MS = 1 * 24 * 60 * 60 * 1000;

export interface CurrentStreamResult<T> {
  stream: T | null;
  /** true＝7 天內本週直播；false＝過期後頂替的最新存檔（或無資料） */
  isCurrent: boolean;
}

export function getCurrentStream<
  T extends { data: { date: Date; isCurrentWeek?: boolean } },
>(streams: T[], now: Date = new Date()): CurrentStreamResult<T> {
  const sorted = [...streams].sort((a, b) => +b.data.date - +a.data.date);
  if (sorted.length === 0) return { stream: null, isCurrent: false };

  const nowMs = +now;
  const withinWindow = (d: Date) =>
    nowMs - +d <= CURRENT_WEEK_WINDOW_MS && +d - nowMs <= FUTURE_GRACE_MS;

  // 1. 手動勾選（7 天內才有效，過期自動失效）
  const checked = sorted.find((s) => s.data.isCurrentWeek && withinWindow(s.data.date));
  if (checked) return { stream: checked, isCurrent: true };

  // 2. 7 天內最新一筆
  const recent = sorted.find((s) => withinWindow(s.data.date));
  if (recent) return { stream: recent, isCurrent: true };

  // 3. 空窗期：最新存檔頂替
  return { stream: sorted[0], isCurrent: false };
}
