/**
 * Feature flag for the computer-workspace prototype.
 * Production (Vercel Production) is always off.
 */

export function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

/** True when the prototype APIs may run. Still owner-gated on every route. */
export function isComputerPrototypeEnabled(): boolean {
  if (isVercelProduction()) return false;
  const raw = (process.env.COMPUTER_PROTOTYPE || '').trim().toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'off') return false;
  if (raw === '1' || raw === 'true' || raw === 'on') return true;
  return process.env.NODE_ENV !== 'production';
}

export function prototypeDisabledReason(): string {
  if (isVercelProduction()) {
    return 'Computer prototype is hard-disabled on Vercel Production.';
  }
  if (!isComputerPrototypeEnabled()) {
    return 'Computer prototype is off. Set COMPUTER_PROTOTYPE=1 on preview/local only.';
  }
  return '';
}

/** Local/dev experiment enter. Never on Vercel Production. Not a public shell. */
export function isLocalExperimentUnlockAllowed(): boolean {
  if (isVercelProduction()) return false;
  if (!isComputerPrototypeEnabled()) return false;
  const raw = (process.env.ALLOW_EXPERIMENT_UNLOCK || '').trim().toLowerCase();
  if (raw === '0' || raw === 'false' || raw === 'off') return false;
  if (raw === '1' || raw === 'true' || raw === 'on') return true;
  return process.env.NODE_ENV !== 'production';
}
