/**
 * Credit pool have/need ledger (ops view).
 *
 * IMPORTANT: unreemed Cursor referral links do NOT expose face value via any
 * public API. We cannot auto-detect whether a link is $30 or $50.
 * Denomination is an operator-configured assumption (default $50 for Cafe Cursor).
 */

export function getCreditDenominationUsd(): number {
  const raw = process.env.CREDIT_DENOMINATION_USD?.trim();
  if (!raw) return 50;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 50;
  return Math.round(n);
}

/** Never render empty amounts — broken "have , need …" is worse than unknown. */
export function formatHaveNeed(
  haveUsd: number | null | undefined,
  needUsd: number | null | undefined
): string {
  const h =
    typeof haveUsd === "number" && Number.isFinite(haveUsd)
      ? `$${haveUsd}`
      : "unknown";
  const n =
    typeof needUsd === "number" && Number.isFinite(needUsd)
      ? `$${needUsd}`
      : "unknown";
  return `have ${h}, need ${n}`;
}

export type HaveNeedLedger = {
  denominationUsd: number;
  denominationSource: "env" | "default";
  canAutoDetectFaceValue: false;
  availableCount: number;
  unclaimedApprovedCount: number;
  haveUsd: number;
  needUsd: number;
  shortUsd: number;
  label: string;
  note: string;
};

export function computeHaveNeed(input: {
  availableCount: number;
  unclaimedApprovedCount: number;
  denominationUsd?: number;
}): HaveNeedLedger {
  const fromEnv = process.env.CREDIT_DENOMINATION_USD?.trim();
  const denominationUsd =
    input.denominationUsd ?? getCreditDenominationUsd();
  const availableCount = Math.max(0, Math.floor(input.availableCount));
  const unclaimedApprovedCount = Math.max(
    0,
    Math.floor(input.unclaimedApprovedCount)
  );
  const haveUsd = availableCount * denominationUsd;
  const needUsd = unclaimedApprovedCount * denominationUsd;
  const shortUsd = Math.max(0, needUsd - haveUsd);

  return {
    denominationUsd,
    denominationSource: fromEnv ? "env" : "default",
    canAutoDetectFaceValue: false,
    availableCount,
    unclaimedApprovedCount,
    haveUsd,
    needUsd,
    shortUsd,
    label: formatHaveNeed(haveUsd, needUsd),
    note:
      "Face value is configured (not probed). Cursor referral links cannot be inspected for $30 vs $50 without redeeming into an account.",
  };
}
