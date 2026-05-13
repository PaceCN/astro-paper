import { createSession, json, methodNotAllowed, readBody, sessionCookie, type AdminContext } from "./_utils";

export async function onRequestPost(context: AdminContext) {
  const password = context.env.ADMIN_PASSWORD;
  if (!password) {
    return json({ error: "ADMIN_PASSWORD is not configured" }, { status: 500 });
  }

  const body = await readBody(context.request);
  if (body.password !== password) {
    return json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createSession(password);
  return json(
    { ok: true, authenticated: true, loggedIn: true },
    { headers: { "set-cookie": sessionCookie(token, context.request) } }
  );
}

export function onRequest() {
  return methodNotAllowed();
}
