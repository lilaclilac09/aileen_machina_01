import { SYSTEM_PROMPT } from '../agentContext';
import { TOOL_DEFINITIONS } from '../tools/registry';

/** Public project index for agent callers. Built from public site copy only. */
export type PublicProject = {
  id: string;
  title: string;
  stack: string;
  summary: string;
  links: string[];
  kind: 'project' | 'tool';
};

const SITE = 'https://aileena.xyz';

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function absolute(u: string): string {
  if (/^https?:\/\//.test(u)) return u;
  if (u.startsWith('/')) return SITE + u;
  return `https://${u}`;
}

function selectedWork(): PublicProject[] {
  const m = SYSTEM_PROMPT.match(/# Selected work\n([\s\S]*?)\n\n#/);
  if (!m) return [];
  const out: PublicProject[] = [];
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^\d+\.\s+(.+?)\s+—\s+(.+?)\.\s+(.*)$/);
    if (!mm) continue;
    const [, title, stack, rest] = mm;
    const links = Array.from(rest.matchAll(/(https?:\/\/[^\s·]+|github\.com\/[^\s·]+)/g), (x) => absolute(x[1].replace(/[.,]$/, '')));
    const summary = rest
      .replace(/(https?:\/\/[^\s·]+|github\.com\/[^\s·]+)/g, '')
      .replace(/[·:\s]+$/g, '')
      .replace(/\s+·\s*/g, ' ')
      .trim();
    out.push({ id: slug(title), title, stack, summary, links, kind: 'project' });
  }
  return out;
}

function tools(): PublicProject[] {
  return TOOL_DEFINITIONS.filter((t) => t.status !== 'paused').map((t) => ({
    id: t.slug,
    title: t.title,
    stack: t.tag,
    summary: `${t.body} ${t.verdict}`.trim(),
    links: [t.liveUrl, t.href].filter((u): u is string => Boolean(u)).map(absolute),
    kind: 'tool' as const,
  }));
}

let cache: PublicProject[] | null = null;
export function publicProjects(): PublicProject[] {
  if (cache) return cache;
  const byId = new Map<string, PublicProject>();
  for (const p of [...selectedWork(), ...tools()]) {
    const prev = byId.get(p.id);
    if (!prev) byId.set(p.id, p);
    else byId.set(p.id, { ...prev, links: Array.from(new Set([...prev.links, ...p.links])) });
  }
  cache = Array.from(byId.values());
  return cache;
}

export function lookupProjects(query: string, limit = 5): PublicProject[] {
  const q = query.toLowerCase().trim();
  const all = publicProjects();
  if (!q || q === '*' || q === 'all') return all.slice(0, Math.max(limit, 20));
  const terms = q.split(/[^a-z0-9\u4e00-\u9fff]+/).filter((t) => t.length > 1);
  const scored = all
    .map((p) => {
      const hay = `${p.id} ${p.title} ${p.stack} ${p.summary}`.toLowerCase();
      let score = 0;
      if (p.id === slug(q) || p.title.toLowerCase() === q) score += 10;
      for (const t of terms) {
        if (p.title.toLowerCase().includes(t) || p.id.includes(t)) score += 3;
        else if (hay.includes(t)) score += 1;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.p);
}
