'use client';

import { usePathname } from 'next/navigation';
import BackHomeLink from './BackHomeLink';

/**
 * Fixed top-left chrome: machina avatar (+ optional ← Home).
 * Pages must NOT render their own ← Home in the same corner — that was
 * the overlap. Use `site-top-nav` / substack-nav padding for the rest.
 */
export default function SiteLeftChrome({
  onOpenConsole,
  consoleOpen,
}: {
  onOpenConsole: () => void;
  consoleOpen: boolean;
}) {
  const pathname = usePathname() || '/';
  // Home only off the root — never compete with the avatar on `/`.
  const showHome = pathname !== '/';

  return (
    <div
      className={`site-left-chrome fixed top-3 left-3 sm:top-4 sm:left-4 z-[60] flex items-center gap-4 sm:gap-5 transition-opacity duration-200 ${
        consoleOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <button
        type="button"
        onClick={onOpenConsole}
        aria-label="Open Aileena console · machina"
        title="machina"
        className="group site-machina-launcher shrink-0"
      >
        <span className="relative inline-block">
          <span
            aria-hidden
            className="block h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-no-repeat ring-1 ring-[#00a89d]/40 transition-all duration-200 group-hover:ring-[#00a89d]/80 group-hover:scale-[1.05]"
            style={{
              backgroundImage: "url('/bg_pic/03.jpeg')",
              backgroundPosition: '18% 5%',
              backgroundSize: '175%',
            }}
          />
          <span aria-hidden className="agent-scan pointer-events-none absolute inset-0 rounded-full overflow-hidden" />
          <span
            aria-hidden
            className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-[#00a89d] shadow-[0_0_6px_rgba(0,168,157,0.85)] animate-pulse ring-2 ring-[#fffdf8]"
          />
        </span>
      </button>

      {showHome ? (
        <BackHomeLink
          className="site-chrome-home font-mono text-[0.62rem] sm:text-[0.68rem] tracking-[0.18em] uppercase text-[#fffdf8]/70 hover:text-[#fffdf8] transition-colors select-none"
          style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
        />
      ) : null}
    </div>
  );
}
