/**
 * Owner-only console preference for the GPU tier (client side, localStorage).
 * The server honors `modelTier` only for an owner session; for everyone else
 * it is ignored, so this is a preference, not a credential.
 */
export const MODEL_TIER_KEY = 'aileena.modelTier';
export type ModelTierPref = 'gpu' | 'deepseek';

export function readOwnerModelTier(): ModelTierPref | null {
  try {
    const v = typeof window === 'undefined' ? null : window.localStorage.getItem(MODEL_TIER_KEY);
    return v === 'gpu' || v === 'deepseek' ? v : null;
  } catch {
    return null;
  }
}

export function writeOwnerModelTier(v: ModelTierPref | null): void {
  try {
    if (v) window.localStorage.setItem(MODEL_TIER_KEY, v);
    else window.localStorage.removeItem(MODEL_TIER_KEY);
  } catch {
    /* private mode */
  }
}

export function ownerModelTierBody(): { modelTier?: ModelTierPref } {
  const v = readOwnerModelTier();
  return v ? { modelTier: v } : {};
}
