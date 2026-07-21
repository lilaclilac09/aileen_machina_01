/**
 * Volunteer / claim-limit helpers for Cafe Cursor redeem.
 */

export function getVolunteerMaxClaims(): number {
  const raw = (process.env.VOLUNTEER_MAX_CLAIMS || "6").trim();
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return 6;
  return Math.min(n, 100);
}
