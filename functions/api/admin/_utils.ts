export type Env = {
  ADMIN_PASSWORD?: string;
  BLOG_DB?: D1Database;
};

export type AdminContext = {
  request: Request;
  env: Env;
};

export type JsonValue = Record<string, unknown> | unknown[];

export const COOKIE_NAME = "pace_admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

export function json(data: JsonValue, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...init.headers,
    },
  });
}

export function methodNotAllowed() {
  return json({ error: "Method not allowed" }, { status: 405 });
}

export async function readBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function toBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function createSession(password: string) {
  const expires = Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE;
  const nonce = crypto.randomUUID();
  const payload = `${expires}.${nonce}`;
  const signature = await hmac(password, payload);
  return `${payload}.${signature}`;
}

export async function verifySession(request: Request, password: string | undefined) {
  if (!password) return false;
  const token = getCookie(request, COOKIE_NAME);
  if (!token) return false;

  const [expires, nonce, signature] = token.split(".");
  if (!expires || !nonce || !signature) return false;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;

  const expected = await hmac(password, `${expires}.${nonce}`);
  return signature === expected;
}

export function sessionCookie(value: string, request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export async function requireAuth(context: AdminContext) {
  const authenticated = await verifySession(context.request, context.env.ADMIN_PASSWORD);
  if (!authenticated) return json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export function requireDb(env: Env) {
  if (!env.BLOG_DB) {
    return json({ error: "BLOG_DB binding is not configured" }, { status: 500 });
  }
  return null;
}

export async function withAdminApi(context: AdminContext, handler: () => Promise<Response> | Response) {
  try {
    const unauthorized = await requireAuth(context);
    if (unauthorized) return unauthorized;

    return await handler();
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unexpected admin API error" },
      { status: 500 }
    );
  }
}
