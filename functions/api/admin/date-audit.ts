import { json, methodNotAllowed, requireDb, withAdminApi, type AdminContext } from "./_utils";

export function onRequestGet(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const { results } = await context.env.BLOG_DB!.prepare(
      "SELECT id, source_path, old_pub_datetime, new_pub_datetime, old_mod_datetime, new_mod_datetime, reason, actor, created_at FROM post_date_audit ORDER BY created_at DESC LIMIT 100"
    ).all();
    return json({ audits: results ?? [] });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
