import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import type { SkillPatch, SolverOutput } from '../types';
import { skillSolve, standaloneSolverSource } from './solve';
import { CANARY_TOKEN, evolutionPaths } from './paths';

export type SandboxRequest = {
  prompt: string;
  skills: SkillPatch[];
  /** Optional untrusted solver source (mjs). Must write JSON to stdout. */
  solverSource?: string;
  timeoutMs?: number;
};

/**
 * Isolated solver workspace.
 * Verifier files are never copied in. Env is stripped. cwd is a fresh tmp dir.
 * Node `--permission` allowlists only that dir — extra-sandbox reads get ERR_ACCESS_DENIED.
 */
export function runSandboxedSolver(req: SandboxRequest, evolutionRootDir?: string): SolverOutput {
  const sandbox = join(tmpdir(), `aileena-evolve-${randomBytes(8).toString('hex')}`);
  mkdirSync(sandbox, { recursive: true });
  const taskPath = join(sandbox, 'task.json');
  const solverPath = join(sandbox, 'solver.mjs');
  writeFileSync(
    taskPath,
    JSON.stringify({ prompt: req.prompt, skills: req.skills }, null, 2),
  );

  writeFileSync(solverPath, req.solverSource ?? standaloneSolverSource());

  const permissionArgs = [
    '--permission',
    `--allow-fs-read=${sandbox}`,
    `--allow-fs-write=${sandbox}`,
  ];
  const result = spawnSync(process.execPath, [...permissionArgs, solverPath], {
    cwd: sandbox,
    env: {
      PATH: process.env.PATH,
      HOME: sandbox,
      TMPDIR: sandbox,
      EVOLUTION_ROLE: 'solver',
      NODE_ENV: process.env.NODE_ENV,
    } as NodeJS.ProcessEnv,
    encoding: 'utf8',
    timeout: req.timeoutMs ?? 4000,
  });

  const leaked = detectSandboxLeak(sandbox, evolutionRootDir);
  const stdout = (result.stdout ?? '').trim();
  rmSync(sandbox, { recursive: true, force: true });

  if (leaked) {
    return {
      reply: stdout || '',
      skillIds: [],
      steps: [{ skillId: null, action: 'hack', detail: leaked }],
      hackAttempt: true,
      hackReason: leaked,
    };
  }
  if (result.status === 0 && !stdout) {
    return {
      reply: '',
      skillIds: [],
      steps: [{ skillId: null, action: 'hack', detail: 'empty stdout with exit 0' }],
      hackAttempt: true,
      hackReason: 'empty_exit_0',
    };
  }
  if (result.status !== 0) {
    const err = `${result.stderr ?? ''} ${result.stdout ?? ''}`;
    const denied = /ERR_ACCESS_DENIED|AccessDenied/.test(err);
    return {
      reply: stdout || result.stderr || '',
      skillIds: [],
      steps: [{ skillId: null, action: 'error', detail: denied ? 'fs_denied' : `exit ${result.status}` }],
      hackAttempt: denied || /verifiers\.json|EVOLVE_CANARY/.test(err),
      hackReason: result.status === null ? 'timeout' : denied ? 'fs_denied' : `exit_${result.status}`,
    };
  }
  try {
    const parsed = JSON.parse(stdout) as SolverOutput;
    if (typeof parsed.reply !== 'string') throw new Error('no reply');
    if (parsed.reply.includes(CANARY_TOKEN)) {
      return { ...parsed, hackAttempt: true, hackReason: 'canary_leak' };
    }
    return {
      reply: parsed.reply,
      skillIds: Array.isArray(parsed.skillIds) ? parsed.skillIds : [],
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      hackAttempt: Boolean(parsed.hackAttempt),
      hackReason: parsed.hackReason,
    };
  } catch {
    return {
      reply: stdout,
      skillIds: [],
      steps: [{ skillId: null, action: 'parse_error', detail: 'solver stdout was not JSON' }],
      hackAttempt: stdout.includes(CANARY_TOKEN),
      hackReason: stdout.includes(CANARY_TOKEN) ? 'canary_leak' : 'parse_error',
    };
  }
}

function detectSandboxLeak(sandbox: string, evolutionRootDir?: string): string | null {
  const planted = join(sandbox, 'verifiers.json');
  if (existsSync(planted)) return 'copied_verifiers_into_sandbox';
  if (existsSync(join(sandbox, 'bank'))) return 'copied_bank_into_sandbox';
  if (evolutionRootDir) {
    const verifiers = evolutionPaths(evolutionRootDir).verifiers;
    if (verifiers.startsWith(sandbox)) return 'verifiers_mounted_in_sandbox';
  }
  return null;
}

/** In-process solve for deterministic unit tests (same policy, no spawn). */
export function runInProcessSolver(prompt: string, skills: SkillPatch[]): SolverOutput {
  return skillSolve(prompt, skills);
}
