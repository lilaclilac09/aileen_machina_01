/**
 * Number grounding for chip and price figures.
 *
 * A spec or price figure in a reply (GB, TB/s, W, TFLOPS, nm, $…) must match a
 * figure of the same kind in what the model was given this turn: the frozen
 * prompt, the session tail, the visitor's own words, or a tool result. If it
 * doesn't, we correct it from her chip catalogue (data/skus.json) when the
 * sentence names exactly one SKU we have; otherwise the sentence is dropped.
 */

import skusRaw from '../../data/skus.json';

type Sku = {
  sku: string;
  memGB?: number;
  memBandwidthGBps?: number;
  tdpW?: number;
  [key: string]: unknown;
};

const SKUS = skusRaw as Sku[];

export type UnitKind = 'mem' | 'bw' | 'compute' | 'power' | 'node' | 'money';

const UNIT: Record<string, { kind: UnitKind; factor: number }> = {
  GB: { kind: 'mem', factor: 1 },
  TB: { kind: 'mem', factor: 1000 },
  'GB/s': { kind: 'bw', factor: 1 },
  'TB/s': { kind: 'bw', factor: 1000 },
  TFLOPS: { kind: 'compute', factor: 1 },
  PFLOPS: { kind: 'compute', factor: 1000 },
  TOPS: { kind: 'compute', factor: 1 },
  W: { kind: 'power', factor: 1 },
  kW: { kind: 'power', factor: 1000 },
  nm: { kind: 'node', factor: 1 },
  $: { kind: 'money', factor: 1 },
};

/** Number + unit we treat as a checkable spec/price figure. Bare numbers are ignored. */
const FIGURE_RE =
  /(\$|US\$|USD\s?)?(?<![A-Za-z0-9.,])(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s?(k|K|M|B|bn|million|billion)?\s?(GB\/s|TB\/s|GB|TB|TFLOPS|PFLOPS|TOPS|kW|W|nm|USD|美元)?(?![A-Za-z0-9])/g;

export type Figure = { raw: string; kind: UnitKind; base: number; unit: string; index: number };

function scale(suffix: string | undefined): number {
  if (!suffix) return 1;
  const s = suffix.toLowerCase();
  if (s === 'k') return 1e3;
  if (s === 'm' || s === 'million') return 1e6;
  if (s === 'b' || s === 'bn' || s === 'billion') return 1e9;
  return 1;
}

export function extractFigures(text: string): Figure[] {
  const out: Figure[] = [];
  for (const m of text.matchAll(FIGURE_RE)) {
    const money = Boolean(m[1]) || m[4] === 'USD' || m[4] === '美元';
    const unit = money ? '$' : m[4];
    if (!unit) continue;
    const spec = UNIT[unit];
    if (!spec) continue;
    // A magnitude suffix only makes sense on money ("$30k"); "80 M GB" is not a thing.
    const mult = money ? scale(m[3]) : 1;
    if (!money && m[3]) continue;
    const n = Number(m[2].replace(/,/g, ''));
    if (!Number.isFinite(n)) continue;
    out.push({ raw: m[0].trim(), kind: spec.kind, base: n * mult * spec.factor, unit, index: m.index ?? 0 });
  }
  return out;
}

/** Map a data-tool JSON key to the unit its numbers carry (memGB → GB, priceUSD → $, …). */
function unitForKey(key: string): string | null {
  if (/bandwidthGBps$/i.test(key) || /GBps$/.test(key)) return 'GB/s';
  if (/GB$/.test(key)) return 'GB';
  if (/Tflops$/i.test(key)) return 'TFLOPS';
  if (/Tops$/i.test(key)) return 'TOPS';
  if (/(^|[a-z])W$/.test(key) && /tdp|power|watt/i.test(key)) return 'W';
  if (/USD$/.test(key) || /^price/i.test(key)) return '$';
  if (/nm$/i.test(key)) return 'nm';
  return null;
}

/** Owner of everything a reply's figures may be grounded in this turn. */
export class GroundingCorpus {
  private figures: Array<{ kind: UnitKind; base: number }> = [];

  addText(text: string): void {
    for (const f of extractFigures(text || '')) this.figures.push({ kind: f.kind, base: f.base });
    // Process nodes appear as "TSMC 4N" / "N3": no unit, but "4nm" in a reply is fine then.
    for (const m of (text || '').matchAll(/\bN(\d{1,2})P?\b|\b(\d{1,2})N[P]?\b/g)) {
      this.figures.push({ kind: 'node', base: Number(m[1] ?? m[2]) });
    }
  }

  addToolOutput(value: unknown, key = ''): void {
    if (value == null) return;
    if (typeof value === 'number') {
      const unit = unitForKey(key);
      if (unit) this.figures.push({ kind: UNIT[unit].kind, base: value * UNIT[unit].factor });
      return;
    }
    if (typeof value === 'string') {
      this.addText(value);
      return;
    }
    if (Array.isArray(value)) {
      for (const v of value) this.addToolOutput(v, key);
      return;
    }
    if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) this.addToolOutput(v, k);
    }
  }

  has(f: Figure): boolean {
    return this.figures.some(
      (g) => g.kind === f.kind && Math.abs(g.base - f.base) <= Math.max(0.02 * Math.abs(g.base), 1e-9),
    );
  }
}

