const encoder = new TextEncoder();

function toBase64(bytes: ArrayBuffer) {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' },
    key,
    256
  );
  return `pbkdf2_sha256$210000$${toBase64(salt)}$${toBase64(bits)}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterations, salt, hash] = storedHash.split('$');
  if (algorithm !== 'pbkdf2_sha256' || !iterations || !salt || !hash) return false;

  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromBase64(salt), iterations: Number(iterations), hash: 'SHA-256' },
    key,
    256
  );
  return toBase64(bits) === hash;
}
