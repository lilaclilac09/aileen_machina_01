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

/** Public vault host. Cloudflare CNAME + Vercel domain bind required. */
export const KS_APP_HOST = 'app.ks.aileena.xyz';
export const KS_APP_URL = `https://${KS_APP_HOST}`;
export const KS_APP_PATH = '/ks';
/** Unpacked Chromium install. No Chrome Web Store listing yet. */
export const KS_EXTENSION_HREF = 'https://github.com/lilaclilac09/keyshield/tree/main/src/extension';
export const KS_SOURCE_HREF = 'https://github.com/lilaclilac09/keyshield';
export const KS_SESSION_COOKIE = '__ks_vault';
export const KS_MAX_ENTRIES = 40;
export const KS_MAX_PLAINTEXT = 8_192;
export const KS_MAX_AGENTS = 24;
export const KS_MAX_SESSIONS = 20;
export const KS_MAX_TRUST = 24;

/** Wallet signs this as IKM. Same string as PRF first — not the retired v1 label. */
export const KS_WALLET_VAULT_MSG = KS_PRF_FIRST;
export const KS_WALLET_LOGIN_PREFIX =
  'Sign in to KeyShield — this proves you own this wallet. No transaction, no fees.\n\nchallenge: ';

export const KS_WALLETS = [
  { id: 'phantom', label: 'Phantom', href: 'https://phantom.app' },
  { id: 'solflare', label: 'Solflare', href: 'https://solflare.com' },
  { id: 'backpack', label: 'Backpack', href: 'https://backpack.app' },
  { id: 'okx', label: 'OKX', href: 'https://www.okx.com/web3' },
] as const;

export const KS_NAV = [
  { id: 'vault', label: 'Vault', title: 'Vault Management', subtitle: 'Encrypted secrets — AES-256-GCM at rest' },
  { id: 'activity', label: 'Activity', title: 'Activity & Billing', subtitle: 'Proxy calls, usage metrics, and balance' },
  { id: 'agents', label: 'Agents', title: 'Agent Registry', subtitle: 'ed25519 agent identities and embedded wallets' },
  { id: 'sharing', label: 'Sharing', title: 'Key Sharing', subtitle: 'Re-encrypted access for authorized recipients' },
  { id: 'sessions', label: 'Sessions', title: 'Sessions', subtitle: 'Active auth sessions across devices' },
  { id: 'settings', label: 'Settings', title: 'Settings', subtitle: 'Account, security, and preferences' },
  { id: 'developer', label: 'Developer', title: 'Developer', subtitle: 'API tokens, SDK snippets, and endpoint reference' },
  { id: 'docs', label: 'Docs', title: 'Documentation', subtitle: 'Architecture, integration guides, and specs' },
  { id: 'reports', label: 'Reports', title: 'Reports', subtitle: 'Vault audit log — detections, autofills, and saved keys' },
  { id: 'trust', label: 'X402 Trust', title: 'X402 Trust', subtitle: 'Trusted domains for x402 micropayment auto-pay' },
] as const;

export type KsNavId = (typeof KS_NAV)[number]['id'];
