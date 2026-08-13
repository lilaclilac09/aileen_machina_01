'use client';

import Link from 'next/link';

const PEEK = ['/pate-glass.jpg', '/zine/clipping-desk.jpg', '/pate-clay.jpg'];

const DOORS = [
  { href: '/#visual', label: 'visual' },
  { href: '/blog/pate-de-verre', label: 'kiln' },
  { href: '/doors', label: 'rooms' },
];

export default function ArchiveDoorsNote() {
  return (
    <aside className="arc-doors" aria-labelledby="arc-doors-label">
      <Link
        href="/#visual"
        className="arc-doors-peek"
        aria-label="a peek into visual rooms"
      >
        <span className="arc-doors-peek-strip">
          {PEEK.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element -- peek strip needs intrinsic ratio; fill-crop would flatten it
            <img key={src} src={src} alt="" width={1100} height={1100} decoding="async" />
          ))}
        </span>
      </Link>
      <p className="arc-kicker" id="arc-doors-label">
        doors
      </p>
      <p className="arc-doors-intro">
        a small doorway into visual notes / fragments / rooms
      </p>
      <ul className="arc-doors-list">
        {DOORS.map((door) => (
          <li key={door.href}>
            <Link href={door.href}>{door.label}</Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
