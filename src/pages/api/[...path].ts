import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { Hono, type Context } from 'hono';
import type { APIContext } from 'astro';
import { adPositions, adSlots, comments, posts, siteSettings, type AdPosition } from '../../db/schema';
import { clearSessionCookie, createSession, getSessionCookie, sessionCookie, verifySession } from '../../lib/auth';
import {
  defaultSettings,
  getAdSlots,
  getAllPosts,
  getPublishedCommentsBySlug,
  getPublicMeta,
  getPublicPostBySlug,
  getPublicPosts,
  getPublicSettings,
  getRelatedPosts,
  getSettings,
  normalizePage,
  normalizePageSize,
  publicSettings,
  settingEnabled
} from '../../lib/content-service';
import { getDb } from '../../lib/db';
import { apiCache, cachedOk, fail, ok } from '../../lib/response';

type Bindings = {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  BACKEND_ENTRY: string;
  AI_API_TOKEN: string;
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
    (c.req.method === 'POST' && c.req.path.match(/^\/api\/[^/]+\/ai\/posts$/)) ||
    (c.req.method === 'GET' && c.req.path === '/api/ads') ||
    (c.req.method === 'GET' && c.req.path === '/api/settings') ||
    (c.req.method === 'GET' && c.req.path === '/api/meta') ||
    (c.req.method === 'GET' && c.req.path.startsWith('/api/related/')) ||
    (c.req.method === 'GET' && c.req.path === '/api/posts' && c.req.query('status') === 'published') ||
    (c.req.method === 'GET' && c.req.path.startsWith('/api/posts/')) ||
    (c.req.method === 'POST' && c.req.path.match(/^\/api\/posts\/[^/]+\/comments$/));

  if (isPublic) return next();

  const username = await verifySession(getSessionCookie(c.req.header('Cookie')), c.env.ADMIN_PASSWORD);
  if (!username) return fail(c, '未登录或会话已过期', 401);
  return next();
});

app.post('/auth/login', async (c) => {
  const body = await readJson(c);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!password) return fail(c, '请输入后台密码', 400);
  if (!c.env.ADMIN_PASSWORD) return fail(c, '后台环境变量 ADMIN_PASSWORD 未配置', 500);
  if (password !== c.env.ADMIN_PASSWORD) return fail(c, '后台密码错误', 401);

  const token = await createSession('admin', c.env.ADMIN_PASSWORD);
  c.header('Set-Cookie', sessionCookie(token));
  return ok(c, '登录成功');
});

app.post('/auth/logout', (c) => {
  c.header('Set-Cookie', clearSessionCookie());
  return ok(c, '已退出登录');
});

app.post('/:backendEntry/ai/posts', async (c) => {
  if (!c.env.BACKEND_ENTRY || c.req.param('backendEntry') !== c.env.BACKEND_ENTRY) return fail(c, '接口不存在', 404);
  if (!c.env.AI_API_TOKEN) return fail(c, 'AI_API_TOKEN 未配置', 500);
  const token = c.req.header('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token || token !== c.env.AI_API_TOKEN) return fail(c, 'AI token 无效', 401);
  return createPost(c, { ai: true });
});

app.get('/posts', async (c) => {
  const db = getDb(c.env.DB);
  const status = c.req.query('status');
  const page = normalizePage(c.req.query('page'));
  const pageSize = normalizePageSize(c.req.query('pageSize'));

  if (status === 'published') {
    const data = await getPublicPosts(db, {
      page,
      pageSize,
      tag: c.req.query('tag'),
      category: c.req.query('category'),
      includeContent: c.req.query('includeContent') === 'true'
    });
    return cachedOk(c, apiCache.publicList, '获取文章列表成功', data);
  }

  const data = await getAllPosts(db, { page, pageSize, status });
  return ok(c, '获取文章列表成功', data);
});

app.get('/posts/:slug', async (c) => {
  const db = getDb(c.env.DB);
  const post = await getPublicPostBySlug(db, c.req.param('slug'));
  if (!post) return fail(c, '文章不存在', 404);
  return cachedOk(c, apiCache.publicDetail, '获取文章成功', { post });
});

app.get('/posts/:slug/comments', async (c) => {
  const db = getDb(c.env.DB);
  const data = await getPublishedCommentsBySlug(db, c.req.param('slug'));
  if (!data) return fail(c, '文章不存在', 404);
  return cachedOk(c, apiCache.publicComments, '获取评论成功', { comments: data });
});

app.post('/posts/:slug/comments', async (c) => {
  const body = await readJson(c);
  const author = String(body?.author ?? '').trim().slice(0, 40);
  const email = String(body?.email ?? '').trim().slice(0, 120);
  const content = String(body?.content ?? '').trim().slice(0, 1000);
  if (!author || !content) return fail(c, '昵称和评论内容不能为空', 400);
  const db = getDb(c.env.DB);
  const settings = await getSettings(db);
  if (!settingEnabled(settings, 'comments_enabled')) return fail(c, '评论已关闭', 403);
  const post = await db.query.posts.findFirst({ where: eq(posts.slug, c.req.param('slug')) });
  if (!post || post.status !== 'published') return fail(c, '文章不存在', 404);
  const inserted = await db.insert(comments).values({ postId: post.id, author, email, content, status: 'pending' }).returning();
  const comment = inserted[0];
  return ok(c, '评论已提交，审核通过后展示', { comment: { id: comment.id, author: comment.author, content: comment.content, createdAt: comment.createdAt, status: comment.status } }, 201);
});

async function createPost(c: Context<{ Bindings: Bindings }>, options: { ai?: boolean } = {}) {
  const body = await readJson(c);
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const content = typeof body?.content === 'string' ? body.content : '';
  const requestedSlug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  const db = getDb(c.env.DB);
  const settings = options.ai ? await getSettings(db) : null;
  if (options.ai && !settingEnabled(settings!, 'ai_can_create_post')) return fail(c, 'AI 发文权限未开启', 403);

  const requestedStatus = body?.status === 'published' ? 'published' : 'hidden';
  const status = options.ai && !settingEnabled(settings!, 'ai_can_publish_post') ? settings!.ai_default_status === 'published' ? 'published' : 'hidden' : requestedStatus;
  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 220) : plainText(content).slice(0, 160);
  const tags = options.ai && !settingEnabled(settings!, 'ai_can_set_tags') ? '' : normalizeList(body?.tags);
  const category = options.ai && !settingEnabled(settings!, 'ai_can_set_category') ? '随笔' : String(body?.category ?? '随笔').trim().slice(0, 40) || '随笔';
  const featured = options.ai && !settingEnabled(settings!, 'ai_can_set_featured') ? false : Boolean(body?.featured);
  const slug = slugify(requestedSlug || title);
  if (!title || !slug || !content) return fail(c, '标题、slug 和内容不能为空', 400);

  const existing = await db.query.posts.findFirst({ where: eq(posts.slug, slug) });
  if (existing) return fail(c, 'slug 已存在，请更换后重试', 409);

  const inserted = await db.insert(posts).values({ title, slug, content, description, tags, category, featured, status }).returning();
  return ok(c, options.ai ? 'AI 文章创建成功' : '文章创建成功', inserted[0], 201);
}

