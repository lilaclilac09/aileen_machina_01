/**
 * Shared rotary mapping for Sound Lab knobs.
 * Visual sweep matches the existing EQ knob: -135deg … +135deg.
 */

export const KNOB_MIN_ANGLE = -135;
export const KNOB_MAX_ANGLE = 135;
export const KNOB_SWEEP = 270;

export function clampKnobValue(
  value: number,
  min = 0,
  max = 100,
  step?: number,
): number {
  if (!Number.isFinite(value)) return min;
  let next = Math.max(min, Math.min(max, value));
  if (step && step > 0) {
    next = Math.round((next - min) / step) * step + min;
    next = Math.max(min, Math.min(max, next));
  }
  return next;
}

export function valueToAngle(value: number, min = 0, max = 100): number {
  const span = max - min || 1;
  const t = (clampKnobValue(value, min, max) - min) / span;
  return KNOB_MIN_ANGLE + t * KNOB_SWEEP;
}

export function angleToValue(
  deg: number,
  min = 0,
  max = 100,
  step?: number,
): number {
  const clamped = Math.max(KNOB_MIN_ANGLE, Math.min(KNOB_MAX_ANGLE, deg));
  const t = (clamped - KNOB_MIN_ANGLE) / KNOB_SWEEP;
  return clampKnobValue(min + t * (max - min), min, max, step);
}

/** 0deg = up, clockwise positive — same as the existing indicator line. */
export function pointerAngleDeg(
  clientX: number,
  clientY: number,
  cx: number,
  cy: number,
): number {
  return (Math.atan2(clientX - cx, cy - clientY) * 180) / Math.PI;
}

export function pointerToKnobValue(
  clientX: number,
  clientY: number,
  cx: number,
  cy: number,
  min = 0,
  max = 100,
  step?: number,
): number {
  return angleToValue(pointerAngleDeg(clientX, clientY, cx, cy), min, max, step);
}

export const KNOB_TICK_PCTS = [0, 25, 50, 75, 100] as const;
