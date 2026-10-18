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

/**
 * Resend idempotency answers that mean "this key was already used" (docs:
 * https://resend.com/docs/dashboard/emails/idempotency-keys#possible-responses
 * and https://resend.com/docs/api-reference/errors):
 * - 409 `invalid_idempotent_request`: the key was already used within 24 h with
 *   a different payload (the earlier request with this key was processed).
 * - 409 `concurrent_idempotent_requests`: another request with the key is in
 *   progress (that request is the one that sends).
 * Callers send one email per action id, so both mean "already sent / being
 * sent": report success and mark the action succeeded instead of failing and
 * letting the resend job send a second copy. A same-key, same-payload retry
 * already gets the original 200 + email id from Resend.
 */
export function resendIdempotentDuplicate(error: unknown): 'invalid_idempotent_request' | 'concurrent_idempotent_requests' | null {
  const name = error && typeof error === 'object' ? String((error as { name?: unknown }).name ?? '') : '';
  return name === 'invalid_idempotent_request' || name === 'concurrent_idempotent_requests' ? name : null;
}
