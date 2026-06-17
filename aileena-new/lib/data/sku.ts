/**
 * SKU (chip / accelerator / memory) query layer + agent tools.
 *
 * Reads /aileena-new/data/skus.json. Items validated against SkuSpecSchema
 * at module load; invalid entries are dropped with a warning.
 *
 * Three tools exposed:
 *   - queryChip(name)      : best fuzzy match for a single SKU
 *   - listChips({...})     : filter list by vendor / category / family
 *   - compareChips(a, b)   : side-by-side comparison
 *
 * All tools return structured JSON the LLM then synthesises into prose.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { loadArray } from './load';
import { SkuSpecSchema, type SkuSpec, VendorEnum, CategoryEnum } from './types';
import skusRaw from '../../data/skus.json';

const dataset = loadArray<SkuSpec>(skusRaw, SkuSpecSchema, 'data/skus.json');
const SKUS = dataset.items;

// Cheap normaliser for fuzzy SKU matching: lowercase, alphanumerics only.
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// Score an SKU's match against a query string. Higher is better.
function matchScore(sku: SkuSpec, query: string): number {
  const q = norm(query);
  if (q.length === 0) return 0;
  const targets: string[] = [norm(sku.sku)];
  if (sku.family) targets.push(norm(sku.family));
  targets.push(`${sku.vendor}${norm(sku.sku)}`);

  let best = 0;
  for (const t of targets) {
    if (t === q) return 100;
    if (t.includes(q)) best = Math.max(best, 60 + Math.min(20, q.length));
    else if (q.includes(t) && t.length > 3) best = Math.max(best, 50);
  }
  // Token-overlap fallback.
  const qTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const skuTokens = sku.sku.toLowerCase().split(/\s+/);
  let overlap = 0;
  for (const qt of qTokens) {
    if (skuTokens.some((st) => st.startsWith(qt) || qt.startsWith(st))) overlap++;
  }
  if (overlap > 0) best = Math.max(best, 10 * overlap);
  return best;
}

export function queryChip(name: string): SkuSpec | null {
  if (SKUS.length === 0) return null;
  let best: SkuSpec | null = null;
  let bestScore = 0;
  for (const sku of SKUS) {
    const s = matchScore(sku, name);
    if (s > bestScore) {
      best = sku;
      bestScore = s;
    }
  }
  return bestScore >= 30 ? best : null;
}

export function listChips(filter: {
  vendor?: string;
  category?: string;
  family?: string;
  limit?: number;
}): SkuSpec[] {
  const out: SkuSpec[] = [];
  const lim = filter.limit ?? 50;
  for (const sku of SKUS) {
    if (filter.vendor && sku.vendor !== filter.vendor.toLowerCase()) continue;
    if (filter.category && sku.category !== filter.category.toLowerCase()) continue;
    if (filter.family && sku.family && !sku.family.toLowerCase().includes(filter.family.toLowerCase())) continue;
    out.push(sku);
    if (out.length >= lim) break;
  }
  return out;
}

export function compareChips(skuA: string, skuB: string): { a: SkuSpec | null; b: SkuSpec | null } {
  return { a: queryChip(skuA), b: queryChip(skuB) };
}

// ── Agent tools ─────────────────────────────────────────────────────────

export const skuTools = {
  queryChip: tool({
    description:
      'Look up specs for a single chip / accelerator / memory SKU by name. Returns the best fuzzy match (vendor, family, process, FLOPS, memory, TDP, MSRP, status, sources). Use when the visitor names a chip ("H100", "MI300X", "Rubin", "GB200") and asks about its specs, performance, price, or release date.',
    inputSchema: z.object({
      name: z.string().min(1).describe('Chip name or partial name, e.g. "H100", "B200 SXM", "MI300X"'),
    }),
    execute: async ({ name }) => {
      const hit = queryChip(name);
      if (!hit) return { found: false, message: `No SKU matched "${name}". Try listChips for vendor catalog.` };
      return { found: true, sku: hit };
    },
  }),

  listChips: tool({
    description:
      "List SKUs by vendor / category / family. Use when the visitor asks 'what GPUs does NVIDIA have?', 'show me AMD MI300 series', 'list HBM3E memory products', etc. Returns up to `limit` matches with full spec rows.",
    inputSchema: z.object({
      vendor: VendorEnum.optional(),
      category: CategoryEnum.optional(),
      family: z.string().optional().describe('Architecture family name, e.g. "Hopper", "Blackwell", "Instinct"'),
      limit: z.number().int().min(1).max(50).optional().default(20),
    }),
    execute: async ({ vendor, category, family, limit }) => {
      const items = listChips({ vendor, category, family, limit });
      return { count: items.length, items };
    },
  }),

  compareChips: tool({
    description:
      'Side-by-side comparison of two SKUs. Returns both spec rows. Use when the visitor asks "H100 vs MI300X", "compare B200 and Rubin", etc.',
    inputSchema: z.object({
      skuA: z.string().min(1),
      skuB: z.string().min(1),
    }),
    execute: async ({ skuA, skuB }) => compareChips(skuA, skuB),
  }),
};

export const skuDatasetInfo = () => ({
  source: dataset.source,
  count: SKUS.length,
  invalidCount: dataset.invalidCount,
});
