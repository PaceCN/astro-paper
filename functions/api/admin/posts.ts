import { json, methodNotAllowed, requireDb, withAdminApi, type AdminContext } from "./_utils";

export function onRequestGet(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const { results } = await context.env.BLOG_DB!.prepare(
      "SELECT slug, source_path, title, status, draft, pub_datetime, mod_datetime, tags, description, checksum, updated_at FROM posts_index ORDER BY pub_datetime DESC"
    ).all();
    return json({ posts: results ?? [] });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
