'use client';

import './landing-marquee.css';

const MARQUEE = [
  'vol. 01 two lines is open',
  'sound lab is learning to mix',
  'all knobs must have consequences',
];

/** Compact site-news ticker on the existing cinematic opening. Not a landing rewrite. */
export default function LandingMarquee() {
  const marqueeLoop = [...MARQUEE, ...MARQUEE, ...MARQUEE];

  return (
    <div className="landing-marquee" data-landing-marquee aria-label="site news">
      <span className="landing-marquee__label">new</span>
      <div className="landing-marquee__window">
        <div className="landing-marquee__track">
          {marqueeLoop.map((item, i) => (
            <span className="landing-marquee__item" key={`${item}-${i}`}>
              <em>new →</em> {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
