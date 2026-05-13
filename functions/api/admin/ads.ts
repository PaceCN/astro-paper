import { json, methodNotAllowed, readBody, requireDb, withAdminApi, type AdminContext } from "./_utils";

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

export function onRequestPost(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const body = await readBody(context.request);
    const slotKey = String(body.slot_key || "").trim();
    if (!slotKey) return json({ error: "slot_key is required" }, { status: 400 });

    await context.env.BLOG_DB!.prepare(
      `INSERT INTO ad_slots (slot_key, provider, client_id, slot_id, enabled, placement, notes, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(slot_key) DO UPDATE SET
         provider = excluded.provider,
         client_id = excluded.client_id,
         slot_id = excluded.slot_id,
         enabled = excluded.enabled,
         placement = excluded.placement,
         notes = excluded.notes,
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(
        slotKey,
        String(body.provider || "google-adsense"),
        String(body.client_id || ""),
        String(body.slot_id || ""),
        body.enabled ? 1 : 0,
        String(body.placement || ""),
        String(body.notes || "")
      )
      .run();

    return json({ slot_key: slotKey });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
