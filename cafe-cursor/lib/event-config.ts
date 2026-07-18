/**
 * Event runtime config for IRL Cafe Cursor redeem.
 *
 * REDEEM_MODE:
 * - open: any unique email can claim once after EVENT_CHECKIN_CODE (if set)
 * - allowlist: only EligibleUser emails (import Luma guest CSV — no Luma Plus)
 * - luma: Luma API checked-in only (needs Luma Plus + LUMA_API_KEY)
 */

import { isLumaConfigured } from "@/lib/luma";

export type RedeemMode = "allowlist" | "open" | "luma";

export function getRedeemMode(): RedeemMode {
  const mode = (process.env.REDEEM_MODE || "allowlist").toLowerCase();
  if (mode === "open") return "open";
  if (mode === "luma") return "luma";
  return "allowlist";
}

/** True when redeem should use Luma API checked-in list (needs Plus). */
export function isLumaRedeemMode(): boolean {
  return getRedeemMode() === "luma" && isLumaConfigured();
}

export function getEventCheckinCode(): string | null {
  // allowlist / luma: email gate only — no shared door code
  const mode = getRedeemMode();
  if (mode === "allowlist" || isLumaRedeemMode()) return null;

  const code = (process.env.EVENT_CHECKIN_CODE || "").trim();
  return code ? code : null;
}

export function isCheckinCodeValid(input: unknown): boolean {
  const required = getEventCheckinCode();
  if (!required) return true;
  if (typeof input !== "string") return false;
  return input.trim().toLowerCase() === required.toLowerCase();
}

export function requiresCheckinCode(): boolean {
  return Boolean(getEventCheckinCode());
}
