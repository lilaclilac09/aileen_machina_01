/**
 * KeyShield WebAuthn RP ID.
 *
 * Apple Passkeys / iCloud Keychain bind to the RP ID. Use the registrable
 * suffix so www, apex, and app.ks share one passkey. Owner site passkeys
 * (`lib/passkey/webauthn.ts`) stay on the exact hostname.
 */
export const KS_RP_ID = 'aileena.xyz';

export function ksRpIdFromHost(host: string): string {
  const hostname = (host.split(':')[0] || 'localhost').toLowerCase();
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return 'localhost';
  }
  if (hostname === KS_RP_ID || hostname.endsWith(`.${KS_RP_ID}`)) {
    return KS_RP_ID;
  }
  return hostname;
}
