'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

/** Must match `SESSION_LOADED_KEY` in `app/page.tsx` — skips boot screen on exit. */
const SESSION_LOADED_KEY = 'aileena_loaded_once';

/**
 * ← Home that exits the current view via client navigation.
 * Sets the homepage session flag so LoadingScreen does not remount/replay.
 */
export default function BackHomeLink({
  className,
  style,
  children = '← Home',
}: {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const router = useRouter();

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      window.sessionStorage.setItem(SESSION_LOADED_KEY, '1');
    } catch {
      /* sessionStorage blocked — still navigate */
    }
    // replace = exit, not stack another home entry (no back-to-archive loop)
    router.replace('/');
  };

  return (
    <Link href="/" className={className} style={style} onClick={onClick}>
      {children}
    </Link>
  );
}
