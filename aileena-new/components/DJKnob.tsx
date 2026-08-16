'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  KNOB_TICK_PCTS,
  clampKnobValue,
  pointerToKnobValue,
  valueToAngle,
} from '../lib/djKnob';

const DRAG_PX = 5;
const FINE_SCALE = 0.8;

export default function DJKnob({
  label,
  value,
  size,
  color,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 50,
  ariaLabel,
}: {
  label: string;
  value: number;
  size: number;
  color: string;
  onChange?: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  ariaLabel?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const startY = useRef(0);
  const startX = useRef(0);
  const startVal = useRef(0);
  const dragged = useRef(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const reactId = useId();
  const name = (ariaLabel || label).toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const angle = valueToAngle(localVal, min, max);
  const mid = (min + max) / 2;
  const isCenter = Math.abs(localVal - mid) < (max - min) * 0.03;
  const interactive = true;
  const title = `${ariaLabel || label} ${Math.round(localVal)}`;

  function commit(next: number) {
    const clamped = clampKnobValue(next, min, max, step);
    setLocalVal(clamped);
    onChange?.(clamped);
  }

  function valueFromPointer(clientX: number, clientY: number): number | null {
    const el = ringRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(clientX - cx, clientY - cy);
    // Inner body is too close to the origin for a stable angle — drag only.
    if (dist < rect.width * 0.28) return null;
    return pointerToKnobValue(clientX, clientY, cx, cy, min, max, step);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragged.current = false;
    startY.current = e.clientY;
    startX.current = e.clientX;
    const jumped = valueFromPointer(e.clientX, e.clientY);
    if (jumped != null) {
      commit(jumped);
      startVal.current = jumped;
    } else {
      startVal.current = localVal;
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const dy = startY.current - e.clientY;
    const dx = e.clientX - startX.current;
    if (!dragged.current && Math.hypot(dx, dy) < DRAG_PX) return;
    dragged.current = true;
    const delta = (Math.abs(dy) >= Math.abs(dx) ? dy : dx) * FINE_SCALE;
    commit(startVal.current + delta);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setDragging(false);
    if (!dragged.current) {
      const jumped = valueFromPointer(e.clientX, e.clientY);
      if (jumped != null) commit(jumped);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const span = max - min;
    const base = step > 0 ? step : 1;
    const jump = e.shiftKey ? Math.max(base * 10, span / 10) : base;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      commit(localVal + jump);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      commit(localVal - jump);
    } else if (e.key === 'Home') {
      e.preventDefault();
      commit(min);
    } else if (e.key === 'End') {
      e.preventDefault();
      commit(max);
    }
  }

  return (
    <div
      data-testid={`dj-knob-${name}`}
      data-knob-value={String(Math.round(localVal))}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel || label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(localVal)}
      aria-describedby={`${reactId}-readout`}
      title={title}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => setDragging(false)}
      onDoubleClick={(e) => {
        e.preventDefault();
        commit(defaultValue);
      }}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        cursor: interactive ? (dragging ? 'ns-resize' : 'pointer') : 'default',
        touchAction: 'none',
        minWidth: size < 36 ? 44 : undefined,
        minHeight: size < 36 ? 44 : undefined,
        justifyContent: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        outline: focused ? `1px solid ${color}66` : 'none',
        outlineOffset: 2,
        borderRadius: 4,
      }}
    >
      <div
        ref={ringRef}
        style={{
          position: 'relative',
          width: size,
          height: size,
        }}
      >
        {KNOB_TICK_PCTS.map((pct) => {
          const tickVal = min + (pct / 100) * (max - min);
          const tickAngle = valueToAngle(tickVal, min, max);
          const r = size / 2 - 1;
          const x = size / 2 + Math.sin((tickAngle * Math.PI) / 180) * r;
          const y = size / 2 - Math.cos((tickAngle * Math.PI) / 180) * r;
          return (
            <button
              key={pct}
              type="button"
              tabIndex={-1}
              data-testid={`dj-knob-tick-${name}-${pct}`}
              aria-label={`${ariaLabel || label} ${pct}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                commit(tickVal);
              }}
              style={{
                position: 'absolute',
                left: x - 8,
                top: y - 8,
                width: 16,
                height: 16,
                padding: 0,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                zIndex: 2,
              }}
            >
              <span
                style={{
                  display: 'block',
                  width: 2,
                  height: 2,
                  margin: '5px auto 0',
                  borderRadius: 1,
                  background: 'rgba(255,253,248,0.28)',
                }}
              />
            </button>
          );
        })}
        <svg width={size} height={size} viewBox="0 0 40 40" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(142,151,159,0.2)" strokeWidth="3" />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={isCenter ? color : 'rgba(185,192,199,0.55)'}
            strokeWidth="2.5"
            strokeDasharray={`${((localVal - min) / (max - min || 1)) * 113} 200`}
            strokeDashoffset="85"
            strokeLinecap="round"
            style={{
              transition: dragging ? 'none' : 'stroke 0.2s',
              filter: isCenter ? `drop-shadow(0 0 3px ${color}80)` : 'none',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: size * 0.12,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 35%, #2a2e36, #0e1014)',
            boxShadow: `inset 0 2px 4px rgba(0,0,0,0.8), inset 0 -1px 0 rgba(185,192,199,0.08),
            0 0 ${isCenter ? 8 : 0}px ${color}50`,
            transition: 'box-shadow 0.2s',
            border: '1px solid rgba(170,179,187,0.12)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '12%',
              left: '50%',
              width: 2,
              height: '30%',
              background: color,
              borderRadius: 1,
              transformOrigin: `1px ${size * 0.38 * 0.88 * 0.76}px`,
              transform: `translateX(-50%) rotate(${angle}deg)`,
              boxShadow: `0 0 4px ${color}`,
              transition: dragging ? 'none' : 'transform 0.1s',
            }}
          />
        </div>
      </div>
      <span
        style={{
          fontFamily: 'monospace',
          fontSize: '0.26rem',
          letterSpacing: '0.25em',
          color: isCenter ? color : 'rgba(255,255,255,0.25)',
          transition: 'color 0.2s',
        }}
      >
        {label}
      </span>
      <span
        id={`${reactId}-readout`}
        data-testid={`dj-knob-readout-${name}`}
        style={{
          position: 'absolute',
          bottom: -2,
          fontFamily: 'monospace',
          fontSize: '0.22rem',
          letterSpacing: '0.08em',
          color: dragging || focused ? 'rgba(255,253,248,0.45)' : 'transparent',
          pointerEvents: 'none',
        }}
      >
        {Math.round(localVal)}
      </span>
    </div>
  );
}
