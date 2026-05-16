export type D1Post = {
  id: number;
  slug: string;
  title: string;
  description: string;
  content_markdown?: string;
  content_html?: string;
  author: string;
  tags: string;
  featured: number;
  pub_datetime: string | null;
  mod_datetime: string | null;
  updated_at: string;
  published_at: string | null;
};

export type D1Redirect = {
  old_slug: string;
  new_slug: string;
  reason: string;
  created_at: string;
};

type D1PostListOptions = {
  limit?: number;
  offset?: number;
  tag?: string;
};

export class MissingD1BindingError extends Error {
  constructor() {
    super("BLOG_DB D1 binding is not configured");
    this.name = "MissingD1BindingError";
  }
}

function requireDb(db: D1Database | undefined) {
  if (!db) throw new MissingD1BindingError();
  return db;
}

export function parseD1Tags(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function getD1PublishedPosts(
  db: D1Database | undefined,
  options: D1PostListOptions = {}
) {
  const binding = requireDb(db);
  const limit = Math.min(Math.max(Number(options.limit || 10), 1), 100);
  const offset = Math.max(Number(options.offset || 0), 0);
  const tag = String(options.tag || "").trim();
  const query = tag
    ? `SELECT id, slug, title, description, author, tags, featured, pub_datetime, mod_datetime, updated_at, published_at
       FROM posts
       WHERE status = 'published' AND tags LIKE ?
       ORDER BY COALESCE(pub_datetime, published_at, created_at) DESC
       LIMIT ? OFFSET ?`
    : `SELECT id, slug, title, description, author, tags, featured, pub_datetime, mod_datetime, updated_at, published_at
       FROM posts
       WHERE status = 'published'
       ORDER BY COALESCE(pub_datetime, published_at, created_at) DESC
       LIMIT ? OFFSET ?`;
  const statement = tag
    ? binding.prepare(query).bind(`%${tag}%`, limit, offset)
    : binding.prepare(query).bind(limit, offset);
  const { results } = await statement.all<D1Post>();
  return results ?? [];
}

export async function countD1PublishedPosts(
  db: D1Database | undefined,
  tag?: string
) {
  const binding = requireDb(db);
  const cleanTag = String(tag || "").trim();
  const statement = cleanTag
    ? binding
        .prepare(
          "SELECT COUNT(*) AS count FROM posts WHERE status = 'published' AND tags LIKE ?"
        )
        .bind(`%${cleanTag}%`)
    : binding.prepare(
        "SELECT COUNT(*) AS count FROM posts WHERE status = 'published'"
      );
  const row = await statement.first<{ count: number }>();
  return Number(row?.count || 0);
}

export async function getD1PostBySlug(
  db: D1Database | undefined,
  slug: string
) {
  const binding = requireDb(db);
  const cleanSlug = String(slug || "").trim();
  if (!cleanSlug || cleanSlug.includes("/")) return null;
  return binding
    .prepare(
      `SELECT id, slug, title, description, content_markdown, content_html, author, tags, featured, pub_datetime, mod_datetime, updated_at, published_at
       FROM posts
       WHERE slug = ? AND status = 'published'`
    )
    .bind(cleanSlug)
    .first<D1Post>();
}

export async function getD1Redirect(
  db: D1Database | undefined,
  oldSlug: string
) {
  const binding = requireDb(db);
  return binding
    .prepare(
      `SELECT old_slug, new_slug, reason, created_at
       FROM post_redirects WHERE old_slug = ?`
    )
    .bind(String(oldSlug || "").trim())
    .first<D1Redirect>();
}
