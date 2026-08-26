/**
 * KeyShield door method. Same PRF salt + HKDF info strings as
 * extension-sync `auth.ts` / `vault.ts` (lilaclilac09/keyshield).
 * PRF IKM never leaves the device. Server stores ciphertext only.
 *
 * Changing KS_PRF_FIRST orphans every enrolled seal.
 */

export const KS_PRF_FIRST = 'keyshield-prf-v1:vault-master-secret';
export const KS_HKDF_MASTER = 'keyshield-prf-v1:encryption-key';
export const KS_HKDF_VAULT_ID = 'keyshield-prf-v1:vault-id';
export const KS_OWNER_PLAINTEXT = 'aileena-owner-v1';
export const KS_VAULT_ID_BITS = 128;
