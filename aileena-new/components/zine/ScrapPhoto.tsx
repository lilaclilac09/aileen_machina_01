'use client';

import type { CSSProperties, ReactNode } from 'react';
import './scrap-photo.css';

type ScrapPhotoProps = {
  src: string;
  alt?: string;
  filter?: string;
  overlay?: CSSProperties['background'];
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * Natural-aspect scrap image for the clipping desk.
 * Cards adapt to the image — no object-fit:cover / fixed aspect shell.
 */
export function ScrapPhoto({
  src,
  alt = '',
  filter,
  overlay,
  className = '',
  style,
  children,
}: ScrapPhotoProps) {
  return (
    <span className={`scrap-photo ${className}`.trim()} style={style}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="scrap-photo__img"
        draggable={false}
        style={filter ? { filter } : undefined}
      />
      {overlay ? (
        <span aria-hidden className="scrap-photo__overlay" style={{ background: overlay }} />
      ) : null}
      {children}
    </span>
  );
}
