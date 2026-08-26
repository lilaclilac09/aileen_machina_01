/** base64url helpers for WebAuthn payloads. */

export function b64urlFromBytes(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCodePoint(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function bytesFromB64url(input: string): Uint8Array {
  let s = input.replace(/-/g, '+').replace(/\//g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function b64urlFromBuf(buf: ArrayBuffer): string {
  return b64urlFromBytes(new Uint8Array(buf));
}
