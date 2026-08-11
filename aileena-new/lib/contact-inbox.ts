/**
 * Private contact inbox for lead / auth / chat forwards.
 *
 * Prefer CONTACT_TO / CONTACT_TO_EMAIL / LEAD_INBOX / NOTIFY_CC_EMAIL on Vercel
 * (your real inbox). Never fall back to cafe@aileena.xyz as To — that address
 * is brand send-only (From / Reply-To). Mailing To cafe@ bounces / delays and
 * inflates Resend bounce rate.
 */

/** Brand From address — not a receivable mailbox unless MX/forwarding exists. */
export const BRAND_SEND_ONLY = 'cafe@aileena.xyz';

/** Public-safe env names the ops checklist expects (no values / secrets). */
export const CONTACT_INBOX_ENV_NAMES = [
  'CONTACT_TO',
  'CONTACT_TO_EMAIL',
  'LEAD_INBOX',
  'NOTIFY_CC_EMAIL',
] as const;

export const CONTACT_FROM_ENV_NAMES = [
  'RESEND_FROM',
  'FROM_EMAIL',
  'CONTACT_FROM',
  'CONTACT_FROM_EMAIL',
] as const;

function normalizeEmail(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, '').toLowerCase();
}

export function isBrandSendOnlyAddress(email: string): boolean {
  return normalizeEmail(email) === BRAND_SEND_ONLY;
}

export function getContactInbox(): string | null {
  const candidates = [
    process.env.CONTACT_TO,
    process.env.CONTACT_TO_EMAIL,
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

/** Which inbox env names fail to yield a real To. Public-safe — names only. */
export function listMissingContactInboxEnv(): string[] {
  if (getContactInbox()) return [];
  const bad: string[] = [];
  for (const name of CONTACT_INBOX_ENV_NAMES) {
    const raw = process.env[name];
    if (!raw || !raw.trim()) {
      bad.push(name);
      continue;
    }
    const email = normalizeEmail(raw);
    if (!email.includes('@') || isBrandSendOnlyAddress(email)) {
      bad.push(name);
    }
  }
  // Nothing set at all → list every accepted name so ops knows the checklist.
  return bad.length > 0 ? bad : [...CONTACT_INBOX_ENV_NAMES];
}

/** Ops-safe: whether mail can send (no secrets). */
export function getContactMailStatus(): {
  hasResendKey: boolean;
  hasInbox: boolean;
  from: string;
  sandboxFrom: boolean;
  missing: string[];
} {
  const from =
    process.env.RESEND_FROM ||
    process.env.FROM_EMAIL ||
    process.env.CONTACT_FROM ||
    process.env.CONTACT_FROM_EMAIL ||
    'AILEENA MACHINA <cafe@aileena.xyz>';
  const fromClean = from.trim().replace(/^["']|["']$/g, '');
  const hasResendKey = Boolean(process.env.RESEND_API_KEY?.trim());
  const hasInbox = Boolean(getContactInbox());
  const missing: string[] = [];
  if (!hasResendKey) missing.push('RESEND_API_KEY');
  if (!hasInbox) missing.push(...listMissingContactInboxEnv());
  return {
    hasResendKey,
    hasInbox,
    from: fromClean,
    sandboxFrom: /@resend\.dev\b/i.test(fromClean),
    missing,
  };
}
