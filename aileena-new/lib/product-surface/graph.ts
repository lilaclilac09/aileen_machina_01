import { TOOL_DEFINITIONS } from '../tools/registry';

/**
 * Product-surface graph for aileena.xyz.
 * A node is a room you can occupy. A button is an edge, not a node.
 * Kept small on purpose: the site agent receives a path, never this file.
 */

export type SurfaceKind = 'page' | 'modal' | 'sheet' | 'drawer' | 'shell' | 'region';
export type EdgeKind = 'click' | 'link' | 'submit' | 'query' | 'redirect' | 'open' | 'close' | 'view';

export type SurfaceNode = {
  id: string;
  name: string;
  kind: SurfaceKind;
  parentId?: string;
  description: string;
  href?: string;
  components: { path: string; exportName: string }[];
};

export type SurfaceEdge = {
  from: string;
  to: string;
  kind: EdgeKind;
  triggerLabel: string;
};

type Room = {
  id: string;
  name: string;
  href: string;
  description: string;
  path: string;
};

const ROOMS: Room[] = [
  { id: 'sound', name: 'DJ', href: '/sound', description: 'Sound decks DJ 声音 音乐', path: 'app/sound/page.tsx' },
  { id: 'daily', name: 'Daily', href: '/daily', description: 'Daily notes 每日', path: 'app/daily/page.tsx' },
  { id: 'shelf', name: 'Shelf', href: '/blog/watch-listening-shelf', description: 'Films podcasts shelf 书架 电影', path: 'app/blog/watch-listening-shelf/page.tsx' },
  { id: 'night', name: 'Night Desk', href: '/night', description: 'Late desk night 夜间', path: 'app/night/page.tsx' },
  { id: 'updates', name: 'Metal & Pages', href: '/updates', description: 'Book club visual metal pages 金属', path: 'app/updates/page.tsx' },
  { id: 'dispatch', name: 'Dispatch', href: '/dispatch', description: 'Essays news dispatch 文章', path: 'app/dispatch/page.tsx' },
  { id: 'tools', name: 'Tools', href: '/tools', description: 'Small utilities tools 工具', path: 'app/tools/page.tsx' },
];

function page(room: Room, parentId?: string): SurfaceNode {
  return {
    id: room.id,
    name: room.name,
    kind: 'page',
    parentId,
    description: room.description,
    href: room.href,
    components: [{ path: room.path, exportName: 'default' }],
  };
}

const toolRooms: Room[] = TOOL_DEFINITIONS.filter((tool) => tool.status !== 'paused').map((tool) => ({
  id: `tools--${tool.slug}`,
  name: tool.title,
  href: tool.href,
  description: `${tool.title} ${tool.tag} ${tool.body}`,
  path: 'lib/tools/registry.ts',
}));

const reviewNodes: SurfaceNode[] = [
  {
    id: 'reviews-door',
    name: 'Unlock',
    kind: 'page',
    description: 'Owner review door KeyShield 评审 审查. No report in the public HTML.',
    href: '/reviews',
    components: [{ path: 'app/reviews/page.tsx', exportName: 'ReviewsPage' }],
  },
  {
    id: 'reviews-index',
    name: 'All reviews',
    kind: 'region',
    parentId: 'reviews-door',
    description: 'Owner list of saved reviews',
    href: '/reviews',
    components: [{ path: 'components/reviews/JevDashboard.tsx', exportName: 'JevDashboard' }],
  },
  {
    id: 'reviews-report',
    name: 'Report',
    kind: 'region',
    parentId: 'reviews-door',
    description: 'Open review funnel matrix findings',
    href: '/reviews',
    components: [{ path: 'components/reviews/JevDashboard.tsx', exportName: 'ReportBody' }],
  },
  {
    id: 'reviews-report--funnel',
    name: 'Funnel',
    kind: 'region',
    parentId: 'reviews-report',
    description: 'Review funnel counts',
    href: '/reviews',
    components: [{ path: 'components/reviews/JevDashboard.tsx', exportName: 'ReportBody' }],
  },
  {
    id: 'reviews-report--matrix',
    name: 'Matrix',
    kind: 'region',
    parentId: 'reviews-report',
    description: 'Risk screening matrix',
    href: '/reviews',
    components: [{ path: 'components/reviews/JevDashboard.tsx', exportName: 'ReportBody' }],
  },
  {
    id: 'reviews-report--findings',
    name: 'Findings',
    kind: 'region',
    parentId: 'reviews-report',
    description: 'Findings table',
    href: '/reviews',
    components: [{ path: 'components/reviews/JevDashboard.tsx', exportName: 'ReportBody' }],
  },
];

