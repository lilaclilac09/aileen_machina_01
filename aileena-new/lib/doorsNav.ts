/**
 * Doors IA — chrome back targets + ink contrast.
 * Shared by SiteLeftChrome and scripts/verify-doors-nav.ts.
 */

/** Doors section hubs — chrome back → /doors. */
const DOORS_SECTION_HUBS = new Set([
  '/sound',
  '/dispatch',
  '/updates',
  '/tools',
  '/blog/watch-listening-shelf',
]);

/** Shelf detail pages — chrome back → Shelf hub. */
const SHELF_DETAIL = new Set([
  '/blog/semi-basics-review',
  '/blog/semi-watch-tpu-cpo',
]);

/** Metal & Pages detail (visual / glass / kiln) — chrome back → /updates. */
const METAL_DETAIL = new Set(['/blog/pate-de-verre']);

/** Utility / legal — chrome back → home. */
const HOME_UTIL = new Set(['/privacy', '/api-docs', '/unlock', '/support', '/inbox', '/council']);

/**
 * Path → chrome back target for Doors IA.
 *
 * home → (none)
 * doors → ← home
 * section hubs (DJ / Shelf / Metal & Pages / Dispatch / Tools) → ← doors
 * article/detail → parent section when known, else ← doors
 */
export function chromeBackForPath(pathname: string): { href: string; label: string } | null {
  if (!pathname || pathname === '/') return null;

  if (pathname === '/doors') {
    return { href: '/', label: '← home' };
  }

  if (HOME_UTIL.has(pathname)) {
    return { href: '/', label: '← home' };
  }

  if (DOORS_SECTION_HUBS.has(pathname)) {
    return { href: '/doors', label: '← doors' };
  }

  // Tool product pages + arcade children → Tools
  if (pathname === '/audio-clipping' || pathname.startsWith('/tools/')) {
    return { href: '/tools', label: '← tools' };
  }

  if (SHELF_DETAIL.has(pathname)) {
    return { href: '/blog/watch-listening-shelf', label: '← shelf' };
  }

  if (METAL_DETAIL.has(pathname)) {
    return { href: '/updates', label: '← metal & pages' };
  }

  // Research magazine issues live under Dispatch (/research redirects there)
  if (pathname.startsWith('/research/')) {
    return { href: '/dispatch', label: '← dispatch' };
  }

  // Blog essays / explainers → Dispatch (shelf + metal handled above)
  if (pathname.startsWith('/blog/')) {
    return { href: '/dispatch', label: '← dispatch' };
  }

  // works / prophecy / anything else under the site → doors directory
  return { href: '/doors', label: '← doors' };
}

/**
 * Light paper pages need ink chrome; dark rooms keep cream.
 */
export function chromeInkForPath(pathname: string): boolean {
  if (!pathname || pathname === '/') return false;
  const darkExact = new Set(['/sound', '/works', '/prophecy', '/unlock']);
  if (darkExact.has(pathname)) return false;
  if (pathname.startsWith('/research/')) return false;
  return true;
}
