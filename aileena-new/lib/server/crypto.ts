/**
 * Server-only AES-256-GCM for private agent data at rest.
 *
 * Never import from client components. Never log plaintext or the key.
 *
 * Env: PRIVATE_DATA_ENCRYPTION_KEY
 *   Production: base64 (or hex) of exactly 32 bytes.
 *   Also accepts a passphrase — SHA-256 derived (logged once; prefer explicit 32-byte key).
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

export const PRIVATE_DATA_ENCRYPTION_KEY_ENV = 'PRIVATE_DATA_ENCRYPTION_KEY';
export const PRIVATE_CRYPTO_VERSION = 1 as const;
export const PRIVATE_CRYPTO_ALG = 'aes-256-gcm' as const;

const IV_BYTES = 12;
const KEY_BYTES = 32;
const AAD = Buffer.from('aileena.private.v1');

export type EncryptedBlob = {
  v: typeof PRIVATE_CRYPTO_VERSION;
  alg: typeof PRIVATE_CRYPTO_ALG;
  iv: string;
  tag: string;
  ct: string;
};

let cachedKey: Buffer | null | undefined;
let derivedWarned = false;

export function resetPrivateCryptoCache(): void {
  cachedKey = undefined;
}

function tryDecodeKeyMaterial(raw: string): Buffer | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  try {
    const b64 = Buffer.from(trimmed, 'base64');
    if (b64.length === KEY_BYTES) return b64;
  } catch {
    /* fall through */
  }

  return null;
}

function loadKey(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey;
  const raw = process.env[PRIVATE_DATA_ENCRYPTION_KEY_ENV];
  if (typeof raw !== 'string' || !raw.trim()) {
    cachedKey = null;
    return null;
  }

  const explicit = tryDecodeKeyMaterial(raw);
  if (explicit && explicit.length === KEY_BYTES) {
    cachedKey = explicit;
    return cachedKey;
  }

  if (!derivedWarned) {
    derivedWarned = true;
    console.warn(
      '[privateCrypto] PRIVATE_DATA_ENCRYPTION_KEY is not a 32-byte base64/hex key; derived via SHA-256. Prefer `openssl rand -base64 32` in production.',
    );
  }
  cachedKey = createHash('sha256').update(raw.trim(), 'utf8').digest();
  return cachedKey;
}

export function privateEncryptionAvailable(): boolean {
  return loadKey() !== null;
}

export function logPrivateEncryptionMissing(scope: string): void {
  console.error(
    `[${scope}] ${PRIVATE_DATA_ENCRYPTION_KEY_ENV} missing — refusing to store plaintext private data`,
  );
}

export function isEncryptedBlob(value: unknown): value is EncryptedBlob {
  if (!value || typeof value !== 'object') return false;
  const v = value as EncryptedBlob;
  return (
    v.v === PRIVATE_CRYPTO_VERSION &&
    v.alg === PRIVATE_CRYPTO_ALG &&
    typeof v.iv === 'string' &&
    typeof v.tag === 'string' &&
    typeof v.ct === 'string' &&
    v.iv.length > 0 &&
    v.tag.length > 0 &&
    v.ct.length > 0
  );
}

export function encryptPrivateText(plaintext: string): EncryptedBlob {
  const key = loadKey();
  if (!key) {
    throw new Error('private_encryption_unavailable');
  }
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(PRIVATE_CRYPTO_ALG, key, iv);
  cipher.setAAD(AAD);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: PRIVATE_CRYPTO_VERSION,
    alg: PRIVATE_CRYPTO_ALG,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: ct.toString('base64'),
  };
}

export function decryptPrivateText(blob: EncryptedBlob): string {
  const key = loadKey();
  if (!key) {
    throw new Error('private_encryption_unavailable');
  }
  if (!isEncryptedBlob(blob)) {
    throw new Error('private_encryption_invalid');
  }
  const decipher = createDecipheriv(
    PRIVATE_CRYPTO_ALG,
    key,
    Buffer.from(blob.iv, 'base64'),
  );
  decipher.setAAD(AAD);
  decipher.setAuthTag(Buffer.from(blob.tag, 'base64'));
  const pt = Buffer.concat([
    decipher.update(Buffer.from(blob.ct, 'base64')),
    decipher.final(),
  ]);
  return pt.toString('utf8');
}

export function encryptPrivateJson(value: unknown): EncryptedBlob {
  return encryptPrivateText(JSON.stringify(value));
}

export function decryptPrivateJson<T>(blob: EncryptedBlob): T {
  return JSON.parse(decryptPrivateText(blob)) as T;
}
