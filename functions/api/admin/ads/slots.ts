import { json, methodNotAllowed, requireDb, withAdminApi, type AdminContext } from "../_utils";

export const AD_SLOTS = [
  { slot_key: "pageTop", placement: "页首", notes: "页面顶部广告开关" },
  { slot_key: "pageMiddle", placement: "页中", notes: "正文或列表中部广告开关" },
  { slot_key: "pageBottom", placement: "页尾", notes: "页面底部广告开关" },
  { slot_key: "leftRail", placement: "左侧", notes: "桌面端左侧悬浮/侧栏广告开关" },
  { slot_key: "rightRail", placement: "右侧", notes: "桌面端右侧悬浮/侧栏广告开关" },
] as const;

export const ALLOWED_AD_SLOT_KEYS: ReadonlySet<string> = new Set(
  AD_SLOTS.map(slot => slot.slot_key)
);

export function onRequestPost(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    for (const slot of AD_SLOTS) {
      await context.env.BLOG_DB!.prepare(
        `INSERT INTO ad_slots (slot_key, placement, notes, enabled, updated_at)
         VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)
         ON CONFLICT(slot_key) DO UPDATE SET
           placement = excluded.placement,
           notes = CASE WHEN ad_slots.notes = '' THEN excluded.notes ELSE ad_slots.notes END,
           updated_at = CURRENT_TIMESTAMP`
      )
        .bind(slot.slot_key, slot.placement, slot.notes)
        .run();
    }

    return json({ ok: true, slots: AD_SLOTS });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
