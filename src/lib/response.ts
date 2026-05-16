import type { Context } from 'hono';

export function ok(c: Context, message: string, data?: unknown, status = 200) {
  return c.json({ success: true, message, ...(data === undefined ? {} : { data }) }, status as 200);
}

export function fail(c: Context, message: string, status = 400) {
  return c.json({ success: false, message }, status as 400);
}
