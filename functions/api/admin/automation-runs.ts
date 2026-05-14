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

export function onRequestGet(context: AdminContext) {
  return withAgentOrAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const { results } = await context.env.BLOG_DB!.prepare(
      `SELECT id, run_type, status, stage, trigger_source, requested_by, started_at, finished_at, duration_ms,
        draft_path, post_slug, published_url, commit_sha, validation_summary, source_count, error, notes, created_at
       FROM automation_runs ORDER BY created_at DESC LIMIT 100`
    ).all();
    return json({ runs: results ?? [] });
  });
}

export function onRequestPost(context: AdminContext) {
  return withAgentOrAdminApi(context, async () => {
    const missing = requireDb(context.env);
    if (missing) return missing;

    const body = await readBody(context.request);
    const runType = cleanString(body.runType || body.run_type);
    const status = cleanString(body.status);
    if (!runType || !status) {
      return json({ error: "runType and status are required" }, { status: 400 });
    }

    const result = await context.env.BLOG_DB!.prepare(
      `INSERT INTO automation_runs
        (run_type, status, stage, trigger_source, requested_by, started_at, finished_at, duration_ms,
         draft_path, post_slug, published_url, commit_sha, validation_summary, source_count, error, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        runType,
        status,
        cleanString(body.stage),
        cleanString(body.triggerSource || body.trigger_source),
        cleanString(body.requestedBy || body.requested_by),
        body.startedAt || body.started_at || null,
        body.finishedAt || body.finished_at || null,
        body.durationMs || body.duration_ms || null,
        body.draftPath || body.draft_path || null,
        body.postSlug || body.post_slug || null,
        body.publishedUrl || body.published_url || null,
        body.commitSha || body.commit_sha || null,
        body.validationSummary || body.validation_summary || null,
        body.sourceCount || body.source_count || null,
        body.error || null,
        body.notes || null
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
        post_slug = COALESCE(?, post_slug),
        published_url = COALESCE(?, published_url),
        commit_sha = COALESCE(?, commit_sha),
        validation_summary = COALESCE(?, validation_summary),
        source_count = COALESCE(?, source_count),
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
        body.postSlug || body.post_slug || null,
        body.publishedUrl || body.published_url || null,
        body.commitSha || body.commit_sha || null,
        body.validationSummary || body.validation_summary || null,
        body.sourceCount || body.source_count || null,
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
