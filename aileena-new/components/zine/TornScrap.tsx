'use client';

import type { CSSProperties, ReactNode } from 'react';
import './torn-scrap.css';

type AccentTone = 'blue' | 'teal' | 'amber' | 'none';

type TornScrapProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** photo = dark underlay; paper = cream scrap */
  face?: 'photo' | 'paper';
  grain?: 'default' | 'soft' | 'none';
  accent?: AccentTone;
  /** absolute placement for the chroma tear patch */
  accentStyle?: CSSProperties;
  tape?: boolean;
  tapeStyle?: CSSProperties;
};

/**
 * Torn-edge scrap wrapper for the clipping desk.
 * Clip-path + grain live on the face; drop-shadow stays on the outer shell.
 */
export function TornScrap({
  children,
  className = '',
  style,
  face = 'photo',
  grain = 'default',
  accent = 'none',
  accentStyle,
  tape = false,
  tapeStyle,
}: TornScrapProps) {
  const faceClass =
    face === 'paper' ? 'torn-scrap__face torn-scrap__face--paper' : 'torn-scrap__face torn-scrap__face--photo';
  const grainClass =
    grain === 'none'
      ? ''
      : grain === 'soft'
        ? 'torn-scrap__grain torn-scrap__grain--soft'
        : 'torn-scrap__grain';
  const accentClass =
    accent === 'none'
      ? ''
      : accent === 'teal'
        ? 'torn-scrap__accent torn-scrap__accent--teal'
        : accent === 'amber'
          ? 'torn-scrap__accent torn-scrap__accent--amber'
          : 'torn-scrap__accent';

  return (
    <span className={`torn-scrap ${className}`.trim()} style={style}>
      <span className={faceClass}>
        {children}
        {grainClass ? <span aria-hidden className={grainClass} /> : null}
        {accentClass ? (
          <span
            aria-hidden
            className={accentClass}
            style={{
              top: '-6%',
              right: '-4%',
              width: '42%',
              height: '28%',
              ...accentStyle,
            }}
          />
        ) : null}
        {tape ? (
          <span
            aria-hidden
            className="torn-scrap__tape"
            style={{
              top: 10,
              left: '18%',
              width: '64%',
              transform: 'rotate(-2deg)',
              ...tapeStyle,
            }}
          />
        ) : null}
      </span>
    </span>
  );
}
