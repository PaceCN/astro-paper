import { env } from 'cloudflare:workers';
import { and, desc, eq, like, ne, sql } from 'drizzle-orm';
import { Hono, type Context } from 'hono';
import type { APIContext } from 'astro';
import { adPositions, adSlots, comments, posts, siteVisits, type AdPosition } from '../../db/schema';
import { clearSessionCookie, createSession, getSessionCookie, sessionCookie, verifySession } from '../../lib/auth';
import { getDb } from '../../lib/db';
import { fail, ok } from '../../lib/response';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_PASSWORD: string;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

function isAdPosition(value: string): value is AdPosition {
  return adPositions.includes(value as AdPosition);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeList(value: unknown) {
  return String(value ?? '')
    .split(/[，,]/)
    .map(item => item.trim())
    .filter(Boolean)
    .join(',');
}

function plainText(value: string) {
  return value.replace(/[#>*_\[\]`-]/g, '').replace(/\s+/g, ' ').trim();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function lastDays(count: number) {
  const days: string[] = [];
  const now = new Date();
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - index);
    days.push(date.toISOString().slice(0, 10));
  }
  return days;
}

async function readJson(c: Context<{ Bindings: Bindings }>) {
  try {
    return await c.req.json<Record<string, unknown>>();
  } catch {
    return null;
  }
}

app.use('*', async (c, next) => {
  const isPublic =
    (c.req.method === 'POST' && c.req.path === '/api/auth/login') ||
    (c.req.method === 'GET' && c.req.path === '/api/ads') ||
    (c.req.method === 'GET' && c.req.path === '/api/meta') ||
    (c.req.method === 'POST' && c.req.path === '/api/visits') ||
    (c.req.method === 'GET' && c.req.path.startsWith('/api/related/')) ||
    (c.req.method === 'GET' && c.req.path === '/api/posts' && c.req.query('status') === 'published') ||
    (c.req.method === 'GET' && c.req.path.startsWith('/api/posts/')) ||
    (c.req.method === 'POST' && c.req.path.match(/^\/api\/posts\/[^/]+\/comments$/));

  if (isPublic) return next();

  const username = await verifySession(getSessionCookie(c.req.header('Cookie')), c.env.JWT_SECRET);
  if (!username) return fail(c, '未登录或会话已过期', 401);
  return next();
});

app.post('/auth/login', async (c) => {
  const body = await readJson(c);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!password) return fail(c, '请输入后台密码', 400);
  if (!c.env.ADMIN_PASSWORD || password !== c.env.ADMIN_PASSWORD) return fail(c, '后台密码错误', 401);

  const token = await createSession('admin', c.env.JWT_SECRET);
  c.header('Set-Cookie', sessionCookie(token));
  return ok(c, '登录成功');
});

app.post('/auth/logout', (c) => {
  c.header('Set-Cookie', clearSessionCookie());
  return ok(c, '已退出登录');
});

app.get('/posts', async (c) => {
  const db = getDb(c.env.DB);
  const status = c.req.query('status');
  const tag = c.req.query('tag')?.trim();
  const category = c.req.query('category')?.trim();
  const page = Math.max(Number(c.req.query('page') ?? '1'), 1);
  const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? '10'), 1), 50);
  const filters = [status === 'published' || status === 'hidden' ? eq(posts.status, status) : undefined, tag ? like(posts.tags, `%${tag}%`) : undefined, category ? eq(posts.category, category) : undefined].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;
  const data = await db.query.posts.findMany({
    where,
    orderBy: (table, { desc }) => desc(table.createdAt),
    limit: pageSize,
    offset: (page - 1) * pageSize
  });
  return ok(c, '获取文章列表成功', { posts: data, page, pageSize });
});

app.get('/posts/:slug', async (c) => {
  const db = getDb(c.env.DB);
  const post = await db.query.posts.findFirst({ where: eq(posts.slug, c.req.param('slug')) });
  if (!post || post.status !== 'published') return fail(c, '文章不存在', 404);
  return ok(c, '获取文章成功', { post });
});

