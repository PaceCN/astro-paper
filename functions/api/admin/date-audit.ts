import {
  json,
  methodNotAllowed,
  readBody,
  requireDb,
  withAdminApi,
  type AdminContext,
} from "./_utils";

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

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

export function onRequestPost(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const body = await readBody(context.request);
    const sourcePath = cleanString(body.source_path || body.sourcePath);
    const reason = cleanString(body.reason);
    if (!sourcePath || !reason) {
      return json({ error: "source_path and reason are required" }, { status: 400 });
    }

    await context.env.BLOG_DB!.prepare(
      `INSERT INTO post_date_audit
        (source_path, old_pub_datetime, new_pub_datetime, old_mod_datetime, new_mod_datetime, reason, actor)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        sourcePath,
        cleanString(body.old_pub_datetime || body.oldPubDatetime) || null,
        cleanString(body.new_pub_datetime || body.newPubDatetime) || null,
        cleanString(body.old_mod_datetime || body.oldModDatetime) || null,
        cleanString(body.new_mod_datetime || body.newModDatetime) || null,
        reason,
        cleanString(body.actor) || "admin"
      )
      .run();

    return json({ ok: true });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
