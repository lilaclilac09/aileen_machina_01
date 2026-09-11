import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

/** Walk up from cwd until AGENTS.md is found. */
export function repoRoot(start = process.cwd()): string {
  let dir = start;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'AGENTS.md')) && existsSync(join(dir, 'ops'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`repoRoot: AGENTS.md not found from ${start}`);
}

export function evolutionRoot(start = process.cwd()): string {
  if (process.env.EVOLUTION_ROOT) return process.env.EVOLUTION_ROOT;
  return join(repoRoot(start), 'ops/evolution');
}

export function evolutionPaths(root = evolutionRoot()) {
  return {
    root,
    skills: join(root, 'skills'),
    staging: join(root, 'staging'),
    prompts: join(root, 'bank/prompts.json'),
    negatives: join(root, 'bank/negatives.json'),
    verifiers: join(root, 'bank/verifiers.json'),
    ledger: join(root, 'ledger.json'),
    trajectories: join(root, 'trajectories/index.jsonl'),
    generated: join(root, 'generated-tasks/prompts.json'),
  };
}

export const CANARY_TOKEN = 'EVOLVE_CANARY_DO_NOT_EMIT';