app.get('/posts/:slug/comments', async (c) => {
  const db = getDb(c.env.DB);
  const post = await db.query.posts.findFirst({ where: eq(posts.slug, c.req.param('slug')) });
  if (!post || post.status !== 'published') return fail(c, '文章不存在', 404);
  const data = await db.query.comments.findMany({
    where: and(eq(comments.postId, post.id), eq(comments.status, 'published')),
    orderBy: (table, { asc }) => asc(table.createdAt),
    limit: 100
  });
  return ok(c, '获取评论成功', { comments: data.map(comment => ({ id: comment.id, author: comment.author, content: comment.content, createdAt: comment.createdAt })) });
});

app.post('/posts/:slug/comments', async (c) => {
  const body = await readJson(c);
  const author = String(body?.author ?? '').trim().slice(0, 40);
  const email = String(body?.email ?? '').trim().slice(0, 120);
  const content = String(body?.content ?? '').trim().slice(0, 1000);
  if (!author || !content) return fail(c, '昵称和评论内容不能为空', 400);
  const db = getDb(c.env.DB);
  const post = await db.query.posts.findFirst({ where: eq(posts.slug, c.req.param('slug')) });
  if (!post || post.status !== 'published') return fail(c, '文章不存在', 404);
  const inserted = await db.insert(comments).values({ postId: post.id, author, email, content, status: 'published' }).returning();
  const comment = inserted[0];
  return ok(c, '评论发布成功', { comment: { id: comment.id, author: comment.author, content: comment.content, createdAt: comment.createdAt } }, 201);
});

app.post('/posts', async (c) => {
  const body = await readJson(c);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.content === 'string' ? body.content : '';
  const requestedSlug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  const status = body?.status === 'published' ? 'published' : 'hidden';
  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 220) : plainText(content).slice(0, 160);
  const tags = normalizeList(body?.tags);
  const category = String(body?.category ?? '随笔').trim().slice(0, 40) || '随笔';
  const featured = Boolean(body?.featured);
  const slug = slugify(requestedSlug || title);
  if (!title || !slug || !content) return fail(c, '标题、slug 和内容不能为空', 400);

  const db = getDb(c.env.DB);
  const inserted = await db.insert(posts).values({ title, slug, content, description, tags, category, featured, status }).returning();
  return ok(c, '文章创建成功', inserted[0], 201);
});

app.put('/posts/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await readJson(c);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.content === 'string' ? body.content : '';
  const requestedSlug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  if (!Number.isInteger(id) || id < 1) return fail(c, '文章 ID 无效', 400);
  if (!title || !content) return fail(c, '标题和内容不能为空', 400);

  const values = {
    title,
    content,
    description: typeof body?.description === 'string' ? body.description.trim().slice(0, 220) : plainText(content).slice(0, 160),
    tags: normalizeList(body?.tags),
    category: String(body?.category ?? '随笔').trim().slice(0, 40) || '随笔',
    featured: Boolean(body?.featured),
    ...(requestedSlug ? { slug: slugify(requestedSlug) } : {}),
    updatedAt: new Date()
  };
  const db = getDb(c.env.DB);
  const updated = await db.update(posts).set(values).where(eq(posts.id, id)).returning();
  if (!updated.length) return fail(c, '文章不存在', 404);
  return ok(c, '文章更新成功', updated[0]);
});

app.patch('/posts/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await readJson(c);
  const status = body?.status;
  if (!Number.isInteger(id) || id < 1) return fail(c, '文章 ID 无效', 400);
  if (status !== 'published' && status !== 'hidden') return fail(c, '状态只能是 published 或 hidden', 400);

  const db = getDb(c.env.DB);
  const updated = await db.update(posts).set({ status, updatedAt: new Date() }).where(eq(posts.id, id)).returning();
  if (!updated.length) return fail(c, '文章不存在', 404);
  return ok(c, '文章状态更新成功', updated[0]);
});

