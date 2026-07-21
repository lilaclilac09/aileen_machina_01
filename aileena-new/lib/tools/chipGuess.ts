/**
 * Chip Guess — quiz helpers (client-safe, no Node APIs).
 */

export type ChipClueSource = {
  sku: string;
  vendor: string;
  family?: string;
  category: string;
  process?: string;
  memType?: string;
  memGB?: number;
  memBandwidthGBps?: number;
  tdpW?: number;
  flopsBf16Tflops?: number;
  formFactor?: string;
  released?: string;
};

export type ChipClue = {
  label: string;
  value: string;
};

const DISTRACTORS = [
  'NVIDIA B200 SXM',
  'NVIDIA H200 SXM5',
  'AMD MI325X',
  'Google TPU v5p',
  'Intel Gaudi 3',
  'Cerebras WSE-3',
  'Groq LPU',
  'AWS Trainium2',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildClues(chip: ChipClueSource): ChipClue[] {
  const clues: ChipClue[] = [];
  if (chip.vendor) clues.push({ label: 'VENDOR', value: chip.vendor.toUpperCase() });
  if (chip.family) clues.push({ label: 'FAMILY', value: chip.family });
  if (chip.process) clues.push({ label: 'PROCESS', value: chip.process });
  if (chip.memType && chip.memGB != null) {
    clues.push({ label: 'MEMORY', value: `${chip.memGB} GB ${chip.memType}` });
  } else if (chip.memGB != null) {
    clues.push({ label: 'MEMORY', value: `${chip.memGB} GB` });
  }
  if (chip.memBandwidthGBps != null) {
    clues.push({ label: 'BW', value: `${chip.memBandwidthGBps} GB/s` });
  }
  if (chip.tdpW != null) clues.push({ label: 'TDP', value: `${chip.tdpW} W` });
  if (chip.flopsBf16Tflops != null) {
    clues.push({ label: 'BF16', value: `${chip.flopsBf16Tflops} TFLOPS` });
  }
  if (chip.formFactor) clues.push({ label: 'FORM', value: chip.formFactor });
  if (chip.released) clues.push({ label: 'SHIPPED', value: chip.released });
  return clues.slice(0, 5);
}

export function buildChoices(correct: ChipClueSource, pool: ChipClueSource[]): string[] {
  const others = pool.filter((c) => c.sku !== correct.sku).map((c) => c.sku);
  const pads = DISTRACTORS.filter((d) => d !== correct.sku && !others.includes(d));
  const picks = shuffle([...others, ...pads]).slice(0, 3);
  return shuffle([correct.sku, ...picks]);
}

export function pickRound(pool: ChipClueSource[]): {
  correct: ChipClueSource;
  clues: ChipClue[];
  choices: string[];
} | null {
  if (pool.length === 0) return null;
  const correct = pool[Math.floor(Math.random() * pool.length)];
  return {
    correct,
    clues: buildClues(correct),
    choices: buildChoices(correct, pool),
  };
}

export function scoreForAttempt(correct: boolean, attemptIndex: number): number {
  if (!correct) return 0;
  if (attemptIndex === 0) return 100;
  if (attemptIndex === 1) return 60;
  return 30;
}
