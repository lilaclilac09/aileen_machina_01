/**
 * Code-mode guardrails. These are enforced in code, not in the prompt: repo
 * content is untrusted, so nothing a file says can widen what the tools do.
 *
 * - Paths: relative, normalized, no `..`, inside the allowlist, never on the
 *   denylist (env files, keys, secrets, .git, CI workflows unless allowed).
 * - Budgets per turn: model steps, files changed, bytes written, bytes read.
 */

export type CodeLimits = {
  maxSteps: number;
  maxFiles: number;
  maxFileBytes: number;
  maxWriteBytes: number;
  maxReadBytes: number;
  maxListEntries: number;
};

export const DEFAULT_LIMITS: CodeLimits = {
  maxSteps: 16,
  maxFiles: 8,
  maxFileBytes: 120_000,
  maxWriteBytes: 250_000,
  maxReadBytes: 600_000,
  maxListEntries: 400,
};

export type CodePolicy = {
  /** Path prefixes the agent may touch. Empty = whole repo (minus the denylist). */
  allow: string[];
  allowWorkflows: boolean;
  limits: CodeLimits;
};

const DENY: RegExp[] = [
  /(^|\/)\.env($|[./_-])/i, // .env, .env.local, .env.production …
  /(^|\/)\.dev\.vars$/i,
  /\.(pem|key|p12|pfx|keystore|jks|crt|cer|der|asc|gpg)$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/i,
  /(^|\/)\.(npmrc|netrc|pypirc|htpasswd)$/i,
  /(^|\/)secrets?($|[./_-])/i,
  /(^|\/)credentials?($|[./_-])/i,
  /(^|\/)service[-_]?account.*\.json$/i,
  /(^|\/)\.git($|\/)/,
  /(^|\/)\.vercel($|\/)/,
  /(^|\/)\.ssh($|\/)/,
];
const WORKFLOWS = /^\.github\/workflows\//;

/** Normalize a model-supplied path; null when it is not a safe repo-relative path. */
export function normalizePath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  let p = raw.trim().replace(/^\.\/+/, '');
  if (!p || p.length > 300) return null;
  if (/[\\\0]/.test(p) || p.startsWith('/') || /^[a-z]:/i.test(p)) return null;
  p = p.replace(/\/+/g, '/').replace(/\/$/, '');
  const parts = p.split('/');
  if (parts.some((s) => s === '..' || s === '.' || s === '')) return null;
  return p;
}

export function deniedReason(path: string, policy: CodePolicy): string | null {
  if (DENY.some((re) => re.test(path))) return 'protected path (secrets, keys, env files and .git are off-limits)';
  if (!policy.allowWorkflows && WORKFLOWS.test(path)) return 'CI workflows are off-limits in code mode';
  if (policy.allow.length && !policy.allow.some((a) => path === a.replace(/\/$/, '') || path.startsWith(a.replace(/\/?$/, '/')))) {
    return `outside the allowed paths (${policy.allow.join(', ')})`;
  }
  return null;
}

/** Resolve a path or explain why not. Directory listings may use '' for the root. */
export function checkPath(raw: unknown, policy: CodePolicy, opts: { allowRoot?: boolean } = {}): { ok: true; path: string } | { ok: false; error: string } {
  if (opts.allowRoot && (raw === undefined || raw === '' || raw === '.')) return { ok: true, path: '' };
  const path = normalizePath(raw);
  if (!path) return { ok: false, error: 'invalid path: use a relative path inside the repo' };
  const why = deniedReason(path, policy);
  return why ? { ok: false, error: `refused: ${path} is ${why}` } : { ok: true, path };
}

function intEnv(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Owner policy from env: AGENT_CODE_PATHS (comma prefixes), AGENT_CODE_ALLOW_WORKFLOWS=1, AGENT_CODE_MAX_*. */
export function ownerPolicy(): CodePolicy {
  return {
    allow: (process.env.AGENT_CODE_PATHS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    allowWorkflows: process.env.AGENT_CODE_ALLOW_WORKFLOWS === '1',
    limits: {
      ...DEFAULT_LIMITS,
      maxSteps: intEnv('AGENT_CODE_MAX_STEPS', DEFAULT_LIMITS.maxSteps),
      maxFiles: intEnv('AGENT_CODE_MAX_FILES', DEFAULT_LIMITS.maxFiles),
      maxWriteBytes: intEnv('AGENT_CODE_MAX_BYTES', DEFAULT_LIMITS.maxWriteBytes),
    },
  };
}
