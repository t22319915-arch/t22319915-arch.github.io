// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://t22319915-arch.github.io',
  integrations: [sitemap()],
  // 舊網址轉向：2026-09-12 檔名與內容日期（09-13）不符，已改名
  redirects: {
    '/media/live/2026-09-12': '/media/live/2026-09-13/',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
