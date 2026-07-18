/**
 * Event runtime config for IRL Cafe Cursor redeem.
 *
 * REDEEM_MODE:
 * - allowlist: only pre-approved EligibleUser emails can claim (default / original)
 * - open: any unique email can claim once after providing EVENT_CHECKIN_CODE (IRL walk-up)
 */

export type RedeemMode = "allowlist" | "open";

export function getRedeemMode(): RedeemMode {
  const mode = (process.env.REDEEM_MODE || "open").toLowerCase();
  return mode === "allowlist" ? "allowlist" : "open";
}

export function getEventCheckinCode(): string | null {
  const code = (process.env.EVENT_CHECKIN_CODE || "").trim();
  return code ? code : null;
}

export function isCheckinCodeValid(input: unknown): boolean {
  const required = getEventCheckinCode();
  if (!required) return true; // no code configured → skip gate
  if (typeof input !== "string") return false;
  return input.trim().toLowerCase() === required.toLowerCase();
}
