/**
 * Aggregates every notes category for the redesigned /dispatch page.
 *
 * Every category sources only Aileen's own articles via translations.ts.
 * Within a category, items are grouped by theme via a slug-keyed table —
 * the renderer then emits a small heading for each theme in order.
 *
 * To add a new article: drop it into translations.ts as you would for any
 * post. To slot it under a theme, add the slug → theme mapping below.
 * Unmapped articles fall into "Other" (still rendered, just at the end).
 */

import type { NoteItem, NotesCategory } from './types';
import { t, type Language } from '../translations';

type Post = { title: string; href: string; date: string };

const SLUG_TO_THEME: Record<string, string> = {
  // ── Dispatch ────────────────────────────────────────────────
  wire: 'On-chain infrastructure',
  rpc: 'On-chain infrastructure',
  'shred-economy': 'On-chain infrastructure',
  'validator-clients': 'On-chain infrastructure',
  doublezero: 'On-chain infrastructure',
  'reading-solana': 'On-chain infrastructure',
  'instant-inference': 'On-chain infrastructure',

  clob: 'MEV & markets',
  'cex-dex-arb': 'MEV & markets',
  'cex-dex-dashboard': 'MEV & markets',
  'prop-amm-dict': 'MEV & markets',
  'humidifi-decoded': 'MEV & markets',

  robots: 'Agents & robotics',
  centaur: 'Agents & robotics',
  cli: 'Agents & robotics',

  'zcash-fpga': 'Privacy',
  'zec-arbitrage': 'Privacy',

  // ── Investing ───────────────────────────────────────────────
  'ai-pcb': 'AI hardware',
  broadcom: 'AI hardware',
  marvell: 'AI hardware',
  cpo: 'AI hardware',
  'ai-cooling': 'AI hardware',
  'ai-hardware-scarcity': 'AI hardware',
  'let-there-be-light': 'AI hardware',
  'nokia-dci': 'AI hardware',

  'nvidia-flywheel': 'Capital flywheels',
  'dell-nvidia-flywheel': 'Capital flywheels',

  'tech-sales': 'Sales & channels',
};

// Theme display order per rail. A theme not listed for a rail falls back
// to the end (under "Other") so new articles always render somewhere.
const THEME_ORDER: Record<string, string[]> = {
  dispatch: [
    'On-chain infrastructure',
    'MEV & markets',
    'Agents & robotics',
    'Privacy',
  ],
  investing: ['AI hardware', 'Capital flywheels', 'Sales & channels'],
  perspective: [], // flat — only three essays, themes would be theatre
};

function postsToItems(posts: readonly Post[], railSlug: string): NoteItem[] {
  const themeOrder = THEME_ORDER[railSlug] ?? [];
  const items = [...posts].reverse().map((post) => {
    const slug =
      post.href.replace(/^\/blog\//, '') || post.title.toLowerCase().replace(/\s+/g, '-');
    const theme = themeOrder.length > 0 ? (SLUG_TO_THEME[slug] ?? 'Other') : undefined;
    return {
      id: slug,
      title: post.title,
      url: post.href,
      theme,
    };
  });

  // Stable sort by theme priority so the renderer can group them as-is.
  // Within a theme, reverse-chrono is preserved from the reverse() above.
  if (themeOrder.length === 0) return items;
  return items.slice().sort((a, b) => {
    const ai = a.theme ? themeOrder.indexOf(a.theme) : -1;
    const bi = b.theme ? themeOrder.indexOf(b.theme) : -1;
    const aSort = ai === -1 ? themeOrder.length : ai;
    const bSort = bi === -1 ? themeOrder.length : bi;
    return aSort - bSort;
  });
}

export function getCategories(language: Language): NotesCategory[] {
  const tx = t[language];
  return [
    { slug: 'dispatch', label: 'Dispatch', items: postsToItems(tx.blog.researchDispatch.posts, 'dispatch') },
    { slug: 'investing', label: 'Investing', items: postsToItems(tx.blog.investing.posts, 'investing') },
    { slug: 'perspective', label: 'Perspective', items: postsToItems(tx.blog.womanInTech.posts, 'perspective') },
  ];
}
