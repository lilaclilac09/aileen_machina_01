'use client';
import { useEffect } from 'react';

/**
 * Article pages sit under a site shell that locks html/body scroll.
 * Unlock document scroll for long posts, then honor #hash deep-links
 * (native hash scroll often races the unlock / overflow container).
 */
export default function ScrollUnlock() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlHeight = html.style.height;
    const prevBodyHeight = body.style.height;

    html.style.overflow = 'auto';
    html.style.height = 'auto';
    body.style.overflow = 'auto';
    body.style.height = 'auto';

    const scrollToHash = () => {
      const id = decodeURIComponent(window.location.hash.replace(/^#/, ''));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
    };

    // Native hash scroll often fires before unlock; re-run after paint.
    requestAnimationFrame(() => {
      scrollToHash();
      window.setTimeout(scrollToHash, 40);
    });
    window.addEventListener('hashchange', scrollToHash);

    return () => {
      window.removeEventListener('hashchange', scrollToHash);
      html.style.overflow = prevHtmlOverflow;
      html.style.height = prevHtmlHeight;
      body.style.overflow = prevBodyOverflow;
      body.style.height = prevBodyHeight;
    };
  }, []);

  return null;
}
