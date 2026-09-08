import type { PowerPath } from './plant';

export const HALL_COLS = 8;
export const HALL_ROWS = 6;
export const HALL_SLOTS = HALL_COLS * HALL_ROWS;
export const RACK_W = 0.6;
export const RACK_D = 1.2;
export const RACK_H = 2.2;
export const SIDECAR_W = 0.3;
export const PITCH_X = 0.82;
export const PITCH_Z = 2.55;
export const U_HEIGHT = 0.04445;

export type HallPose = {
  id: number;
  row: number;
  col: number;
  x: number;
  z: number;
  sidecarX: number;
};

export function hallPose(id: number): HallPose {
  const row = Math.floor(id / HALL_COLS);
  const col = id % HALL_COLS;
  const x = (col - (HALL_COLS - 1) / 2) * PITCH_X;
  const z = (row - (HALL_ROWS - 1) / 2) * PITCH_Z;
  return { id, row, col, x, z, sidecarX: x + RACK_W / 2 + SIDECAR_W / 2 + 0.04 };
}

export function cduPose(index: number) {
  const rowPair = index % 3;
  return {
    x: (HALL_COLS / 2) * PITCH_X + 0.55,
    z: (rowPair * 2 - (HALL_ROWS - 1) / 2) * PITCH_Z + PITCH_Z / 2,
  };
}

export function usesSidecar(path: PowerPath) {
  return path === '800v-sidecar';
}

export function usesOverheadBusway(path: PowerPath) {
  return path === 'facility-hvdc' || path === '800v-sidecar';
}

export function usesWhips(path: PowerPath) {
  return path === 'legacy-ac';
}
