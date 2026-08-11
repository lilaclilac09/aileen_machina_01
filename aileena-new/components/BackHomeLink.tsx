'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

/** Must match `SESSION_LOADED_KEY` in `app/page.tsx` — skips boot screen on exit. */
const SESSION_LOADED_KEY = 'aileena_loaded_once';

/**
 * Chrome back link. When `href` is `/`, sets session flag + replace so LoadingScreen
 * does not remount. Other targets use normal client navigation.
 */
export default function BackHomeLink({
  className,
  style,
  href = '/',
  children = '← Home',
}: {
  className?: string;
  style?: CSSProperties;
  href?: string;
  children?: ReactNode;
}) {
  const router = useRouter();
  const toHome = href === '/';

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!toHome) return;
    e.preventDefault();
    try {
      window.sessionStorage.setItem(SESSION_LOADED_KEY, '1');
    } catch {
      /* sessionStorage blocked — still navigate */
    }
    router.replace('/');
  };

  return (
    <Link href={href} className={className} style={style} onClick={toHome ? onClick : undefined}>
      {children}
    </Link>
  );
}

/** Path → chrome back target for Doors IA. */
export function chromeBackForPath(pathname: string): { href: string; label: string } | null {
  if (!pathname || pathname === '/') return null;

  // Doors directory → home
  if (pathname === '/doors') {
    return { href: '/', label: '← home' };
  }

  // Utility pages → home
  if (
    pathname === '/privacy' ||
    pathname === '/api-docs' ||
    pathname === '/unlock' ||
    pathname === '/support'
  ) {
    return { href: '/', label: '← home' };
  }

  // Tool children keep page-local ← Tools; chrome goes to doors (directory)
  // Tool index + audio-clipping + room hubs → doors
  const doorsHubs = new Set([
    '/sound',
    '/dispatch',
    '/updates',
    '/tools',
    '/works',
    '/prophecy',
    '/audio-clipping',
    '/blog/watch-listening-shelf',
    '/blog/pate-de-verre',
  ]);
  if (doorsHubs.has(pathname)) {
    return { href: '/doors', label: '← doors' };
  }

  // Nested tools → doors (Arcade also offers ← Tools)
  if (pathname.startsWith('/tools/')) {
    return { href: '/doors', label: '← doors' };
  }

  // Research → dispatch parent
  if (pathname === '/research' || pathname.startsWith('/research/')) {
    return { href: '/dispatch', label: '← dispatch' };
  }

  // Blog essays / explainers → dispatch (shelf + pate handled above)
  if (pathname.startsWith('/blog/')) {
    return { href: '/dispatch', label: '← dispatch' };
  }

  // Default subpage → doors
  return { href: '/doors', label: '← doors' };
}
