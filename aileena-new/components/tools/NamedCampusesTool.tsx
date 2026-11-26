'use client';

import { useState } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import ArcadeLayout, { mono } from './ArcadeLayout';

const MAP_SVG = '/tools/named-campuses/fig-map-icons.svg';
const MAP_PNG = '/tools/named-campuses/fig-map-icons.png';

const STILLS = [
  {
    src: '/tools/named-campuses/lingang-lianggang.png',
    captionKey: 'lingang' as const,
  },
  {
    src: '/tools/named-campuses/ulanqab-ali-blvd.png',
    captionKey: 'ulanqab' as const,
  },
  {
    src: '/tools/named-campuses/singapore-jurong.png',
    captionKey: 'jurong' as const,
  },
];

export default function NamedCampusesTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.namedCampuses;
  const [mapSrc, setMapSrc] = useState(MAP_SVG);

  return (
    <ArcadeLayout tag={tx.tag} title={tx.heading} subtitle={tx.body} marquee={tx.marquee} wide>
      <div className="named-campuses" data-testid="named-campuses">
        <p className="named-campuses-stills-kicker">{tx.scrollHint}</p>
        <figure className="named-campuses-plate" data-testid="named-campuses-map">
          {/* eslint-disable-next-line @next/next/no-img-element -- original matplotlib SVG/PNG plate; next/image would crop and cannot serve the SVG */}
          <img
            src={mapSrc}
            alt={tx.mapAlt}
            data-testid="named-campuses-map-img"
            data-src-kind={mapSrc.endsWith('.svg') ? 'svg' : 'png'}
            onError={() => {
              if (mapSrc !== MAP_PNG) setMapSrc(MAP_PNG);
            }}
          />
          <figcaption>{tx.mapCaption}</figcaption>
        </figure>

        <p className="named-campuses-links">
          <button
            type="button"
            className="named-campuses-toggle"
            data-testid="named-campuses-use-svg"
            onClick={() => setMapSrc(MAP_SVG)}
            aria-pressed={mapSrc === MAP_SVG}
          >
            {tx.useSvg}
          </button>
          <span aria-hidden> · </span>
          <button
            type="button"
            className="named-campuses-toggle"
            data-testid="named-campuses-use-png"
            onClick={() => setMapSrc(MAP_PNG)}
            aria-pressed={mapSrc === MAP_PNG}
          >
            {tx.usePng}
          </button>
          <span aria-hidden> · </span>
          <a href={MAP_SVG} target="_blank" rel="noopener noreferrer">
            {tx.openSvg} ↗
          </a>
          <span aria-hidden> · </span>
          <a href={MAP_PNG} target="_blank" rel="noopener noreferrer">
            {tx.openPng} ↗
          </a>
        </p>

        <section data-testid="named-campuses-stills">
          <p className="named-campuses-kicker">{tx.stillsTitle}</p>
          <p className="named-campuses-stills-kicker">{tx.stillsKicker}</p>
          <div className="named-campuses-stills">
            {STILLS.map((still) => (
              <figure key={still.src}>
                {/* eslint-disable-next-line @next/next/no-img-element -- nadir stills stay uncropped; object-fit contain via intrinsic img */}
                <img src={still.src} alt={tx[still.captionKey]} loading="lazy" />
                <figcaption>{tx[still.captionKey]}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section>
          <p className="named-campuses-kicker">{tx.sourcesTitle}</p>
          <p className="named-campuses-sources" data-testid="named-campuses-sources">
            <a href={tx.mapSourceHref} target="_blank" rel="noopener noreferrer">
              {tx.mapSourceLabel}
            </a>
            {' · '}
            <a href={tx.stillsSourceHref} target="_blank" rel="noopener noreferrer">
              {tx.stillsSourceLabel}
            </a>
            {' · '}
            <a href={tx.keyHref} target="_blank" rel="noopener noreferrer">
              {tx.keyLabel}
            </a>
          </p>
          <p
            style={{
              margin: '12px 0 0',
              fontFamily: mono,
              fontSize: '0.72rem',
              lineHeight: 1.55,
              color: 'rgba(20,17,12,0.45)',
            }}
          >
            {tx.note}
          </p>
        </section>
      </div>
    </ArcadeLayout>
  );
}
