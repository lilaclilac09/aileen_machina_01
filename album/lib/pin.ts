export type PinMode = "none" | "front" | "center";

export const PIN_MODES: PinMode[] = ["none", "front", "center"];

export function nextPinMode(current: string | null | undefined): PinMode {
  const cur = (current || "none") as PinMode;
  if (cur === "none") return "front";
  if (cur === "front") return "center";
  return "none";
}

export function isPinned(mode: string | null | undefined): boolean {
  return mode === "front" || mode === "center";
}

export function pinRank(mode: string | null | undefined): number {
  if (mode === "center") return 2;
  if (mode === "front") return 1;
  return 0;
}
