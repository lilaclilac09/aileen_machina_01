/**
 * Event runtime config for IRL Cafe Cursor redeem.
 *
 * REDEEM_MODE:
 * - open: any unique email can claim once after EVENT_CHECKIN_CODE (if set)
 * - allowlist: only pre-approved EligibleUser emails
 * - luma: only Luma checked-in emails (sync via LUMA_API_KEY + LUMA_EVENT_ID); no event code
 */

import { isLumaConfigured } from "@/lib/luma";

export type RedeemMode = "allowlist" | "open" | "luma";

export function getRedeemMode(): RedeemMode {
  const mode = (process.env.REDEEM_MODE || "open").toLowerCase();
  if (mode === "allowlist") return "allowlist";
  if (mode === "luma") return "luma";
  // Convenience: if Luma is configured and mode omitted as "luma", still allow open.
  return "open";
}

/** True when redeem should use Luma checked-in list (no door code). */
export function isLumaRedeemMode(): boolean {
  return getRedeemMode() === "luma" && isLumaConfigured();
}

export function getEventCheckinCode(): string | null {
  // Luma mode replaces the shared door code
  if (isLumaRedeemMode()) return null;
  const code = (process.env.EVENT_CHECKIN_CODE || "").trim();
  return code ? code : null;
}

export function isCheckinCodeValid(input: unknown): boolean {
  const required = getEventCheckinCode();
  if (!required) return true; // no code configured → skip gate
  if (typeof input !== "string") return false;
  return input.trim().toLowerCase() === required.toLowerCase();
}

/** Whether the public form should ask for a door / event code. */
export function requiresCheckinCode(): boolean {
  return Boolean(getEventCheckinCode());
}
