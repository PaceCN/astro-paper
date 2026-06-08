import { and, asc, desc, eq, like, ne, sql } from 'drizzle-orm';
import { adPositions, adSlots, comments, posts, siteSettings } from '../db/schema';
import type { getDb } from './db';

export const defaultSettings = {
  comments_enabled: 'true',
  site_title: '',
  site_desc: '',
  site_intro: '',
  site_author: '',
  site_profile: '',
  site_avatar: '',
  sidebar_profile: 'true',
  sidebar_tags: 'true',
  sidebar_categories: 'true',
  sidebar_stack: 'true',
  tags_enabled: 'true',
  tech_stack: 'Astro,Tailwind,Cloudflare,D1,Hono,Drizzle',
  ai_can_create_post: 'true',
  ai_can_publish_post: 'false',
  ai_can_set_featured: 'false',
  ai_can_set_category: 'true',
  ai_can_set_tags: 'true',
  ai_default_status: 'hidden'
};

type Db = ReturnType<typeof getDb>;
type PublicPostOptions = {
  page?: number;
  pageSize?: number;
  tag?: string;
  category?: string;
  includeContent?: boolean;
};

export function normalizePage(value: string | number | null | undefined) {
  const page = Number(value ?? 1);
  return Number.isFinite(page) ? Math.max(Math.trunc(page), 1) : 1;
}

export function normalizePageSize(value: string | number | null | undefined, max = 50) {
  const pageSize = Number(value ?? 10);
  return Number.isFinite(pageSize) ? Math.min(Math.max(Math.trunc(pageSize), 1), max) : 10;
}

export function settingEnabled(settings: Record<string, string>, key: keyof typeof defaultSettings) {
  return settings[key] !== 'false';
}

export function publicSettings(settings: Record<string, string>) {
  return {
    commentsEnabled: settingEnabled(settings, 'comments_enabled'),
    tagsEnabled: settingEnabled(settings, 'tags_enabled'),
    site: {
      title: settings.site_title,
      desc: settings.site_desc,
      intro: settings.site_intro,
      author: settings.site_author,
      profile: settings.site_profile,
      avatar: settings.site_avatar,
    },
    sidebar: {
      profile: settingEnabled(settings, 'sidebar_profile'),
      tags: settingEnabled(settings, 'sidebar_tags'),
      categories: settingEnabled(settings, 'sidebar_categories'),
      stack: settingEnabled(settings, 'sidebar_stack'),
    },
    techStack: settings.tech_stack.split(/[，,\n]/).map(item => item.trim()).filter(Boolean)
  };
}

export async function getSettings(db: Db) {
  const rows = await db.query.siteSettings.findMany();
  return { ...defaultSettings, ...Object.fromEntries(rows.map(row => [row.key, row.value])) };
}

export async function getPublicSettings(db: Db) {
  const settings = await getSettings(db);
  return { settings: publicSettings(settings), raw: settings };
}

export async function getPublicPosts(db: Db, options: PublicPostOptions = {}) {
  const page = normalizePage(options.page);
  const pageSize = normalizePageSize(options.pageSize, 1000);
  const tag = options.tag?.trim();
  const category = options.category?.trim();
  const filters = [eq(posts.status, 'published'), tag ? like(posts.tags, `%${tag}%`) : undefined, category ? eq(posts.category, category) : undefined].filter(Boolean);
  const where = and(...filters);
  const columns = options.includeContent
    ? undefined
    : {
        id: true,
        title: true,
        slug: true,
        description: true,
        tags: true,
        category: true,
        featured: true,
        status: true,
        createdAt: true,
        updatedAt: true
      };

  const data = await db.query.posts.findMany({
    where,
    columns,
    orderBy: (table, { desc }) => desc(table.createdAt),
    limit: pageSize,
    offset: (page - 1) * pageSize
  });

  return { posts: data, page, pageSize };
}

export async function getAllPosts(db: Db, options: { page?: number; pageSize?: number; status?: string } = {}) {
  const page = normalizePage(options.page);
  const pageSize = normalizePageSize(options.pageSize, 50);
  const status = options.status === 'published' || options.status === 'hidden' ? options.status : undefined;
  const data = await db.query.posts.findMany({
    where: status ? eq(posts.status, status) : undefined,
    orderBy: (table, { desc }) => desc(table.createdAt),
    limit: pageSize,
    offset: (page - 1) * pageSize
  });
  return { posts: data, page, pageSize };
}

export async function getPublicPostBySlug(db: Db, slug: string) {
  const post = await db.query.posts.findFirst({ where: eq(posts.slug, slug) });
  return post?.status === 'published' ? post : undefined;
}

export async function getPublishedCommentsBySlug(db: Db, slug: string) {
  const post = await getPublicPostBySlug(db, slug);
  if (!post) return undefined;
  const data = await db.query.comments.findMany({
    where: and(eq(comments.postId, post.id), eq(comments.status, 'published')),
    orderBy: (table, { asc }) => asc(table.createdAt),
    limit: 100
  });
  return data.map(comment => ({ id: comment.id, author: comment.author, content: comment.content, createdAt: comment.createdAt }));
}

export async function getPublicMeta(db: Db) {
  const settings = await getSettings(db);
  const publishedPosts = await db.query.posts.findMany({
    where: eq(posts.status, 'published'),
    columns: { tags: true, category: true },
    orderBy: (table, { desc }) => desc(table.createdAt),
    limit: 1000
  });
  const tagCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  for (const post of publishedPosts) {
    const category = post.category || '随笔';
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    for (const tag of post.tags.split(',').map(item => item.trim()).filter(Boolean)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  return {
    totalPosts: publishedPosts.length,
    tags: [...tagCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    categories: [...categoryCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    settings: publicSettings(settings)
  };
}

export async function getRelatedPosts(db: Db, slug: string) {
  const post = await getPublicPostBySlug(db, slug);
  if (!post) return undefined;
  const firstTag = post.tags.split(',').map(item => item.trim()).filter(Boolean)[0];
  const related = await db.query.posts.findMany({
    where: and(eq(posts.status, 'published'), ne(posts.slug, post.slug), firstTag ? like(posts.tags, `%${firstTag}%`) : eq(posts.category, post.category)),
    orderBy: [desc(posts.featured), desc(posts.createdAt)],
    limit: 3
  });
  const fallback = related.length >= 3 ? [] : await db.query.posts.findMany({
    where: and(eq(posts.status, 'published'), ne(posts.slug, post.slug)),
    orderBy: (table, { desc }) => desc(table.createdAt),
    limit: 3 - related.length
  });
  const seen = new Set<string>();
  return [...related, ...fallback].filter(item => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  }).slice(0, 3);
}

export async function getAdSlots(db: Db) {
  const data = await db.query.adSlots.findMany({ orderBy: (table) => sql`instr('header_bottom,content_top,content_bottom,footer_top', ${table.position})` });
  const byPosition = new Map(data.map((slot) => [slot.position, slot]));
  return adPositions.map((position) => {
    const slot = byPosition.get(position);
    const adCode = slot?.adCode ?? '';
    const isEnabled = Boolean(slot?.isEnabled);
    return {
      id: slot?.id ?? 0,
      position,
      adCode,
      ad_code: adCode,
      isEnabled,
      is_enabled: isEnabled
    };
  });
}