/** Short names a reply would use for each catalogue SKU ("H100", "MI300X", "GB200"). */
function aliasesFor(s: Sku): string[] {
  const out = new Set<string>();
  for (const m of s.sku.matchAll(/\b([A-Z]{1,3}\d{2,4}[A-Z]{0,2})\b/g)) out.add(m[1]);
  return [...out];
}

const ALIAS_INDEX: Array<{ alias: RegExp; sku: Sku }> = SKUS.flatMap((s) =>
  aliasesFor(s).map((a) => ({ alias: new RegExp(`(?<![A-Za-z0-9])${a}(?![A-Za-z0-9])`, 'i'), sku: s })),
);

function withUnit(f: Figure, value: number): string {
  const unit = f.raw.match(/\s?(GB\/s|TB\/s|GB|TB|kW|W)$/)?.[0] ?? ` ${f.unit}`;
  return `${value}${unit}`;
}

/** Catalogue value for this figure's unit, when the sentence names exactly one SKU we have. */
export function catalogueCorrection(sentence: string, f: Figure): string | null {
  const skus = [...new Set(ALIAS_INDEX.filter((a) => a.alias.test(sentence)).map((a) => a.sku))];
  if (skus.length !== 1) return null;
  const s = skus[0];
  if (f.kind === 'mem' && s.memGB) return withUnit(f, f.unit === 'TB' ? s.memGB / 1000 : s.memGB);
  if (f.kind === 'bw' && s.memBandwidthGBps) {
    return withUnit(f, f.unit === 'TB/s' ? s.memBandwidthGBps / 1000 : s.memBandwidthGBps);
  }
  if (f.kind === 'power' && s.tdpW) return withUnit(f, f.unit === 'kW' ? s.tdpW / 1000 : s.tdpW);
  return null;
}

/** Catalogue values of one kind for a SKU, in base units (GB, GB/s, W, TFLOPS). */
function catalogueValues(s: Sku, kind: UnitKind): number[] {
  if (kind === 'mem') return typeof s.memGB === 'number' ? [s.memGB] : [];
  if (kind === 'bw') return typeof s.memBandwidthGBps === 'number' ? [s.memBandwidthGBps] : [];
  if (kind === 'power') return typeof s.tdpW === 'number' ? [s.tdpW] : [];
  if (kind === 'compute') {
    return Object.entries(s)
      .filter(([k, v]) => /tflops|tops/i.test(k) && typeof v === 'number')
      .map(([, v]) => v as number);
  }
  return [];
}

/**
 * A figure is also grounded when it matches the catalogue (data/skus.json) for
 * a SKU named in the same sentence, e.g. a comparison line that cites the H100
 * while only the H200 was looked up. This is still "numbers from data".
 */
export function catalogueSupports(sentence: string, f: Figure): boolean {
  const skus = [...new Set(ALIAS_INDEX.filter((a) => a.alias.test(sentence)).map((a) => a.sku))];
  return skus.some((s) => catalogueValues(s, f.kind).some((v) => Math.abs(v - f.base) <= Math.max(0.02 * v, 0.01)));
}

export type GroundingResult = {
  text: string;
  corrected: Array<{ from: string; to: string }>;
  dropped: boolean;
};

/** Ground every figure in one sentence. Correct from the catalogue, else drop the sentence. */
export function groundSentence(sentence: string, corpus: GroundingCorpus): GroundingResult {
  const figures = extractFigures(sentence);
  if (figures.length === 0) return { text: sentence, corrected: [], dropped: false };
  let text = sentence;
  const corrected: Array<{ from: string; to: string }> = [];
  // Right-to-left so earlier indexes stay valid while we splice.
  for (const f of [...figures].reverse()) {
    if (corpus.has(f)) continue;
    if (catalogueSupports(sentence, f)) continue;
    const fix = catalogueCorrection(sentence, f);
    if (!fix) return { text: '', corrected, dropped: true };
    text = text.slice(0, f.index) + text.slice(f.index).replace(f.raw, fix);
    corrected.push({ from: f.raw, to: fix });
  }
  return { text, corrected, dropped: false };
}
