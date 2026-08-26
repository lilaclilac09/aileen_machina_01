/**
 * Minimal ES256 WebAuthn verify. Platform authenticator (Touch ID / Windows Hello).
 * Not a password. Does not mention OWNER_KEY.
 */

import { createHash, createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { bytesFromB64url } from './b64';

export function rpIdFromHost(host: string): string {
  const hostname = host.split(':')[0] || 'localhost';
  if (hostname === '127.0.0.1' || hostname === '::1') return 'localhost';
  return hostname;
}

export function parseClientData(clientDataJSON: Uint8Array): {
  type: string;
  challenge: string;
  origin: string;
} {
  const json = JSON.parse(new TextDecoder().decode(clientDataJSON)) as {
    type?: string;
    challenge?: string;
    origin?: string;
  };
  return {
    type: json.type || '',
    challenge: json.challenge || '',
    origin: json.origin || '',
  };
}

export function readCounter(authenticatorData: Uint8Array): number {
  if (authenticatorData.length < 37) return 0;
  const view = new DataView(authenticatorData.buffer, authenticatorData.byteOffset, authenticatorData.byteLength);
  return view.getUint32(33);
}

export function userVerified(authenticatorData: Uint8Array): boolean {
  if (authenticatorData.length < 33) return false;
  return (authenticatorData[32] & 0x04) !== 0;
}

/** IEEE P1363 (r||s) → DER SEQUENCE for Node crypto.verify. */
export function p1363ToDer(sig: Uint8Array): Uint8Array {
  const half = Math.floor(sig.length / 2);
  let r = sig.slice(0, half);
  let s = sig.slice(half);
  while (r.length > 1 && r[0] === 0 && (r[1] & 0x80) === 0) r = r.slice(1);
  while (s.length > 1 && s[0] === 0 && (s[1] & 0x80) === 0) s = s.slice(1);
  if (r[0] & 0x80) r = Uint8Array.from([0, ...r]);
  if (s[0] & 0x80) s = Uint8Array.from([0, ...s]);
  const seqLen = 2 + r.length + 2 + s.length;
  const out = new Uint8Array(2 + seqLen);
  out[0] = 0x30;
  out[1] = seqLen;
  out[2] = 0x02;
  out[3] = r.length;
  out.set(r, 4);
  out[4 + r.length] = 0x02;
  out[5 + r.length] = s.length;
  out.set(s, 6 + r.length);
  return out;
}

export function verifyEs256(opts: {
  publicKeySpkiB64url: string;
  authenticatorDataB64url: string;
  clientDataJSONB64url: string;
  signatureB64url: string;
}): boolean {
  const authenticatorData = bytesFromB64url(opts.authenticatorDataB64url);
  const clientDataJSON = bytesFromB64url(opts.clientDataJSONB64url);
  const signature = bytesFromB64url(opts.signatureB64url);
  const spki = bytesFromB64url(opts.publicKeySpkiB64url);
  const clientHash = createHash('sha256').update(clientDataJSON).digest();
  const signed = Buffer.concat([Buffer.from(authenticatorData), clientHash]);
  const der = Buffer.from(p1363ToDer(signature));
  const key = createPublicKey({ key: Buffer.from(spki), format: 'der', type: 'spki' });
  try {
    return cryptoVerify('SHA256', signed, key, der);
  } catch {
    try {
      return cryptoVerify('SHA256', signed, key, Buffer.from(signature));
    } catch {
      return false;
    }
  }
}
