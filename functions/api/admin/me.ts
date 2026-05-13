import { json, methodNotAllowed, verifySession, type AdminContext } from "./_utils";

export async function onRequestGet(context: AdminContext) {
  const authenticated = await verifySession(context.request, context.env.ADMIN_PASSWORD);
  return json({ ok: true, authenticated, loggedIn: authenticated });
}

export function onRequest() {
  return methodNotAllowed();
}
