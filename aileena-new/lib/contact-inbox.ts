/**
 * Private contact inbox for lead / auth / chat forwards.
 *
 * Prefer CONTACT_TO / LEAD_INBOX / NOTIFY_CC_EMAIL on Vercel (your real inbox).
 * Never fall back to cafe@aileena.xyz as To — that address is brand send-only
 * (From / Reply-To). Mailing To cafe@ bounces / delays and inflates Resend
 * bounce rate.
 */

/** Brand From address — not a receivable mailbox unless MX/forwarding exists. */
export const BRAND_SEND_ONLY = 'cafe@aileena.xyz';

function normalizeEmail(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, '').toLowerCase();
}

export function isBrandSendOnlyAddress(email: string): boolean {
  return normalizeEmail(email) === BRAND_SEND_ONLY;
}

export function getContactInbox(): string | null {
  const candidates = [
    process.env.CONTACT_TO,
    process.env.LEAD_INBOX,
    process.env.NOTIFY_CC_EMAIL,
  ];
  for (const c of candidates) {
    if (!c || !c.trim()) continue;
    const email = normalizeEmail(c);
    if (!email.includes('@')) continue;
    // Misconfig: treating brand From as owner To — refuse rather than bounce.
    if (isBrandSendOnlyAddress(email)) {
      console.error(
        '[contact-inbox] refusing brand send-only address as To; set CONTACT_TO to a real inbox',
      );
      continue;
    }
    return email;
  }
  return null;
}
