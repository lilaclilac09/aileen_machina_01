'use client';

import Link from 'next/link';

export type ArchiveRoom = 'club' | 'shelf' | 'essays';

const LINKS: { id: ArchiveRoom; href: string; label: string }[] = [
  { id: 'club', href: '/updates', label: 'book club' },
  { id: 'shelf', href: '/blog/watch-listening-shelf', label: 'watch/listen' },
  { id: 'essays', href: '/dispatch', label: 'essays' },
];

export default function ArchiveNav({ current }: { current: ArchiveRoom }) {
  return (
    <header className="arc-nav site-top-nav">
      <nav className="arc-nav-links" aria-label="reading archive">
        {LINKS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={item.id === current ? 'arc-nav-link is-here' : 'arc-nav-link'}
            aria-current={item.id === current ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
