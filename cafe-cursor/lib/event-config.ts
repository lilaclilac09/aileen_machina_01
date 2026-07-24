/**
 * Event runtime config for IRL Cafe Cursor redeem.
 *
 * REDEEM_MODE:
 * - allowlist (default): only EligibleUser emails from Luma guest CSV
 * - open_walkup: any email + EVENT_CHECKIN_CODE (legacy door-code mode)
 * - luma: Luma API checked-in only (needs Luma Plus)
 *
 * Note: plain "open" is treated as allowlist for Cafe Cursor Shanghai so
 * Vercel env left on open still enforces the guest list after CSV sync.
 */

import { isLumaConfigured } from "@/lib/luma";

export type RedeemMode = "allowlist" | "open" | "luma";

export function getRedeemMode(): RedeemMode {
  const mode = (process.env.REDEEM_MODE || "allowlist").toLowerCase().trim();
  if (mode === "luma") return "luma";
  // Explicit walk-up / door-code mode
  if (mode === "open_walkup" || mode === "walkup") return "open";
  // "open" historically meant door-code walk-up; for this event we enforce allowlist
  // unless OPEN_WALKUP=1 is set.
  if (mode === "open" && process.env.OPEN_WALKUP === "1") return "open";
  return "allowlist";
}

/** True when redeem should use Luma API checked-in list (needs Plus). */
export function isLumaRedeemMode(): boolean {
  return getRedeemMode() === "luma" && isLumaConfigured();
}

export function getEventCheckinCode(): string | null {
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
