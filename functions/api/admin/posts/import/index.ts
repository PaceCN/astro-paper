import { json, methodNotAllowed, readBody, requireDb, withAdminApi, type AdminContext } from "../../_utils";

type ImportPost = {
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

export function onRequestPost(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const body = await readBody(context.request);
    const posts = Array.isArray(body.posts) ? (body.posts as ImportPost[]) : [];
    if (!posts.length) return json({ error: "posts array is required" }, { status: 400 });

    if (body.replace === true) {
      await context.env.BLOG_DB!.prepare("DELETE FROM posts_index").run();
    }

    let imported = 0;
    for (const post of posts) {
      const slug = cleanString(post.slug);
      const sourcePath = cleanString(post.source_path);
      const title = cleanString(post.title);
      const pubDatetime = cleanString(post.pub_datetime);
      if (!slug || !sourcePath || !title || !pubDatetime) continue;

      const draft = post.draft === true || post.draft === 1 || post.draft === "1" || post.status === "draft";
      const status = cleanString(post.status) || (draft ? "draft" : "published");

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
          cleanString(post.mod_datetime) || null,
          cleanTags(post.tags),
          cleanString(post.description),
          cleanString(post.checksum)
        )
        .run();
      imported += 1;
    }

    return json({ ok: true, imported, replaced: body.replace === true });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
