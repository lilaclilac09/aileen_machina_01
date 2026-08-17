'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { clampKnobValue, knobStepAmount } from '../lib/djKnob';

const DRAG_PX = 4;

export default function DJFader({
  label,
  ariaLabel,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  defaultValue,
  orientation = 'vertical',
  color = '#b9c0c7',
  length,
  testId,
  showLabel = true,
}: {
  label: string;
  ariaLabel?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  orientation?: 'vertical' | 'horizontal';
  color?: string;
  length?: number;
  testId?: string;
  showLabel?: boolean;
}) {
  const vertical = orientation === 'vertical';
  const trackLen = length ?? (vertical ? 78 : undefined);
  const reset = defaultValue ?? (min + max) / 2;
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const valRef = useRef(value);
  const start = useRef({ x: 0, y: 0, val: 0, dragged: false });
  const reactId = useId();
  const name = (ariaLabel || label).toLowerCase().replace(/\s+/g, '-');
  const span = max - min || 1;
  const t = (clampKnobValue(value, min, max) - min) / span;

  useEffect(() => {
    valRef.current = value;
  }, [value]);

  const commit = useCallback(
    (next: number, snap = step) => {
      const clamped = clampKnobValue(next, min, max, snap);
      valRef.current = clamped;
      onChange(clamped);
    },
    [min, max, step, onChange],
  );

  function valueFromPointer(clientX: number, clientY: number): number {
    const el = trackRef.current;
    if (!el) return valRef.current;
    const rect = el.getBoundingClientRect();
    const ratio = vertical
      ? 1 - (clientY - rect.top) / Math.max(1, rect.height)
      : (clientX - rect.left) / Math.max(1, rect.width);
    return min + Math.max(0, Math.min(1, ratio)) * span;
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    start.current = { x: e.clientX, y: e.clientY, val: valueFromPointer(e.clientX, e.clientY), dragged: false };
    commit(start.current.val);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (!start.current.dragged && Math.hypot(dx, dy) < DRAG_PX) return;
    start.current.dragged = true;
    commit(valueFromPointer(e.clientX, e.clientY));
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const { delta, snap } = knobStepAmount(step, min, max, { shift: ev.shiftKey, alt: ev.altKey });
      const dir = ev.deltaY > 0 ? -1 : 1;
      commit(valRef.current + dir * delta, snap);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [min, max, step, commit]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const { delta, snap } = knobStepAmount(step, min, max, { shift: e.shiftKey, alt: e.altKey });
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      commit(valRef.current + delta, snap);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      commit(valRef.current - delta, snap);
    } else if (e.key === 'Home') {
      e.preventDefault();
      commit(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      commit(max);
    }
  }

  const handlePct = vertical ? `${(1 - t) * 100}%` : `${t * 100}%`;
  const shown = step < 1 ? value.toFixed(1) : String(Math.round(value));
  const title = `${ariaLabel || label} ${shown}`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div
      ref={rootRef}
      data-testid={testId || `dj-fader-${name}`}
      data-fader-value={String(step < 1 ? value.toFixed(1) : Math.round(value))}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel || label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Number(step < 1 ? value.toFixed(1) : Math.round(value))}
      aria-orientation={orientation}
      aria-describedby={`${reactId}-readout`}
      title={title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onDoubleClick={(e) => {
        e.preventDefault();
        commit(reset);
      }}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        flex: vertical ? 1 : undefined,
        width: vertical ? undefined : '100%',
        touchAction: 'none',
        userSelect: 'none',
        cursor: dragging ? (vertical ? 'ns-resize' : 'ew-resize') : 'pointer',
        outline: focused ? `1px solid ${color}66` : 'none',
        outlineOffset: 2,
        borderRadius: 4,
      }}
    >
      {showLabel && (
        <p
          id={reactId}
          style={{
            fontFamily: 'monospace',
            fontSize: '0.26rem',
            letterSpacing: '0.4em',
            color: 'rgba(255,253,248,0.42)',
            margin: 0,
          }}
        >
          {label}
        </p>
      )}
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          width: vertical ? 22 : '100%',
          height: vertical ? trackLen : 18,
          minHeight: vertical ? 44 : 18,
        }}
      >
        {vertical ? (
          <>
            <div
              style={{
                position: 'absolute',
                left: 9,
                width: 4,
                height: '100%',
                borderRadius: 3,
                background: '#0a0c0f',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(170,179,187,0.1)',
              }}
            />
            {ticks.map((pct) => (
              <div
                key={pct}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 3,
                  width: pct === 0.5 ? 16 : 8,
                  height: 1,
                  top: `${(1 - pct) * 100}%`,
                  background: pct === 0.5 ? 'rgba(170,179,187,0.35)' : 'rgba(170,179,187,0.16)',
                  pointerEvents: 'none',
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                width: 26,
                height: 11,
                top: `calc(${handlePct} - 5.5px)`,
                left: -2,
                borderRadius: 2,
                pointerEvents: 'none',
                background: 'linear-gradient(160deg, #d9e0e6 0%, #b9c0c7 30%, #8e979f 65%, #72797f 100%)',
                boxShadow: '0 2px 7px rgba(0,0,0,0.8), inset 0 1px 0 rgba(217,224,230,0.7)',
                border: '1px solid rgba(100,108,116,0.55)',
              }}
            />
          </>
        ) : (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 3,
                background: `linear-gradient(to right, rgba(0,168,157,0.18), rgba(18,22,27,0.9) 50%, rgba(255,155,94,0.15))`,
                border: '1px solid rgba(170,179,187,0.15)',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.7)',
              }}
            />
            {ticks.map((pct) => (
              <div
                key={pct}
                aria-hidden
                style={{
                  position: 'absolute',
                  top: pct === 0.5 ? 2 : 5,
                  bottom: pct === 0.5 ? 2 : 5,
                  width: 1,
                  left: `${pct * 100}%`,
                  background: pct === 0.5 ? 'rgba(170,179,187,0.4)' : 'rgba(170,179,187,0.18)',
                  pointerEvents: 'none',
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                width: 18,
                height: 30,
                left: `calc(${handlePct} - 9px)`,
                top: -6,
                borderRadius: 3,
                pointerEvents: 'none',
                background: 'linear-gradient(160deg, #d9e0e6 0%, #b9c0c7 30%, #8e979f 65%, #72797f 100%)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.9), inset 0 1px 0 rgba(217,224,230,0.7)',
                border: '1px solid rgba(100,108,116,0.6)',
              }}
            />
          </>
        )}
      </div>
      <span
        id={`${reactId}-readout`}
        data-testid={`dj-fader-readout-${name}`}
        style={{
          fontFamily: 'monospace',
          fontSize: '0.22rem',
          letterSpacing: '0.08em',
          color: dragging || focused ? 'rgba(255,253,248,0.5)' : 'transparent',
          pointerEvents: 'none',
          minHeight: 10,
        }}
      >
        {shown}
      </span>
    </div>
  );
}
