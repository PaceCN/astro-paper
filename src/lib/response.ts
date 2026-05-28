import type { Context } from 'hono';

export const apiCache = {
  publicList: 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400',
  publicDetail: 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
  publicShort: 'public, max-age=60, s-maxage=600, stale-while-revalidate=86400',
  publicRelated: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  publicComments: 'public, max-age=30, s-maxage=60, stale-while-revalidate=300'
};

export function ok(c: Context, message: string, data?: unknown, status = 200) {
  return c.json({ success: true, message, ...(data === undefined ? {} : { data }) }, status as 200);
}

export function cachedOk(c: Context, cacheControl: string, message: string, data?: unknown, status = 200) {
  c.header('Cache-Control', cacheControl);
  return ok(c, message, data, status);
}

export function fail(c: Context, message: string, status = 400) {
  return c.json({ success: false, message }, status as 400);
}
