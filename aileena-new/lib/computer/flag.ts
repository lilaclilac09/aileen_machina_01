/**
 * Feature flag for the computer-workspace prototype.
 *
 * Production (Vercel Production) is on only when COMPUTER_PROTOTYPE=1
 * and COMPUTER_WORKER_URL + COMPUTER_WORKER_SECRET are set.
 * Shim-only production stays off — Vercel disk/memory cannot host the computer.
 */

export function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

export function hasComputerWorkerEnv(): boolean {
  return Boolean(
    (process.env.COMPUTER_WORKER_URL || '').trim() &&
      (process.env.COMPUTER_WORKER_SECRET || '').trim(),
  );
}

function prototypeFlagRaw(): string {
  return (process.env.COMPUTER_PROTOTYPE || '').trim().toLowerCase();
}

function prototypeExplicitOff(): boolean {
  const raw = prototypeFlagRaw();
  return raw === '0' || raw === 'false' || raw === 'off';
}

function prototypeExplicitOn(): boolean {
  const raw = prototypeFlagRaw();
  return raw === '1' || raw === 'true' || raw === 'on';
}

/** True when the prototype APIs may run. Actor-gated on every route (owner vs visitor scratch). */
export function isComputerPrototypeEnabled(): boolean {
  if (prototypeExplicitOff()) return false;
  if (isVercelProduction()) {
    return prototypeExplicitOn() && hasComputerWorkerEnv();
  }
  if (prototypeExplicitOn()) return true;
  return process.env.NODE_ENV !== 'production';
}

export function prototypeDisabledReason(): string {
  if (isComputerPrototypeEnabled()) return '';
  if (isVercelProduction()) {
    if (!prototypeExplicitOn()) {
      return 'Computer is off on production. Set COMPUTER_PROTOTYPE=1.';
    }
    if (!hasComputerWorkerEnv()) {
      return 'Computer needs COMPUTER_WORKER_URL and COMPUTER_WORKER_SECRET on Vercel Production.';
    }
  }
  return 'Computer prototype is off. Set COMPUTER_PROTOTYPE=1.';
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
