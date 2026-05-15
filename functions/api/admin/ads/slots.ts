import { json, methodNotAllowed, requireDb, withAdminApi, type AdminContext } from "../_utils";

export const AD_SLOTS = [
  {
    slot_key: "homeAfterHero",
    placement: "首页介绍后",
    notes: "首页介绍区下方广告位，可作为首页首个低干扰广告位。",
  },
  {
    slot_key: "homeAfterRecent",
    placement: "首页最近文章后",
    notes: "首页最近文章列表后方广告位。",
  },
  {
    slot_key: "postTop",
    placement: "文章顶部",
    notes: "文章标题附近广告位，默认建议关闭，避免首屏体验变差。",
  },
  {
    slot_key: "postMiddle",
    placement: "文章中部",
    notes: "长文章中段广告位，默认建议关闭，确认体验后再启用。",
  },
  {
    slot_key: "postBottom",
    placement: "文章底部",
    notes: "文章结尾后的广告位，优先建议从这里开始启用。",
  },
  {
    slot_key: "leftRail",
    placement: "桌面左侧栏",
    notes: "桌面端左侧栏广告位；当前前台组件未默认渲染。",
  },
  {
    slot_key: "rightRail",
    placement: "桌面右侧栏",
    notes: "桌面端右侧栏广告位；当前前台组件未默认渲染。",
  },
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
