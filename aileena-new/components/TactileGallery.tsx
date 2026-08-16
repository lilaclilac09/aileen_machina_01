'use client';

import Link from 'next/link';
import { useCallback, useId, useState } from 'react';
import './tactile-gallery.css';

export type TactileImage = {
  src: string;
  alt: string;
  caption?: string;
  href?: string;
  /** Intrinsic width — keeps layout stable before decode */
  width?: number;
  /** Intrinsic height — keeps layout stable before decode */
  height?: number;
  tags?: string[];
};

export type TactileGalleryMode = 'wall' | 'focus';

type Labels = {
  wall: string;
  focus: string;
  prev?: string;
  next?: string;
};

const DEFAULT_LABELS: Labels = {
  wall: 'wall',
  focus: 'focus',
  prev: 'prev',
  next: 'next',
};

type Props = {
  images: TactileImage[];
  mode?: TactileGalleryMode;
  defaultMode?: TactileGalleryMode;
  onModeChange?: (mode: TactileGalleryMode) => void;
  labels?: Partial<Labels>;
  className?: string;
  /** data attribute for QA hooks */
  galleryTestId?: string;
};

/**
 * Adaptive tactile image archive — natural aspect, wall / focus toggle,
 * snappy (not silk) motion. No cover-crop; no heavy cards.
 */
export default function TactileGallery({
  images,
  mode: controlledMode,
  defaultMode = 'wall',
  onModeChange,
  labels: labelOverrides,
  className = '',
  galleryTestId = 'tactile-gallery',
}: Props) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const reactId = useId();
  const [uncontrolled, setUncontrolled] = useState<TactileGalleryMode>(defaultMode);
  const mode = controlledMode ?? uncontrolled;
  const [focusIndex, setFocusIndex] = useState(0);

  const setMode = useCallback(
    (next: TactileGalleryMode) => {
      if (controlledMode === undefined) setUncontrolled(next);
      onModeChange?.(next);
    },
    [controlledMode, onModeChange],
  );

  if (!images.length) return null;

  const safeFocus = Math.min(Math.max(focusIndex, 0), images.length - 1);

  const openFocus = (index: number) => {
    setFocusIndex(index);
    setMode('focus');
  };

  const stepFocus = (dir: -1 | 1) => {
    setFocusIndex((i) => {
      const cur = Math.min(Math.max(i, 0), images.length - 1);
      return (cur + dir + images.length) % images.length;
    });
  };

  const focus = images[safeFocus];

  return (
    <div
      className={`tactile-gallery ${className}`.trim()}
      data-tactile-gallery={galleryTestId}
      data-mode={mode}
    >
      <div className="tactile-gallery__toggle" role="group" aria-label="Gallery view">
        <button
          type="button"
          aria-pressed={mode === 'wall'}
          onClick={() => setMode('wall')}
        >
          {labels.wall}
        </button>
        <span className="tactile-gallery__sep" aria-hidden>
          ·
        </span>
        <button
          type="button"
          aria-pressed={mode === 'focus'}
          onClick={() => setMode('focus')}
        >
          {labels.focus}
        </button>
      </div>

      {mode === 'wall' ? (
        <div className="tactile-gallery__wall" data-visual-gallery>
          {images.map((item, i) => (
            <button
              key={`${item.src}-${i}`}
              type="button"
              className="tactile-gallery__cell"
              style={{ ['--tg-delay' as string]: `${(i % 7) * 45}ms` }}
              onClick={() => openFocus(i)}
              aria-label={item.caption || item.alt}
            >
              <span className="tactile-gallery__frame">
                {/* eslint-disable-next-line @next/next/no-img-element -- intrinsic ratio; avoid next/image fill crop */}
                <img
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  decoding="async"
                  loading={i < 4 ? 'eager' : 'lazy'}
                />
              </span>
              {item.caption ? (
                <span className="tactile-gallery__caption">{item.caption}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : (
        <div className="tactile-gallery__focus" data-visual-gallery="focus">
          <div className="tactile-gallery__focus-stage" key={`${reactId}-${focus.src}-${safeFocus}`}>
            <div className="tactile-gallery__frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={focus.src}
                alt={focus.alt}
                width={focus.width}
                height={focus.height}
                decoding="async"
              />
            </div>
            {focus.caption ? (
              <p className="tactile-gallery__focus-caption">{focus.caption}</p>
            ) : null}
            {focus.href ? (
              <p className="tactile-gallery__focus-link">
                <Link href={focus.href}>open note →</Link>
              </p>
            ) : null}
            <div className="tactile-gallery__focus-nav">
              <button type="button" onClick={() => stepFocus(-1)}>
                {labels.prev}
              </button>
              <button type="button" onClick={() => stepFocus(1)}>
                {labels.next}
              </button>
            </div>
          </div>

          <div className="tactile-gallery__strip" role="list">
            {images.map((item, i) => (
              <button
                key={`strip-${item.src}-${i}`}
                type="button"
                role="listitem"
                aria-current={i === safeFocus}
                aria-label={item.caption || item.alt}
                onClick={() => setFocusIndex(i)}
              >
                <span className="tactile-gallery__frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.src}
                    alt=""
                    width={item.width}
                    height={item.height}
                    decoding="async"
                    loading="lazy"
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Alias names from the visual-archive brief */
export { TactileGallery as AdaptiveImageWall, TactileGallery as VisualShelf };
