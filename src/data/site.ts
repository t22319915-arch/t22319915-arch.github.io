import siteJson from './site.json';

export interface ServiceTime {
  name: string;
  time: string;
  location: string;
  note: string;
}

export interface SiteData {
  churchName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  facebookUrl: string;
  youtubeChannelUrl: string;
  mapEmbedUrl: string;
  serviceTimes: ServiceTime[];
}

export const site = siteJson as SiteData;

export interface NavLink {
  href: string;
  label: string;
}

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: '首頁' },
  { href: '/about', label: '關於我們' },
  { href: '/announcements', label: '最新消息' },
  { href: '/media', label: '影音專區' },
  { href: '/contact', label: '聯絡我們' },
];
