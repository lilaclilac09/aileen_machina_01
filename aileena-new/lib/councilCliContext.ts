/**
 * Local council CLI helpers: env load, owner gate, redaction, repo context.
 * No HTTP. Never print secret values.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const CLI_MODE_ALIASES = {
  strategy: 'strategy',
  negotiation: 'negotiation',
  site: 'product',
  product: 'product',
  pr: 'review',
  review: 'review',
  vent: 'vent',
  writing: 'editor',
  editor: 'editor',
} as const;

export type CliModeName = keyof typeof CLI_MODE_ALIASES;

export function isCliModeName(value: string): value is CliModeName {
  return value in CLI_MODE_ALIASES;
}

export function loadEnvLocal(cwd = process.cwd()): void {
  const path = join(cwd, '.env.local');
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (process.env[key]) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

export function assertCouncilCliAllowed(): void {
  if (process.env.VERCEL) {
    throw new Error('Council CLI is local-only. Do not run it on Vercel.');
  }
  if (!process.env.OWNER_KEY?.trim()) {
    throw new Error(
      'Council CLI is owner-only. Set OWNER_KEY in aileena-new/.env.local (same secret as /api/auth/owner).',
    );
  }
}

export function redactSecrets(text: string): string {
  let out = text.replace(
    /\b(sk-[a-zA-Z0-9_-]{8,}|gsk_[a-zA-Z0-9]+|re_[a-zA-Z0-9]+)\b/g,
    '[redacted-key]',
  );
  out = out.replace(/\bBearer\s+\S+/gi, 'Bearer [redacted]');
  out = out.replace(
    /\b([A-Za-z_]*(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD))\s*[:=]\s*\S+/gi,
    '$1=[redacted]',
  );
  return out;
}

function git(args: string[], cwd: string): string {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 1024,
    }).trim();
  } catch {
    return '';
  }
}

function excerptFile(path: string, maxChars: number): string {
  if (!existsSync(path)) return `(missing ${path})`;
  const raw = readFileSync(path, 'utf8');
  const sliced = raw.length > maxChars ? `${raw.slice(0, maxChars)}\n…[truncated]` : raw;
  return redactSecrets(sliced);
}

const ENV_NAME_PROBE = [
  'OWNER_KEY',
  'DEEPSEEK_API_KEY',
  'AGENT_API_KEY',
  'AGENT_FALLBACK_API_KEY',
  'AGENT_FALLBACK_BASE_URL',
  'RESEND_API_KEY',
  'CONTACT_TO',
  'CONTACT_TO_EMAIL',
  'LEAD_INBOX',
  'AUTH_SECRET',
  'CHAT_QUOTA_SECRET',
  'PRIVATE_DATA_ENCRYPTION_KEY',
] as const;

export function envNamesPresent(): string[] {
  return ENV_NAME_PROBE.filter((name) => Boolean(process.env[name]?.trim()));
}

export function gitRoot(cwd = process.cwd()): string {
  return git(['rev-parse', '--show-toplevel'], cwd) || cwd;
}

export type RepoContext = {
  branch: string;
  status: string;
  diffStat: string;
  diffExcerpt: string;
  scripts: string[];
  envNames: string[];
  pr: string;
  agentsExcerpt: string;
  qaExcerpt: string;
};

export function collectRepoContext(opts?: { noContext?: boolean; cwd?: string }): RepoContext {
  const cwd = opts?.cwd ?? process.cwd();
  const root = gitRoot(cwd);
  const pkgPath = join(cwd, 'package.json');
  let scripts: string[] = [];
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { scripts?: Record<string, string> };
    scripts = Object.keys(pkg.scripts ?? {});
  } catch {
    scripts = [];
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], root) || '(unknown)';
  const status = git(['status', '--short', '--branch'], root);
  const diffStat = git(
    ['diff', '--stat', 'HEAD', '--', '.', ':(exclude).env', ':(exclude).env.*'],
    root,
  );
  const diffRaw = git(
    ['diff', 'HEAD', '--', '.', ':(exclude).env', ':(exclude).env.*', ':(exclude)**/.env*'],
    root,
  );
  const truncated = diffRaw.length > 8000;
  const diffExcerpt = `${redactSecrets(diffRaw).slice(0, 8000)}${truncated ? '\n…[diff truncated]' : ''}`;

  let pr = '';
  try {
    const raw = execFileSync('gh', ['pr', 'view', '--json', 'number,title,url'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const parsed = JSON.parse(raw) as { number?: number; title?: string; url?: string };
    pr = parsed.number ? `#${parsed.number} ${parsed.title ?? ''} ${parsed.url ?? ''}`.trim() : '';
  } catch {
    pr = '(no current-branch PR, or gh unavailable)';
  }

  if (opts?.noContext) {
    return {
      branch,
      status: '(omitted --no-context)',
      diffStat: '',
      diffExcerpt: '',
      scripts,
      envNames: envNamesPresent(),
      pr,
      agentsExcerpt: '',
      qaExcerpt: '',
    };
  }

  return {
    branch,
    status: redactSecrets(status).slice(0, 2000),
    diffStat: redactSecrets(diffStat).slice(0, 2000),
    diffExcerpt,
    scripts,
    envNames: envNamesPresent(),
    pr: redactSecrets(pr),
    agentsExcerpt: excerptFile(join(root, 'AGENTS.md'), 1800),
    qaExcerpt: excerptFile(join(root, 'QA.md'), 1600),
  };
}

export function formatRepoContext(ctx: RepoContext): string {
  return [
    `branch: ${ctx.branch}`,
    `pr: ${ctx.pr || '(none)'}`,
    `env names set (values omitted): ${ctx.envNames.join(', ') || '(none of the probed names)'}`,
    `package scripts: ${ctx.scripts.join(', ')}`,
    '',
    '## git status',
    ctx.status || '(clean)',
    '',
    '## git diff --stat',
    ctx.diffStat || '(no diff)',
    '',
    '## git diff excerpt',
    ctx.diffExcerpt || '(no diff)',
    ctx.agentsExcerpt ? `\n## AGENTS.md excerpt\n${ctx.agentsExcerpt}` : '',
    ctx.qaExcerpt ? `\n## QA.md excerpt\n${ctx.qaExcerpt}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
