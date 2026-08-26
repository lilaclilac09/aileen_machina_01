/**
 * KeyShield door method (same invariants as github.com/lilaclilac09/keyshield).
 * PRF IKM never leaves the device. Server stores ciphertext only.
 */

export const KS_PRF_FIRST = 'aileena-owner-prf-v1';
export const KS_HKDF_MASTER = 'ks-master-key-v1';
export const KS_HKDF_VAULT_ID = 'ks-vault-id-v1';
export const KS_OWNER_PLAINTEXT = 'aileena-owner-v1';
