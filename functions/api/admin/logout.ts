import { clearSessionCookie, json, methodNotAllowed, type AdminContext } from "./_utils";

export function onRequestPost(context: AdminContext) {
  return json(
    { ok: true, authenticated: false, loggedIn: false },
    { headers: { "set-cookie": clearSessionCookie(context.request) } }
  );
}

export function onRequest() {
  return methodNotAllowed();
}