app.post('/posts', async (c) => createPost(c));

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

app.get('/settings', async (c) => {
  const db = getDb(c.env.DB);
  return cachedOk(c, apiCache.publicShort, '获取站点设置成功', await getPublicSettings(db));
});

app.put('/settings', async (c) => {
  const body = await readJson(c);
  if (!body) return fail(c, '设置内容不能为空', 400);
  const allowed = new Set(Object.keys(defaultSettings));
  const entries = Object.entries(body).filter(([key]) => allowed.has(key));
  const db = getDb(c.env.DB);
  for (const [key, value] of entries) {
    const normalized = typeof value === 'boolean' ? String(value) : String(value ?? '');
    const existing = await db.query.siteSettings.findFirst({ where: eq(siteSettings.key, key) });
    if (existing) await db.update(siteSettings).set({ value: normalized }).where(eq(siteSettings.key, key));
    else await db.insert(siteSettings).values({ key, value: normalized });
  }
  const settings = await getSettings(db);
  return ok(c, '站点设置已保存', { settings: publicSettings(settings), raw: settings });
});

app.get('/comments', async (c) => {
  const status = c.req.query('status');
  const db = getDb(c.env.DB);
  const where = status === 'pending' || status === 'published' || status === 'hidden' ? eq(comments.status, status) : undefined;
  const data = await db.query.comments.findMany({ where, orderBy: (table, { desc }) => desc(table.createdAt), limit: 100 });
  return ok(c, '获取评论成功', { comments: data });
});

app.patch('/comments/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await readJson(c);
  const status = body?.status;
  if (!Number.isInteger(id) || id < 1) return fail(c, '评论 ID 无效', 400);
  if (status !== 'pending' && status !== 'published' && status !== 'hidden') return fail(c, '评论状态无效', 400);
  const db = getDb(c.env.DB);
  const updated = await db.update(comments).set({ status }).where(eq(comments.id, id)).returning();
  if (!updated.length) return fail(c, '评论不存在', 404);
  return ok(c, '评论状态已更新', updated[0]);
});

app.delete('/comments/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id < 1) return fail(c, '评论 ID 无效', 400);
  const db = getDb(c.env.DB);
  const deleted = await db.delete(comments).where(eq(comments.id, id)).returning();
  if (!deleted.length) return fail(c, '评论不存在', 404);
  return ok(c, '评论已删除', deleted[0]);
});

app.get('/meta', async (c) => {
  const db = getDb(c.env.DB);
  return cachedOk(c, apiCache.publicShort, '获取站点统计成功', await getPublicMeta(db));
});

app.get('/related/:slug', async (c) => {
  const db = getDb(c.env.DB);
  const postsData = await getRelatedPosts(db, c.req.param('slug'));
  if (!postsData) return fail(c, '文章不存在', 404);
  return cachedOk(c, apiCache.publicRelated, '获取相关推荐成功', { posts: postsData });
});

app.get('/ads', async (c) => {
  const db = getDb(c.env.DB);
  return cachedOk(c, apiCache.publicShort, '获取广告位成功', { adSlots: await getAdSlots(db) });
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