export const SURFACE_NODES: SurfaceNode[] = [
  page({
    id: 'home',
    name: 'Home',
    href: '/',
    description: 'Cinematic opening and the doors hub 首页',
    path: 'app/page.tsx',
  }),
  page({
    id: 'doors',
    name: 'Doors',
    href: '/doors',
    description: 'Directory of rooms 门 目录',
    path: 'app/doors/page.tsx',
  }),
  ...ROOMS.map((room) => page(room)),
  ...toolRooms.map((room) => page(room, 'tools')),
  {
    id: 'console',
    name: 'Console',
    kind: 'shell',
    description: 'Site agent dialog. Avatar opens it. 控制台',
    components: [{ path: 'components/AgentChat.tsx', exportName: 'default' }],
  },
  ...reviewNodes,
];

function link(from: string, to: string, triggerLabel: string): SurfaceEdge {
  return { from, to, kind: 'link', triggerLabel };
}

const roomEdges: SurfaceEdge[] = ROOMS.flatMap((room) => [
  link('home', room.id, room.name),
  link('doors', room.id, room.name),
  link(room.id, 'doors', '← doors'),
]);

const toolEdges: SurfaceEdge[] = toolRooms.flatMap((room) => [
  link('tools', room.id, room.name),
  link(room.id, 'tools', '← tools'),
]);

export const SURFACE_EDGES: SurfaceEdge[] = [
  link('home', 'doors', 'Doors'),
  ...roomEdges,
  ...toolEdges,
  { from: 'home', to: 'console', kind: 'click', triggerLabel: 'Open the console' },
  { from: 'doors', to: 'console', kind: 'click', triggerLabel: 'Open the console' },
  link('doors', 'reviews-door', 'Open /reviews, then KeyShield'),
  { from: 'reviews-door', to: 'reviews-index', kind: 'click', triggerLabel: 'KeyShield on this device' },
  { from: 'reviews-index', to: 'reviews-report', kind: 'click', triggerLabel: 'Click a review name' },
  { from: 'reviews-report', to: 'reviews-report--funnel', kind: 'view', triggerLabel: 'Report opens this region' },
  { from: 'reviews-report', to: 'reviews-report--matrix', kind: 'view', triggerLabel: 'Report opens this region' },
  { from: 'reviews-report', to: 'reviews-report--findings', kind: 'view', triggerLabel: 'Report opens this region' },
];

const byId = new Map(SURFACE_NODES.map((node) => [node.id, node]));

export function surfaceById(id: string): SurfaceNode | undefined {
  return byId.get(id);
}

export function surfaceIdForPath(pathname: string): string {
  const path = (pathname.split('?')[0] || '/').replace(/\/$/, '') || '/';
  if (path === '/') return 'home';
  const exact = SURFACE_NODES.find((node) => node.href === path);
  if (exact) return exact.id;
  if (path.startsWith('/tools/')) {
    const slug = path.slice('/tools/'.length).split('/')[0];
    if (slug && byId.has(`tools--${slug}`)) return `tools--${slug}`;
    return 'tools';
  }
  if (path === '/reviews') return 'reviews-door';
  return 'doors';
}

export type ReviewsFlowStep = {
  id: string;
  name: string;
  kind: string;
  trigger: string;
  detail: string;
  file: string;
};

export function reviewsFlow(): { steps: ReviewsFlowStep[]; regions: Array<{ id: string; name: string; trigger: string }> } {
  const ids = ['reviews-door', 'reviews-index', 'reviews-report'];
  const steps = ids.map((id) => {
    const node = byId.get(id)!;
    const leaving = SURFACE_EDGES.find((edge) => edge.from === id);
    return {
      id,
      name: node.name,
      kind: node.kind,
      trigger: leaving?.triggerLabel ?? '',
      detail: node.description,
      file: node.components[0]?.path ?? '',
    };
  });
  const regions = SURFACE_NODES.filter((node) => node.parentId === 'reviews-report').map((node) => ({
    id: node.id,
    name: node.name,
    trigger: SURFACE_EDGES.find((edge) => edge.to === node.id)?.triggerLabel ?? '',
  }));
  return { steps, regions };
}
