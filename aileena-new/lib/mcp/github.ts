import { clip, redactSecrets } from '../computer/redact';
import type { McpCallResult, McpToolDesc } from './types';

const TOOLS: McpToolDesc[] = [
  { name: 'me', description: 'GET /user — who this token is' },
  { name: 'repo', description: 'GET /repos/{owner}/{repo}' },
  { name: 'pulls', description: 'GET /repos/{owner}/{repo}/pulls?state=open' },
  { name: 'issues', description: 'GET /repos/{owner}/{repo}/issues?state=open' },
  { name: 'contents', description: 'GET /repos/{owner}/{repo}/contents/{path} — read one file' },
];

const BLOCKED_CONTENT = /(^\.env|\.pem$|credentials|secrets?|id_rsa|id_ed25519|\.p12$|\.key$)/i;

export function githubTools(): McpToolDesc[] {
  return TOOLS;
}

export function githubToken(): string {
  return (
    (process.env.GITHUB_MCP_TOKEN || '').trim() ||
    (process.env.GITHUB_TOKEN || '').trim() ||
    (process.env.GH_TOKEN || '').trim()
  );
}

export function githubRepo(): string {
  const raw = (process.env.GITHUB_REPO || 'lilaclilac09/aileen_machina_01').trim();
  return /^[\w.-]+\/[\w.-]+$/.test(raw) ? raw : 'lilaclilac09/aileen_machina_01';
}

export function githubReady(): { ready: boolean; reason: string } {
  if (!githubToken()) return { ready: false, reason: 'missing GITHUB_TOKEN / GH_TOKEN / GITHUB_MCP_TOKEN' };
  return { ready: true, reason: `repo ${githubRepo()}` };
}

export function githubContentPath(raw: unknown): string | null {
  const p = String(raw || '')
    .trim()
    .replace(/^\/+/, '')
    .replaceAll('\\', '/');
  if (!p || p.length > 200 || p.includes('..') || p.includes('\0')) return null;
  if (BLOCKED_CONTENT.test(p) || p.split('/').some((part) => BLOCKED_CONTENT.test(part))) return null;
  return p;
}

function pickRepo(args: Record<string, unknown>): string {
  return typeof args.repo === 'string' && /^[\w.-]+\/[\w.-]+$/.test(args.repo) ? args.repo : githubRepo();
}

export async function callGithub(tool: string, args: Record<string, unknown>): Promise<McpCallResult> {
  const gate = githubReady();
  if (!gate.ready) {
    return { ok: false, app: 'github', tool, text: gate.reason, blocked: true };
  }
  const repo = pickRepo(args);
  let path = '';
  if (tool === 'me') path = '/user';
  else if (tool === 'repo') path = `/repos/${repo}`;
  else if (tool === 'pulls') path = `/repos/${repo}/pulls?state=open&per_page=10`;
  else if (tool === 'issues') path = `/repos/${repo}/issues?state=open&per_page=10`;
  else if (tool === 'contents') {
    const file = githubContentPath(args.path);
    if (!file) return { ok: false, app: 'github', tool, text: 'path not allowlisted', blocked: true };
    path = `/repos/${repo}/contents/${file}`;
  } else return { ok: false, app: 'github', tool, text: `unknown tool ${tool}` };

  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${githubToken()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'aileena-machina-mcp',
    },
    signal: AbortSignal.timeout(12_000),
  });
  const raw = await res.text();
  let text = raw;
  if (tool === 'contents' && res.ok) {
    try {
      const json = JSON.parse(raw) as unknown;
      if (Array.isArray(json)) {
        text = json
          .map((row) => {
            const item = row as { type?: string; name?: string; path?: string };
            return `${item.type || 'entry'} ${item.path || item.name || ''}`;
          })
          .slice(0, 40)
          .join('\n');
      } else if (json && typeof json === 'object') {
        const file = json as {
          type?: string;
          encoding?: string;
          content?: string;
          name?: string;
          path?: string;
        };
        if (file.type === 'file' && file.encoding === 'base64' && typeof file.content === 'string') {
          const decoded = Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8');
          text = `${file.path || file.name || fileName(path)}\n${decoded}`;
        }
      }
    } catch {
      /* keep raw */
    }
  }
  text = clip(redactSecrets(text), 4000);
  return {
    ok: res.ok,
    app: 'github',
    tool,
    text: res.ok ? text : `github ${res.status} ${text}`,
  };
}

function fileName(apiPath: string): string {
  const parts = apiPath.split('/');
  return parts[parts.length - 1] || 'file';
}
