import { createPublicKey, verify } from 'node:crypto';
import { base58Decode } from '../auth';

const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

export function verifyEd25519Message(
  message: string,
  signature: Buffer,
  publicKeyRaw: Uint8Array,
): boolean {
  if (publicKeyRaw.length !== 32 || signature.length !== 64) return false;
  const der = Buffer.concat([ED25519_SPKI_PREFIX, Buffer.from(publicKeyRaw)]);
  const key = createPublicKey({ key: der, format: 'der', type: 'spki' });
  return verify(null, Buffer.from(message, 'utf8'), key, signature);
}

export function verifySolanaWallet(message: string, signatureB64: string, address: string): boolean {
  try {
    return verifyEd25519Message(message, Buffer.from(signatureB64, 'base64'), base58Decode(address));
  } catch {
    return false;
  }
}
