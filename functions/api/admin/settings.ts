import {
  json,
  methodNotAllowed,
  readBody,
  requireDb,
  withAdminApi,
  type AdminContext,
} from "./_utils";

export function onRequestGet(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const { results } = await context.env.BLOG_DB!.prepare(
      "SELECT key, value_json, updated_at FROM site_settings ORDER BY key ASC"
    ).all();
    return json({ settings: results ?? [] });
  });
}

export function onRequestPut(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const body = await readBody(context.request);
    const settings =
      body.settings && typeof body.settings === "object" ? body.settings : body;
    let updated = 0;

    for (const [key, value] of Object.entries(
      settings as Record<string, unknown>
    )) {
      await context.env.BLOG_DB!.prepare(
        `INSERT INTO site_settings (key, value_json, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`
      )
        .bind(key, JSON.stringify(value))
        .run();
      updated += 1;
    }

    return json({ updated });
  });
}

export const onRequestPost = onRequestPut;

export function onRequest() {
  return methodNotAllowed();
}
