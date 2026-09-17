const dateFmt = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const shortFmt = new Intl.DateTimeFormat('zh-TW', {
  month: 'numeric',
  day: 'numeric',
});

const dateTimeFmt = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const timeFmt = new Intl.DateTimeFormat('zh-TW', {
  hour: 'numeric',
  minute: '2-digit',
});

/** 2026年9月6日 */
export function formatDate(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input);
  return dateFmt.format(d);
}

/** 9/6 */
export function formatDateShort(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input);
  return shortFmt.format(d);
}

/** 2026年9月6日 上午9:00（後台日期時間欄位用） */
export function formatDateTime(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input);
  return dateTimeFmt.format(d);
}

/** 上午9:00 */
export function formatTime(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input);
  return timeFmt.format(d);
}

/** 該筆資料是否有設定時間（非午夜 00:00） */
export function hasTime(input: Date | string): boolean {
  const d = input instanceof Date ? input : new Date(input);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

/**
 * 智慧顯示：有設時間才顯示時間（2026年9月6日 上午9:00），
 * 只有日期（午夜 00:00，含舊資料）則只顯示日期，避免出現「凌晨0:00」。
 */
export function formatDateTimeSmart(input: Date | string): string {
  const d = input instanceof Date ? input : new Date(input);
  return hasTime(d) ? dateTimeFmt.format(d) : dateFmt.format(d);
}

export const CATEGORY_LABEL: Record<string, string> = {
  announcement: '公告事項',
  event: '活動訊息',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] ?? category;
}
