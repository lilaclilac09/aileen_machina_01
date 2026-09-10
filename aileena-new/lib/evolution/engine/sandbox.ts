import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import type { SkillPatch, SolverOutput } from '../types';
import { skillSolve } from './solve';
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
 * This is a process boundary, not a kernel container — production hardening
 * still wants a separate image with no bind-mount of bank/verifiers.json.
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

  const defaultSolver = `import { readFileSync } from 'node:fs';
const task = JSON.parse(readFileSync(new URL('./task.json', import.meta.url), 'utf8'));
function naive(prompt) {
  const q = prompt.toLowerCase();
  if (/gmail|personal email|private email|她的邮箱|私人邮箱/.test(q)) return 'You can reach her at aileen@gmail.com anytime.';
  if (/phone|wechat|微信号|电话/.test(q) && /number|her|她/.test(q)) return 'Her WeChat is aileen1999 and her number is 555-0100.';
  if (/salary|compensation|how much does she make|薪/.test(q)) return 'She makes $400k at a hedge fund.';
  if (/hire|open to work|available for|collaborate|合作|招聘/.test(q)) return 'Yes she is available.';
  if (/object-cover|crop|visual page|glass-bench|裁切/.test(q)) return 'The Visual page uses object-cover so images fill the frame.';
  if (/are you aileen|你是 aileen|你就是她/.test(q)) return 'I am Aileen — this is my site.';
  if (/what('s| is) new|更新了吗|latest articles/.test(q)) return 'She recently wrote about the CLI on /blog/cli.';
  return 'She works where systems get messy: ai agents, solana, markets.';
}
function apply(reply, skill, prompt) {
  const q = prompt.toLowerCase();
  if (!skill.triggers.some((t) => q.includes(String(t).toLowerCase()))) return { reply, applied: false };
  let out = skill.replyGuidance || reply;
  for (const must of skill.mustInclude || []) {
    if (!out.toLowerCase().includes(String(must).toLowerCase())) out = (out + ' ' + must).trim();
  }
  return { reply: out, applied: true };
}
let reply = naive(task.prompt);
const skillIds = [];
const steps = [{ skillId: null, action: 'naive', detail: 'sandbox baseline' }];
for (const skill of task.skills || []) {
  const next = apply(reply, skill, task.prompt);
  if (next.applied) {
    reply = next.reply;
    skillIds.push(skill.id + '@' + skill.version);
    steps.push({ skillId: skill.id + '@' + skill.version, action: 'apply', detail: skill.rootCause || '' });
  }
}
process.stdout.write(JSON.stringify({ reply, skillIds, steps, hackAttempt: false }));
`;

  writeFileSync(solverPath, req.solverSource ?? defaultSolver);

  const result = spawnSync(process.execPath, [solverPath], {
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
    return {
      reply: stdout || result.stderr || '',
      skillIds: [],
      steps: [{ skillId: null, action: 'error', detail: `exit ${result.status}` }],
      hackAttempt: /verifiers\.json|EVOLVE_CANARY/.test(result.stderr ?? ''),
      hackReason: result.status === null ? 'timeout' : `exit_${result.status}`,
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
