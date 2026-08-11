/**
 * Resend "from" address for aileena.xyz mail (agent leads, chat forwards, auth).
 *
 * `onboarding@resend.dev` is Resend's sandbox sender — it can ONLY deliver to the
 * Resend account owner's email; other To addresses fail.
 *
 * Prefer a verified @aileena.xyz address via RESEND_FROM / FROM_EMAIL / CONTACT_FROM
 * on Vercel. Default From uses cafe@aileena.xyz (brand send-only — never use as To;
 * set CONTACT_TO to a real inbox).
 */

const BRAND_FROM = 'AILEENA MACHINA <cafe@aileena.xyz>';

function stripQuotes(value: string): string {
  return value.trim().replace(/^["']|["']$/g, '').trim();
}

export function getResendFrom(): string {
  const raw =
    process.env.RESEND_FROM ||
    process.env.FROM_EMAIL ||
    process.env.CONTACT_FROM ||
    process.env.CONTACT_FROM_EMAIL ||
    '';
  if (raw.trim()) return stripQuotes(raw);
  return BRAND_FROM;
}

export function isResendSandboxFrom(from = getResendFrom()): boolean {
  return /@resend\.dev\b/i.test(from);
}

/** Map Resend SDK errors to a short visitor-safe line (+ optional log detail). */
export function resendFailureMessage(error: unknown): {
  publicError: string;
  logDetail: string;
} {
  const detail =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error ?? 'unknown');

  if (
    isResendSandboxFrom() ||
    /only send testing emails to your own|verify a domain|onboarding@resend\.dev/i.test(
      detail,
    )
  ) {
    return {
      publicError:
        'Mail sender not ready — brand From needs a verified @aileena.xyz domain in Resend.',
      logDetail: detail,
    };
  }

  return {
    publicError: 'Failed to send.',
    logDetail: detail,
  };
}
