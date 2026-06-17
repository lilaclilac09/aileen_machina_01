/**
 * Pricing time series query layer + agent tools.
 *
 * Reads /aileena-new/data/pricing.json (the build-time JSON bundle of
 * pricing.jsonl — see scripts/build-data-index.ts). Items are dated
 * observations, one per row.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { loadArray } from './load';
import { PricePointSchema, type PricePoint } from './types';
import pricingRaw from '../../data/pricing.json';

const dataset = loadArray<PricePoint>(pricingRaw, PricePointSchema, 'data/pricing.json');
const POINTS = dataset.items.slice().sort((a, b) => a.date.localeCompare(b.date));

function inRange(date: string, from?: string, to?: string): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export function getPriceHistory(
  sku: string,
  range?: { from?: string; to?: string; unit?: PricePoint['unit'] },
): PricePoint[] {
  const q = sku.toLowerCase();
  return POINTS.filter(
    (p) =>
      p.sku.toLowerCase().includes(q) &&
      inRange(p.date, range?.from, range?.to) &&
      (!range?.unit || (p.unit ?? 'per_chip') === range.unit),
  );
}

export function getLatestPrice(sku: string, unit?: PricePoint['unit']): PricePoint | null {
  const hist = getPriceHistory(sku, { unit });
  return hist.length > 0 ? hist[hist.length - 1] : null;
}

// ── Agent tools ─────────────────────────────────────────────────────────

const UnitEnum = z.enum(['per_chip', 'per_card', 'per_server', 'per_hour_cloud', 'per_month_cloud']);

export const pricingTools = {
  latestPrice: tool({
    description:
      "Most recent observed price for an SKU, optionally for a specific unit (per_chip, per_card, per_server, per_hour_cloud, per_month_cloud). Use when the visitor asks 'how much is an H100?', 'what does an H100 cost per hour on AWS?'.",
    inputSchema: z.object({
      sku: z.string().min(1).describe('SKU name (full or partial substring).'),
      unit: UnitEnum.optional(),
    }),
    execute: async ({ sku, unit }) => {
      const p = getLatestPrice(sku, unit);
      if (!p) return { found: false, message: `No pricing recorded for "${sku}"` };
      return { found: true, point: p };
    },
  }),

  priceHistory: tool({
    description:
      'Full pricing history for an SKU within an optional date range. Returns observations sorted chronologically. Use for "how has the H100 price moved this year?", "show me MI300X price trend".',
    inputSchema: z.object({
      sku: z.string().min(1),
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      unit: UnitEnum.optional(),
    }),
    execute: async ({ sku, from, to, unit }) => {
      const hist = getPriceHistory(sku, { from, to, unit });
      return { count: hist.length, points: hist };
    },
  }),
};

export const pricingDatasetInfo = () => ({
  source: dataset.source,
  count: POINTS.length,
  invalidCount: dataset.invalidCount,
});
