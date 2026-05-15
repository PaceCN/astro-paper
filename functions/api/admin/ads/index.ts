import { json, methodNotAllowed, requireDb, withAdminApi, type AdminContext } from "../_utils";
import { AD_SLOTS } from "./slots";

async function ensureDefaultAdSlots(context: AdminContext) {
  for (const slot of AD_SLOTS) {
    await context.env.BLOG_DB!.prepare(
      `INSERT INTO ad_slots (slot_key, placement, notes, enabled, updated_at)
       VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
       ON CONFLICT(slot_key) DO NOTHING`
    )
      .bind(slot.slot_key, slot.placement, slot.notes)
      .run();
  }
}

export function onRequestGet(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    await ensureDefaultAdSlots(context);
    const keys = AD_SLOTS.map(slot => slot.slot_key);
    const placeholders = keys.map(() => "?").join(", ");
    const { results } = await context.env.BLOG_DB!.prepare(
      `SELECT slot_key, provider, client_id, slot_id, enabled, placement, notes, updated_at
       FROM ad_slots WHERE slot_key IN (${placeholders}) ORDER BY CASE slot_key
         WHEN 'homeAfterHero' THEN 1
         WHEN 'homeAfterRecent' THEN 2
         WHEN 'postTop' THEN 3
         WHEN 'postMiddle' THEN 4
         WHEN 'postBottom' THEN 5
         WHEN 'leftRail' THEN 6
         WHEN 'rightRail' THEN 7
         ELSE 99 END`
    )
      .bind(...keys)
      .all();
    return json({ slots: results ?? [] });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
