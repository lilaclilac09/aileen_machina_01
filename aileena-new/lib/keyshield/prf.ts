/**
 * Browser KeyShield derive: WebAuthn PRF → HKDF-SHA-256 → AES-256-GCM.
 * Master key is non-extractable. Server never sees PRF output.
 */

import { b64urlFromBytes, b64urlFromBuf, bytesFromB64url } from '../passkey/b64';
import {
  KS_HKDF_MASTER,
  KS_HKDF_VAULT_ID,
  KS_OWNER_PLAINTEXT,
  KS_PRF_FIRST,
  KS_VAULT_ID_BITS,
} from './constants';

const enc = new TextEncoder();
const dec = new TextDecoder();

export function prfFirstBytes(): Uint8Array {
  return enc.encode(KS_PRF_FIRST);
}

export function readPrfFirst(cred: PublicKeyCredential): ArrayBuffer | null {
  const ext = cred.getClientExtensionResults() as {
    prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } };
  };
  const first = ext.prf?.results?.first;
  return first && first.byteLength > 0 ? first : null;
}

function copyBytes(view: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(view.byteLength);
  out.set(view);
  return out;
}

function asPrfSecret(prfFirst: BufferSource): Uint8Array<ArrayBuffer> {
  const u8 = ArrayBuffer.isView(prfFirst)
    ? new Uint8Array(prfFirst.buffer, prfFirst.byteOffset, prfFirst.byteLength)
    : new Uint8Array(prfFirst);
  if (u8.byteLength !== 32) {
    throw new Error(`PRF secret must be 32 bytes, got ${u8.byteLength}`);
  }
  return copyBytes(u8);
}

export async function deriveKeyshield(prfFirst: BufferSource): Promise<{ aes: CryptoKey; vaultId: string }> {
  const prfSecret = asPrfSecret(prfFirst);
  const ikm = await crypto.subtle.importKey('raw', prfSecret, 'HKDF', false, ['deriveKey', 'deriveBits']);
  const aes = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: enc.encode(KS_HKDF_MASTER) },
    ikm,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  const vaultBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(), info: enc.encode(KS_HKDF_VAULT_ID) },
    ikm,
    KS_VAULT_ID_BITS,
  );
  return { aes, vaultId: b64urlFromBytes(new Uint8Array(vaultBits)) };
}

export async function sealOwner(aes: CryptoKey): Promise<{ iv: string; cipher: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, enc.encode(KS_OWNER_PLAINTEXT));
  return { iv: b64urlFromBytes(iv), cipher: b64urlFromBuf(cipher) };
}

export async function openOwnerSeal(aes: CryptoKey, iv: string, cipher: string): Promise<boolean> {
  try {
    const pt = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytesFromB64url(iv) },
      aes,
      bytesFromB64url(cipher),
    );
    return dec.decode(pt) === KS_OWNER_PLAINTEXT;
  } catch {
    return false;
  }
}
