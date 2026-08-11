'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

export { chromeBackForPath, chromeInkForPath } from '../lib/doorsNav';

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
