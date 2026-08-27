import Link from 'next/link';
import './landing-marquee.css';

const NEWS = [
  { href: '/daily', label: 'two lines is open' },
  { href: '/sound', label: 'sound lab is learning to mix' },
  { href: '/updates', label: 'all knobs must have consequences' },
] as const;

/** Clickable news whisper on the cinematic opening. Not a banner. */
export default function LandingMarquee() {
  return (
    <nav className="landing-marquee" data-landing-marquee aria-label="site news">
      <ul className="landing-marquee__list">
        {NEWS.map((item, index) => (
          <li
            className="landing-marquee__item"
            data-active={index === 0 ? 'true' : undefined}
            key={`${item.href}:${item.label}`}
          >
            <Link className="landing-marquee__link" href={item.href}>
              <em>new →</em> {item.label}
              <span className="landing-marquee__cursor" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
