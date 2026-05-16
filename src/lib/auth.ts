import { jwtVerify, SignJWT } from 'jose';

const cookieName = 'boke_session';
const encoder = new TextEncoder();

export async function createSession(username: string, secret: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encoder.encode(secret));
}

export async function verifySession(token: string | undefined, secret: string) {
  if (!token) return null;
  try {
    const result = await jwtVerify(token, encoder.encode(secret));
    return result.payload.username;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return `${cookieName}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
}

export function clearSessionCookie() {
  return `${cookieName}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export function getSessionCookie(cookieHeader: string | undefined) {
  return cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
}
