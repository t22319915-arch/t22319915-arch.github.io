const dateFmt = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const shortFmt = new Intl.DateTimeFormat('zh-TW', {
  month: 'numeric',
  day: 'numeric',
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

export const CATEGORY_LABEL: Record<string, string> = {
  announcement: '公告事項',
  event: '活動訊息',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] ?? category;
}
