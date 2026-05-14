import { json, methodNotAllowed, requireDb, withAdminApi, type AdminContext } from "../_utils";

export function onRequestGet(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const { results } = await context.env.BLOG_DB!.prepare(
      "SELECT slot_key, provider, client_id, slot_id, enabled, placement, notes, updated_at FROM ad_slots ORDER BY id ASC"
    ).all();
    return json({ slots: results ?? [] });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
