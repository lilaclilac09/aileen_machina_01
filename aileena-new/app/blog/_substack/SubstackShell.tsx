'use client';
import Link from 'next/link';
import ScrollUnlock from '../ScrollUnlock';
import ArticleNarration from '../../../components/ArticleNarration';
import ArticleModeMemory, { setArticleMode } from './ArticleModeMemory';
import './substack.css';

const DOCUMENTARY_RECS = [
  {
    title: 'Joan Didion: The Center Will Not Hold',
    year: '2018',
    label: 'writer / witness',
    href: 'https://www.rottentomatoes.com/m/joan_didion_the_center_will_not_hold',
    image:
      'https://resizing.flixster.com/onSFETOELTXATdk56VRhXRScAvA=/206x305/v2/https://resizing.flixster.com/JbJYntMfetJO6X_4lj7ZrJdwmn4=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2U5ZTQ5ODMzLWFiNGUtNGM1Ny1iNjk3LTkyNzI0YmFiZDEwMy53ZWJw',
  },
  {
    title: 'Exhibition on Screen: David Hockney RA',
    year: '2017',
    label: 'exhibition film',
    href: 'https://en.wikipedia.org/wiki/Exhibition_on_Screen',
    image:
      'https://d7hftxdivxxvm.cloudfront.net/?height=800&quality=80&resize_to=fit&src=https%3A%2F%2Fd32dm0rphc51dk.cloudfront.net%2FxVvYx_HSwpadXmaJ91XLWQ%2Fmain.jpg&width=535',
  },
  {
    title: 'A Bigger Splash',
    year: '1973',
    label: 'Hockney / pool',
    href: 'https://en.wikipedia.org/wiki/A_Bigger_Splash_(1973_film)',
    image: 'https://www.ecartelera.com/carteles/10100/10114/004.jpg',
  },
];

export interface SubstackShellProps {
  date: string;
  category?: string;
  tags?: string;
  title: React.ReactNode;
  dek: React.ReactNode;
  children: React.ReactNode;
  isDE?: boolean;
  explainerHref?: string;
}

export default function SubstackShell({
  date,
  category,
  tags,
  title,
  dek,
  children,
  isDE = false,
  explainerHref,
}: SubstackShellProps) {
  return (
    <div className="substack-article">
      <ScrollUnlock />
      {explainerHref ? (
        <ArticleModeMemory currentMode="dense" altHref={explainerHref} />
      ) : null}

      <header className="substack-nav">
        <div className="substack-nav-inner">
          <Link href="/#blog" className="substack-back">
            ← {isDE ? 'Archiv' : 'Archive'}
          </Link>
          {explainerHref ? (
            <div className="substack-mode-toggle">
              <span className="active">● dense</span>
              <span className="sep">/</span>
              <Link
                href={explainerHref}
                onClick={() => setArticleMode('explainer')}
              >
                ○ explainer
              </Link>
            </div>
          ) : null}
          <span className="substack-brand">AILEENA MACHINA</span>
        </div>
      </header>

      <section className="substack-hero">
        <p className="substack-meta">
          {category ? `${category} · ${date}` : date}
        </p>
        <h1 className="substack-title">{title}</h1>
        <p className="substack-dek">{dek}</p>
        {tags ? <p className="substack-tags">{tags}</p> : null}
      </section>

      <div className="substack-rule">
        <div />
      </div>

      <div style={{ padding: '0 24px' }}>
        <ArticleNarration title={title} date={date} category={category} />
      </div>

      <DocumentaryShelf />

      {children}
    </div>
  );
}

function DocumentaryShelf() {
  return (
    <aside className="substack-watch-shelf" aria-label="Documentary recommendations">
      <p className="watch-shelf-kicker">watch shelf</p>
      <h2 className="watch-shelf-title">documentaries beside the essay</h2>
      <div className="watch-shelf-stack">
        {DOCUMENTARY_RECS.map((item, index) => (
          <a
            key={item.title}
            className="watch-card"
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ['--tilt' as string]: `${[-3, 2.5, -1.5][index]}deg` }}
          >
            <span
              className="watch-card-image"
              aria-hidden
              style={{ backgroundImage: `url("${item.image}")` }}
            />
            <span className="watch-card-meta">
              {item.year} · {item.label}
            </span>
            <span className="watch-card-title">{item.title}</span>
          </a>
        ))}
      </div>
    </aside>
  );
}
