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
      "SELECT id, run_type, status, stage, started_at, finished_at, duration_ms, draft_path, commit_sha, error, notes, created_at FROM automation_runs ORDER BY created_at DESC LIMIT 100"
    ).all();
    return json({ runs: results ?? [] });
  });
}

export function onRequestPost(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const body = await readBody(context.request);
    const runType = String(body.runType || body.run_type || "").trim();
    const status = String(body.status || "").trim();
    if (!runType || !status) {
      return json({ error: "runType and status are required" }, { status: 400 });
    }

    const result = await context.env.BLOG_DB!.prepare(
      `INSERT INTO automation_runs (run_type, status, stage, started_at, finished_at, duration_ms, draft_path, commit_sha, error, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        runType,
        status,
        String(body.stage || ""),
        body.startedAt || body.started_at || null,
        body.finishedAt || body.finished_at || null,
        body.durationMs || body.duration_ms || null,
        body.draftPath || body.draft_path || null,
        body.commitSha || body.commit_sha || null,
        body.error || null,
        body.notes || null
      )
      .run<{ meta?: { last_row_id?: number } }>();

    return json({ ok: true, id: result.meta?.last_row_id });
  });
}

export function onRequestPatch(context: AdminContext) {
  return withAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const body = await readBody(context.request);
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return json({ error: "id is required" }, { status: 400 });
    }

    await context.env.BLOG_DB!.prepare(
      `UPDATE automation_runs SET
        status = COALESCE(?, status),
        stage = COALESCE(?, stage),
        finished_at = COALESCE(?, finished_at),
        duration_ms = COALESCE(?, duration_ms),
        draft_path = COALESCE(?, draft_path),
        commit_sha = COALESCE(?, commit_sha),
        error = COALESCE(?, error),
        notes = COALESCE(?, notes)
       WHERE id = ?`
    )
      .bind(
        body.status ?? null,
        body.stage ?? null,
        body.finishedAt || body.finished_at || null,
        body.durationMs || body.duration_ms || null,
        body.draftPath || body.draft_path || null,
        body.commitSha || body.commit_sha || null,
        body.error ?? null,
        body.notes ?? null,
        id
      )
      .run();

    return json({ ok: true, id });
  });
}

export function onRequest() {
  return methodNotAllowed();
}
