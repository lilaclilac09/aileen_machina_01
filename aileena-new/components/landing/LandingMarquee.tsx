import './landing-marquee.css';

const NEWS = [
  'vol. 01 two lines is open',
  'sound lab is learning to mix',
  'all knobs must have consequences',
];

/** Static site-news strip on the cinematic opening. Not a scrolling marquee. */
export default function LandingMarquee() {
  return (
    <div className="landing-marquee" data-landing-marquee aria-label="site news">
      <ul className="landing-marquee__list">
        {NEWS.map((item) => (
          <li className="landing-marquee__item" key={item}>
            <em>new →</em> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