app.delete('/posts/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id < 1) return fail(c, '文章 ID 无效', 400);

  const db = getDb(c.env.DB);
  const deleted = await db.delete(posts).where(eq(posts.id, id)).returning();
  if (!deleted.length) return fail(c, '文章不存在', 404);
  return ok(c, '文章删除成功', deleted[0]);
});

app.get('/meta', async (c) => {
  const db = getDb(c.env.DB);
  const publishedPosts = await db.query.posts.findMany({ where: eq(posts.status, 'published'), orderBy: (table, { desc }) => desc(table.createdAt), limit: 50 });
  const tagCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  for (const post of publishedPosts) {
    const category = post.category || '随笔';
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    for (const tag of post.tags.split(',').map(item => item.trim()).filter(Boolean)) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const days = lastDays(14);
  const rows = await db.query.siteVisits.findMany({ where: eq(siteVisits.path, '/'), orderBy: (table, { asc }) => asc(table.date), limit: 30 });
  const visitByDay = new Map(rows.map(row => [row.date, row.count]));
  return ok(c, '获取站点统计成功', {
    totalPosts: publishedPosts.length,
    tags: [...tagCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    categories: [...categoryCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    visits: days.map(date => ({ date, count: visitByDay.get(date) ?? 0 }))
  });
});

app.post('/visits', async (c) => {
  const body = await readJson(c);
  const path = String(body?.path ?? '/').trim().slice(0, 160) || '/';
  const db = getDb(c.env.DB);
  const date = todayKey();
  const existing = await db.query.siteVisits.findFirst({ where: and(eq(siteVisits.date, date), eq(siteVisits.path, path)) });
  if (existing) {
    await db.update(siteVisits).set({ count: existing.count + 1 }).where(eq(siteVisits.id, existing.id));
  } else {
    await db.insert(siteVisits).values({ date, path, count: 1 });
  }
  if (path.startsWith('/posts/')) {
    const slug = path.split('/').filter(Boolean)[1];
    const post = slug ? await db.query.posts.findFirst({ where: eq(posts.slug, slug) }) : undefined;
    if (post) await db.update(posts).set({ viewCount: post.viewCount + 1 }).where(eq(posts.id, post.id));
  }
  return ok(c, '访问已记录');
});

app.get('/related/:slug', async (c) => {
  const db = getDb(c.env.DB);
  const post = await db.query.posts.findFirst({ where: eq(posts.slug, c.req.param('slug')) });
  if (!post || post.status !== 'published') return fail(c, '文章不存在', 404);
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
  const postsData = [...related, ...fallback].filter(item => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  }).slice(0, 3);
  return ok(c, '获取相关推荐成功', { posts: postsData });
});

app.get('/ads', async (c) => {
  const db = getDb(c.env.DB);
  const data = await db.query.adSlots.findMany({ orderBy: (table) => sql`instr('header_bottom,sidebar_top,content_top,content_bottom,footer_top', ${table.position})` });
  const byPosition = new Map(data.map((slot) => [slot.position, slot]));
  const normalized = adPositions.map((position) => {
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
  return ok(c, '获取广告位成功', { adSlots: normalized });
});

app.put('/ads/:position', async (c) => {
  const position = c.req.param('position');
  if (!isAdPosition(position)) return fail(c, '广告位无效', 400);

  const body = await readJson(c);
  const adCode = typeof body?.adCode === 'string' ? body.adCode : typeof body?.ad_code === 'string' ? body.ad_code : '';
  const isEnabled = Boolean(body?.isEnabled ?? body?.is_enabled);
  const db = getDb(c.env.DB);
  const existing = await db.query.adSlots.findFirst({ where: eq(adSlots.position, position) });
  const saved = existing
    ? await db.update(adSlots).set({ adCode, isEnabled }).where(eq(adSlots.position, position)).returning()
    : await db.insert(adSlots).values({ position, adCode, isEnabled }).returning();
  return ok(c, '广告位更新成功', saved[0]);
});

export const ALL = async (context: APIContext) => {
  return app.fetch(context.request, env);
};
