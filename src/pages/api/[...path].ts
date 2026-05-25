import { env } from 'cloudflare:workers';
import { and, desc, eq, like, ne, sql } from 'drizzle-orm';
import { Hono, type Context } from 'hono';
import type { APIContext } from 'astro';
import { adPositions, adSlots, comments, posts, siteSettings, type AdPosition } from '../../db/schema';
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

const defaultSettings = {
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
  tech_stack: 'Astro,Tailwind,Cloudflare,D1,Hono,Drizzle'
};

async function getSettings(db: ReturnType<typeof getDb>) {
  const rows = await db.query.siteSettings.findMany();
  return { ...defaultSettings, ...Object.fromEntries(rows.map(row => [row.key, row.value])) };
}

function settingEnabled(settings: Record<string, string>, key: keyof typeof defaultSettings) {
  return settings[key] !== 'false';
}

function publicSettings(settings: Record<string, string>) {
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
    (c.req.method === 'GET' && c.req.path === '/api/settings') ||
    (c.req.method === 'GET' && c.req.path === '/api/meta') ||
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
  if (!c.env.ADMIN_PASSWORD) return fail(c, '后台环境变量 ADMIN_PASSWORD 未配置', 500);
  if (!c.env.JWT_SECRET) return fail(c, '后台环境变量 JWT_SECRET 未配置', 500);
  if (password !== c.env.ADMIN_PASSWORD) return fail(c, '后台密码错误', 401);

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
  const settings = await getSettings(db);
  if (!settingEnabled(settings, 'comments_enabled')) return fail(c, '评论已关闭', 403);
  const post = await db.query.posts.findFirst({ where: eq(posts.slug, c.req.param('slug')) });
  if (!post || post.status !== 'published') return fail(c, '文章不存在', 404);
  const inserted = await db.insert(comments).values({ postId: post.id, author, email, content, status: 'pending' }).returning();
  const comment = inserted[0];
  return ok(c, '评论已提交，审核通过后展示', { comment: { id: comment.id, author: comment.author, content: comment.content, createdAt: comment.createdAt, status: comment.status } }, 201);
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

app.get('/settings', async (c) => {
  const db = getDb(c.env.DB);
  const settings = await getSettings(db);
  return ok(c, '获取站点设置成功', { settings: publicSettings(settings), raw: settings });
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
  const settings = await getSettings(db);
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
  return ok(c, '获取站点统计成功', {
    totalPosts: publishedPosts.length,
    tags: [...tagCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    categories: [...categoryCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    settings: publicSettings(settings)
  });
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
  const data = await db.query.adSlots.findMany({ orderBy: (table) => sql`instr('header_bottom,content_top,content_bottom,footer_top', ${table.position})` });
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
