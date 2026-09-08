import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** 最新消息 / 活動公告 */
const announcements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/announcements' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.enum(['announcement', 'event']).default('announcement'),
    description: z.string().optional(),
    image: z.string().optional(),
    pinned: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

/** 主日直播連結（含歷史存檔） */
const liveStream = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/liveStream' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    youtubeUrl: z.string().url(),
    description: z.string().optional(),
    isCurrentWeek: z.boolean().default(false),
  }),
});

/** 牧師 / 同工介紹 */
const pastors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pastors' }),
  schema: z.object({
    name: z.string(),
    title: z.string(),
    photo: z.string().optional(),
    order: z.number().default(1),
    draft: z.boolean().default(false),
  }),
});

/** 活動相簿（依日期排序） */
const galleryAlbums = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/gallery' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    cover: z.string().optional(),
    description: z.string().optional(),
    photos: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/** 信仰宣言（多段落、可排序） */
const beliefs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/beliefs' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(1),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  announcements,
  liveStream,
  pastors,
  galleryAlbums,
  beliefs,
};
