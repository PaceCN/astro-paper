import { env } from 'cloudflare:workers';
import { eq, sql } from 'drizzle-orm';
import { Hono, type Context } from 'hono';
import type { APIContext } from 'astro';
import { adPositions, adSlots, posts, type AdPosition } from '../../db/schema';
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
    (c.req.method === 'GET' && c.req.path === '/api/posts' && c.req.query('status') === 'published') ||
    (c.req.method === 'GET' && c.req.path.startsWith('/api/posts/'));

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
  const page = Math.max(Number(c.req.query('page') ?? '1'), 1);
  const pageSize = Math.min(Math.max(Number(c.req.query('pageSize') ?? '10'), 1), 50);
  const where = status === 'published' || status === 'hidden' ? eq(posts.status, status) : undefined;
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

app.post('/posts', async (c) => {
  const body = await readJson(c);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.content === 'string' ? body.content : '';
  const requestedSlug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  const status = body?.status === 'published' ? 'published' : 'hidden';
  const slug = slugify(requestedSlug || title);
  if (!title || !slug || !content) return fail(c, '标题、slug 和内容不能为空', 400);

  const db = getDb(c.env.DB);
  const inserted = await db.insert(posts).values({ title, slug, content, status }).returning();
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

app.get('/ads', async (c) => {
  const db = getDb(c.env.DB);
  const data = await db.query.adSlots.findMany({ orderBy: (table) => sql`instr('header_bottom,sidebar_top,content_top,content_bottom,footer_top', ${table.position})` });
  return ok(c, '获取广告位成功', { adSlots: data });
});

app.put('/ads/:position', async (c) => {
  const position = c.req.param('position');
  if (!isAdPosition(position)) return fail(c, '广告位无效', 400);

  const body = await readJson(c);
  const adCode = typeof body?.adCode === 'string' ? body.adCode : typeof body?.ad_code === 'string' ? body.ad_code : '';
  const isEnabled = Boolean(body?.isEnabled ?? body?.is_enabled);
  const db = getDb(c.env.DB);
  const updated = await db
    .update(adSlots)
    .set({ adCode, isEnabled })
    .where(eq(adSlots.position, position))
    .returning();
  return ok(c, '广告位更新成功', updated[0]);
});

export const ALL = async (context: APIContext) => {
  return app.fetch(context.request, env);
};
