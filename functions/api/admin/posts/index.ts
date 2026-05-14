import {
  json,
  methodNotAllowed,
  readBody,
  requireDb,
  withAdminApi,
  type AdminContext,
} from "../_utils";

type PostIndexRow = {
  slug?: unknown;
  source_path?: unknown;
  title?: unknown;
  status?: unknown;
  draft?: unknown;
  pub_datetime?: unknown;
  mod_datetime?: unknown;
  tags?: unknown;
  description?: unknown;
  checksum?: unknown;
};

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function cleanTags(value: unknown) {
  if (Array.isArray(value)) return JSON.stringify(value.map(cleanString).filter(Boolean));
  const raw = cleanString(value);
  if (!raw) return "[]";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return JSON.stringify(parsed.map(cleanString).filter(Boolean));
  } catch {
    // fall through
  }
  return JSON.stringify(
    raw
      .split(",")
      .map(item => item.trim())
      .filter(Boolean)
  );
}

async function upsertPost(context: AdminContext, row: PostIndexRow) {
  const slug = cleanString(row.slug);
  const sourcePath = cleanString(row.source_path);
  const title = cleanString(row.title);
  const pubDatetime = cleanString(row.pub_datetime);
  if (!slug || !sourcePath || !title || !pubDatetime) {
    throw new Error("slug, source_path, title and pub_datetime are required");
  }

  const draft = row.draft === true || row.draft === 1 || row.draft === "1" || row.status === "draft";
  const status = cleanString(row.status) || (draft ? "draft" : "published");

  await context.env.BLOG_DB!.prepare(
    `INSERT INTO posts_index
      (slug, source_path, title, status, draft, pub_datetime, mod_datetime, tags, description, checksum, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(slug) DO UPDATE SET
       source_path = excluded.source_path,
       title = excluded.title,
       status = excluded.status,
       draft = excluded.draft,
       pub_datetime = excluded.pub_datetime,
       mod_datetime = excluded.mod_datetime,
       tags = excluded.tags,
       description = excluded.description,
       checksum = excluded.checksum,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(
      slug,
      sourcePath,
      title,
      status,
      draft ? 1 : 0,
      pubDatetime,
      cleanString(row.mod_datetime) || null,
      cleanTags(row.tags),
      cleanString(row.description),
      cleanString(row.checksum)
    )
    .run();
}

export function onRequestGet(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const url = new URL(context.request.url);
    const status = cleanString(url.searchParams.get("status"));
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 500);

    const query = status
      ? `SELECT slug, source_path, title, status, draft, pub_datetime, mod_datetime, tags, description, checksum, updated_at
         FROM posts_index WHERE status = ? ORDER BY pub_datetime DESC LIMIT ?`
      : `SELECT slug, source_path, title, status, draft, pub_datetime, mod_datetime, tags, description, checksum, updated_at
         FROM posts_index ORDER BY pub_datetime DESC LIMIT ?`;
    const statement = status
      ? context.env.BLOG_DB!.prepare(query).bind(status, limit)
      : context.env.BLOG_DB!.prepare(query).bind(limit);

    const { results } = await statement.all();
    return json({ posts: results ?? [] });
  });
}

export function onRequestPost(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const body = await readBody(context.request);
    const rows = Array.isArray(body.posts) ? body.posts : [body.post || body];
    let updated = 0;
    for (const row of rows) {
      await upsertPost(context, row as PostIndexRow);
      updated += 1;
    }

    return json({ ok: true, updated });
  });
}

export function onRequestDelete(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const url = new URL(context.request.url);
    const slug = cleanString(url.searchParams.get("slug"));
    if (!slug) return json({ error: "slug is required" }, { status: 400 });

    await context.env.BLOG_DB!.prepare("DELETE FROM posts_index WHERE slug = ?").bind(slug).run();
    return json({ ok: true, deleted: slug });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
