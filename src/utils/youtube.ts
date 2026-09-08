/** 將各種 YouTube 網址轉為可嵌入的 embed 網址 */
export function getVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') {
      return u.pathname.slice(1).split(/[?&#/]/)[0] || null;
    }
    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      if (u.pathname.startsWith('/embed/')) {
        return u.pathname.split('/')[2]?.split(/[?&#/]/)[0] || null;
      }
      if (u.pathname.startsWith('/live/') || u.pathname.startsWith('/shorts/')) {
        return u.pathname.split('/')[2]?.split(/[?&#/]/)[0] || null;
      }
      const v = u.searchParams.get('v');
      if (v) return v;
    }
    return null;
  } catch {
    return null;
  }
}

export function toEmbedUrl(url: string): string | null {
  const id = getVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function toWatchUrl(url: string): string {
  const id = getVideoId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : url;
}

export function toThumbnailUrl(url: string): string | null {
  const id = getVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
