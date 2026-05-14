import { json, methodNotAllowed, readBody, requireDb, withAdminApi, type AdminContext } from "../_utils";

type SlotContext = AdminContext & {
  params: {
    slotKey?: string;
  };
};

const ALLOWED_SLOTS = new Set([
  "homeAfterHero",
  "homeAfterRecent",
  "postTop",
  "postMiddle",
  "postBottom",
]);

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function validateAdsense(clientId: string, slotId: string) {
  if (clientId && !/^ca-pub-\d{10,}$/.test(clientId)) {
    return "clientId must look like ca-pub-xxxxxxxxxx or be empty";
  }
  if (slotId && !/^\d+$/.test(slotId)) {
    return "slotId must contain digits only or be empty";
  }
  return "";
}

export function onRequestPut(context: SlotContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const slotKey = cleanString(context.params.slotKey);
    if (!slotKey) return json({ error: "slotKey is required" }, { status: 400 });
    if (!ALLOWED_SLOTS.has(slotKey)) return json({ error: "Unknown ad slot" }, { status: 400 });

    const body = await readBody(context.request);
    const clientId = cleanString(body.client_id || body.clientId);
    const slotId = cleanString(body.slot_id || body.slotId);
    const validationError = validateAdsense(clientId, slotId);
    if (validationError) return json({ error: validationError }, { status: 400 });

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
        cleanString(body.provider || "google-adsense"),
        clientId,
        slotId,
        body.enabled ? 1 : 0,
        cleanString(body.placement),
        cleanString(body.notes)
      )
      .run();

    return json({ ok: true, slot_key: slotKey });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
