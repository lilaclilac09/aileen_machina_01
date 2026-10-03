import { SURFACE_EDGES, SURFACE_NODES, surfaceById, surfaceIdForPath, type SurfaceNode } from './graph';

/** Hard cap. The model sees a path, not the graph. */
export const SITE_PATH_CHAR_CAP = 480;

const STOP = new Set([
  'where', 'what', 'when', 'how', 'the', 'and', 'for', 'you', 'your', 'open', 'show',
  'room', 'page', 'this', 'that', 'with', 'from', 'into', 'take', 'please', 'can',
  'does', 'did', 'are', 'was', 'get', 'find', 'goto', 'just', 'want', 'aileena',
]);

export type SiteStep = {
  label: string;
  href: string;
  name: string;
  to: string;
};

export type SurfaceHit = {
  id: string;
  name: string;
  href: string;
  score: number;
};

export function isSiteNavQuestion(q: string): boolean {
  const t = q.toLowerCase().trim();
  if (!t || t.length > 180) return false;
  if (/\b(say|wrote|write|claim|article says|essay)\b|她写|文章里|说了什么/.test(t)) return false;
  return (
    /\b(where is|where are|where can i|where do i|how do i (open|get|find|reach|go)|take me|go to|open the|show me the)\b/.test(t) ||
    /在哪|怎么去|怎么打开|带我|去哪|打开/.test(t)
  );
}

function tokens(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((tok) => tok.length >= 2 && !STOP.has(tok));
}

export function searchSurfaces(q: string, k = 3): SurfaceHit[] {
  const query = q.toLowerCase().trim();
  const toks = tokens(query);
  const ranked = SURFACE_NODES.map((node) => {
    const name = node.name.toLowerCase();
    const hay = `${node.id} ${name} ${node.description}`.toLowerCase();
    let score = 0;
    if (name.length > 1 && query.includes(name)) score += 6;
    for (const tok of toks) {
      if (name.includes(tok)) score += 4;
      else if (node.id.includes(tok)) score += 3;
      else if (hay.includes(tok)) score += 1;
    }
    return { id: node.id, name: node.name, href: node.href ?? '', score };
  })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return ranked.slice(0, k);
}

function hrefOf(node: SurfaceNode | undefined): string {
  if (!node?.href) return '';
  return node.href;
}

export function pathBetween(fromId: string, toId: string): SiteStep[] | null {
  if (!surfaceById(fromId) || !surfaceById(toId)) return null;
  if (fromId === toId) {
    const here = surfaceById(fromId)!;
    return [{ label: 'This room', href: hrefOf(here) || '/doors', name: here.name, to: here.id }];
  }
  const queue: string[] = [fromId];
  const prev = new Map<string, { id: string; label: string }>();
  const seen = new Set<string>([fromId]);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const edge of SURFACE_EDGES) {
      if (edge.from !== cur || edge.kind === 'close') continue;
      if (seen.has(edge.to)) continue;
      seen.add(edge.to);
      prev.set(edge.to, { id: cur, label: edge.triggerLabel });
      if (edge.to === toId) {
        const steps: SiteStep[] = [];
        let walk: string | undefined = toId;
        while (walk && walk !== fromId) {
          const via = prev.get(walk);
          const node = surfaceById(walk);
          if (!via || !node) break;
          steps.push({ label: via.label, href: hrefOf(node), name: node.name, to: node.id });
          walk = via.id;
        }
        steps.reverse();
        return steps.slice(0, 6);
      }
      queue.push(edge.to);
    }
  }
  return null;
}

export function planSitePath(question: string, pathname: string): SiteStep[] | null {
  if (!isSiteNavQuestion(question)) return null;
  const hit = searchSurfaces(question, 1)[0];
  if (!hit || hit.score < 2) return null;
  return pathBetween(surfaceIdForPath(pathname), hit.id);
}

export function formatSiteSteps(steps: SiteStep[]): string {
  const lines = steps.map((step, i) => {
    const href = step.href.startsWith('http') ? step.href : `https://aileena.xyz${step.href || '/doors'}`;
    return `${i + 1}. ${step.label} → ${href}`;
  });
  const text = lines.join('\n');
  return text.length > SITE_PATH_CHAR_CAP ? `${text.slice(0, SITE_PATH_CHAR_CAP - 1)}…` : text;
}

export function siteMapTail(question: string, pathname: string): string {
  const steps = planSitePath(question, pathname);
  if (!steps?.length) {
    return 'No matching room. Offer https://aileena.xyz/doors. Do not invent a door.';
  }
  return `Speak only this path. Do not invent a door.\n${formatSiteSteps(steps)}`;
}
