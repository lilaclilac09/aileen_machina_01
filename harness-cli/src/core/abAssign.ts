import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { AbAssignment, AbCohort, HarnessName } from './resolvedHarness.ts';

const SESSION_DIR = join(homedir(), '.hx');
const AB_PATH = join(SESSION_DIR, 'ab-assignments.json');

export type AbStore = Record<
  string,
  { cohort: AbCohort; mappedHarness: HarnessName; experiment: string; assignedAt: string }
>;

const EXPERIMENT = 'codex-nanocodex-ab';

/** Cohort A → Codex, B → Nanocodex (product naming for A/B; hx runs both). */
export function mapCohortToHarness(cohort: AbCohort): HarnessName {
  return cohort === 'A' ? 'Codex' : 'Nanocodex';
}

function loadStore(): AbStore {
  if (!existsSync(AB_PATH)) return {};
  try {
    return JSON.parse(readFileSync(AB_PATH, 'utf8')) as AbStore;
  } catch {
    return {};
  }
}

function saveStore(store: AbStore): void {
  mkdirSync(SESSION_DIR, { recursive: true });
  writeFileSync(AB_PATH, JSON.stringify(store, null, 2));
}

function hashCohort(sessionKey: string): AbCohort {
  const h = createHash('sha256').update(`${EXPERIMENT}:${sessionKey}`).digest();
  return (h[0]! & 1) === 0 ? 'A' : 'B';
}

/**
 * Sticky A/B assignment for a session key.
 * Provenance is returned for structured logs — footer must still use *resolved* harness.
 */
export function assignAbCohort(
  sessionKey: string,
  opts?: { forceCohort?: AbCohort; forceHarness?: HarnessName },
): AbAssignment {
  if (opts?.forceHarness) {
    const cohort: AbCohort = opts.forceHarness === 'Codex' ? 'A' : 'B';
    return {
      experiment: EXPERIMENT,
      cohort,
      mappedHarness: opts.forceHarness,
      reason: 'explicit-flag',
      assignedAt: new Date().toISOString(),
    };
  }
  if (opts?.forceCohort) {
    return {
      experiment: EXPERIMENT,
      cohort: opts.forceCohort,
      mappedHarness: mapCohortToHarness(opts.forceCohort),
      reason: 'explicit-flag',
      assignedAt: new Date().toISOString(),
    };
  }

  const store = loadStore();
  const existing = store[sessionKey];
  if (existing) {
    return {
      experiment: existing.experiment,
      cohort: existing.cohort,
      mappedHarness: existing.mappedHarness,
      reason: 'sticky-session',
      assignedAt: existing.assignedAt,
    };
  }

  const cohort = hashCohort(sessionKey);
  const mappedHarness = mapCohortToHarness(cohort);
  const assignedAt = new Date().toISOString();
  store[sessionKey] = { cohort, mappedHarness, experiment: EXPERIMENT, assignedAt };
  saveStore(store);
  return {
    experiment: EXPERIMENT,
    cohort,
    mappedHarness,
    reason: 'hash',
    assignedAt,
  };
}

/**
 * Resolve what actually runs. Explicit --harness wins over A/B mapping
 * (same idea as api-rs persisted resolved harness).
 */
export function resolveHarnessName(opts: {
  explicit?: HarnessName | null;
  assignment?: AbAssignment | null;
  fallback?: HarnessName;
}): HarnessName {
  if (opts.explicit) return opts.explicit;
  if (opts.assignment?.mappedHarness) return opts.assignment.mappedHarness;
  return opts.fallback ?? 'hx';
}
