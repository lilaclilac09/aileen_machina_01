'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from './LanguageProvider';
import { t } from '../lib/translations';
import './rooms-footer.css';

/**
 * Every room's way out.
 *
 * `SiteLeftChrome` only ever offers ← Home, which made each room a dead end:
 * you could reach the book club from the desk but not the archive from the
 * book club. This is the one directory, printed at the foot of every room,
 * with the room you are standing in marked rather than linked.
 */
export default function RoomsFooter() {
  const { language } = useLanguage();
  const tx = t[language];
  const pathname = usePathname() || '/';

  const isHere = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="rooms-footer" aria-label={tx.roomsLabel}>
      <p className="rooms-footer__kicker">{tx.roomsLabel}</p>
      <ul className="rooms-footer__list">
        {tx.rooms.map((room) => {
          const here = isHere(room.href);
          const body = (
            <>
              <span className="rooms-footer__label">{room.label}</span>
              <span className="rooms-footer__hint">
                {here ? `${room.hint} · ${tx.roomsHere}` : room.hint}
              </span>
            </>
          );
          return (
            <li key={room.href}>
              {here ? (
                <span className="rooms-footer__room is-here" aria-current="page">
                  {body}
                </span>
              ) : (
                <Link href={room.href} className="rooms-footer__room">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
