import {
  json,
  methodNotAllowed,
  readBody,
  requireDb,
  withAgentOrAdminApi,
  type AdminContext,
} from "./_utils";

function cleanString(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStatus(value: unknown) {
  const status = cleanString(value) || "queued";
  const allowed = new Set(["queued", "claimed", "running", "published", "blocked", "failed", "cancelled"]);
  return allowed.has(status) ? status : "queued";
}

export function onRequestGet(context: AdminContext) {
  return withAgentOrAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const url = new URL(context.request.url);
    const status = cleanString(url.searchParams.get("status"));
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 50), 1), 100);
    const query = status
      ? `SELECT id, request_type, status, priority, title, prompt, target_slug, run_type, requested_by, claimed_by, claimed_at, completed_at, automation_run_id, result_summary, error, created_at, updated_at
         FROM publish_requests WHERE status = ? ORDER BY priority DESC, created_at ASC LIMIT ?`
      : `SELECT id, request_type, status, priority, title, prompt, target_slug, run_type, requested_by, claimed_by, claimed_at, completed_at, automation_run_id, result_summary, error, created_at, updated_at
         FROM publish_requests ORDER BY created_at DESC LIMIT ?`;
    const statement = status
      ? context.env.BLOG_DB!.prepare(query).bind(status, limit)
      : context.env.BLOG_DB!.prepare(query).bind(limit);
    const { results } = await statement.all();
    return json({ requests: results ?? [] });
  });
}

export function onRequestPost(context: AdminContext) {
  return withAgentOrAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const body = await readBody(context.request);
    const requestType = cleanString(body.requestType || body.request_type || "manual_publish");
    const title = cleanString(body.title);
    const prompt = cleanString(body.prompt);
    if (!title || !prompt) return json({ error: "title and prompt are required" }, { status: 400 });

    const result = await context.env.BLOG_DB!.prepare(
      `INSERT INTO publish_requests
        (request_type, status, priority, title, prompt, target_slug, run_type, requested_by, updated_at)
       VALUES (?, 'queued', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
      .bind(
        requestType,
        Number(body.priority || 0),
        title.slice(0, 200),
        prompt.slice(0, 5000),
        cleanString(body.targetSlug || body.target_slug) || null,
        cleanString(body.runType || body.run_type || requestType),
        cleanString(body.requestedBy || body.requested_by || "admin") || "admin"
      )
      .run();

    return json({ ok: true, id: result.meta?.last_row_id });
  });
}

export function onRequestPatch(context: AdminContext) {
  return withAgentOrAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const body = await readBody(context.request);
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return json({ error: "id is required" }, { status: 400 });

    const status = normalizeStatus(body.status);
    await context.env.BLOG_DB!.prepare(
      `UPDATE publish_requests SET
        status = ?,
        claimed_by = COALESCE(?, claimed_by),
        claimed_at = COALESCE(?, claimed_at),
        completed_at = COALESCE(?, completed_at),
        automation_run_id = COALESCE(?, automation_run_id),
        result_summary = COALESCE(?, result_summary),
        error = COALESCE(?, error),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(
        status,
        cleanString(body.claimedBy || body.claimed_by) || null,
        body.claimedAt || body.claimed_at || null,
        body.completedAt || body.completed_at || null,
        body.automationRunId || body.automation_run_id || null,
        body.resultSummary || body.result_summary || null,
        body.error ?? null,
        id
      )
      .run();

    return json({ ok: true, id, status });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
