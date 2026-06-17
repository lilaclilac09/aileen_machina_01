/**
 * Shared types + zod schemas for the agent's "tracked data" layer.
 *
 * Aileen owns the data — she drops files into /aileena-new/data/. This
 * module defines the SHAPES she fills in. Each shape gets validated at
 * module load and exposed to the chat agent as one or more tools.
 *
 * Three shapes cover most of the "tracked tech data" we expect:
 *
 *   1. SkuSpec     — static specs for a chip / accelerator / memory SKU
 *                    (one entry per device). Stored as JSON array.
 *   2. PricePoint  — a dated price observation for an SKU. Stored as
 *                    JSONL (one observation per line, append-friendly).
 *   3. NewsItem    — a dated tracking entry: rumour, earnings note,
 *                    order, supplier shift, etc. JSONL.
 *
 * The schemas are intentionally permissive — most fields optional — so
 * raw data can be ingested without forcing a complete schema fill. The
 * agent's tools degrade gracefully when fields are missing.
 */

import { z } from 'zod';

// ── SKU specs (chips / accelerators / memory / interconnects) ──────────

export const VendorEnum = z.enum([
  'nvidia',
  'amd',
  'intel',
  'google',
  'aws',
  'meta',
  'microsoft',
  'apple',
  'broadcom',
  'marvell',
  'sambanova',
  'cerebras',
  'groq',
  'qualcomm',
  'tenstorrent',
  'huawei',
  'other',
]);
export type Vendor = z.infer<typeof VendorEnum>;

export const CategoryEnum = z.enum([
  'gpu',
  'cpu',
  'accelerator',
  'memory',
  'interconnect',
  'switch',
  'optical',
  'other',
]);
export type Category = z.infer<typeof CategoryEnum>;

export const SkuSpecSchema = z.object({
  // Identifiers — required
  sku: z.string().min(1).describe('Full SKU string, e.g. "NVIDIA H100 SXM5 80GB"'),
  vendor: VendorEnum,
  family: z.string().optional().describe('Architecture family, e.g. "Hopper"'),
  category: CategoryEnum,

  // Release info
  released: z
    .string()
    .regex(/^\d{4}(-\d{2})?(-\d{2})?$/)
    .optional()
    .describe('YYYY, YYYY-MM, or YYYY-MM-DD'),
  process: z.string().optional().describe('Fab process, e.g. "TSMC 4N", "TSMC N3"'),

  // Performance — all numeric, units in field name
  transistorsB: z.number().nonnegative().optional().describe('Transistor count, billions'),
  dieAreaMm2: z.number().nonnegative().optional(),
  cudaCoresOrShaders: z.number().nonnegative().optional(),
  tensorCores: z.number().nonnegative().optional(),
  flopsFp64Tflops: z.number().nonnegative().optional(),
  flopsFp32Tflops: z.number().nonnegative().optional(),
  flopsBf16Tflops: z.number().nonnegative().optional(),
  flopsFp8Tflops: z.number().nonnegative().optional(),
  flopsInt8Tops: z.number().nonnegative().optional(),

  // Memory
  memType: z.string().optional().describe('e.g. "HBM3", "HBM3E", "GDDR6X"'),
  memGB: z.number().nonnegative().optional(),
  memBandwidthGBps: z.number().nonnegative().optional(),

  // Interconnect
  interconnect: z.string().optional().describe('e.g. "NVLink 4 (900 GB/s)", "PCIe 5.0 x16"'),

  // Power
  tdpW: z.number().nonnegative().optional(),
  formFactor: z.string().optional().describe('e.g. "SXM5", "PCIe", "OAM"'),

  // Commercial
  msrpUSD: z.number().nonnegative().optional(),
  priceRangeUSD: z
    .tuple([z.number().nonnegative(), z.number().nonnegative()])
    .optional()
    .describe('[lo, hi] observed market range'),
  status: z.enum(['shipping', 'announced', 'sampling', 'eol', 'rumoured']).optional(),
  notableCustomers: z.array(z.string()).optional(),

  notes: z.string().optional(),
  sources: z.array(z.string().url()).optional(),
});
export type SkuSpec = z.infer<typeof SkuSpecSchema>;

// ── Time-series pricing ────────────────────────────────────────────────

export const PricePointSchema = z.object({
  sku: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priceUSD: z.number().nonnegative(),
  unit: z
    .enum(['per_chip', 'per_card', 'per_server', 'per_hour_cloud', 'per_month_cloud'])
    .optional()
    .describe('What the price is for. Defaults to per_chip.'),
  region: z.string().optional().describe('e.g. "US", "CN-PRC", "EU"'),
  source: z.string().optional(),
  notes: z.string().optional(),
});
export type PricePoint = z.infer<typeof PricePointSchema>;

// ── News / tracking items ──────────────────────────────────────────────

export const NewsItemSchema = z.object({
  id: z.string().min(1).describe('Stable id, e.g. "2026-06-nvidia-rubin-tape-out"'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1),
  summary: z.string().min(1).describe('1-3 sentences. The agent surfaces this verbatim.'),
  vendors: z.array(VendorEnum).optional(),
  skus: z.array(z.string()).optional(),
  topics: z
    .array(z.string())
    .optional()
    .describe('Free-form tags, e.g. ["allocation", "yield", "earnings"]'),
  url: z.string().url().optional(),
  source: z.string().optional(),
  confidence: z.enum(['public', 'analyst', 'rumour', 'leak']).optional(),
});
export type NewsItem = z.infer<typeof NewsItemSchema>;

// ── Document corpus (earnings transcripts, analyst notes) ─────────────

export const DocTypeEnum = z.enum(['earnings', 'research', 'filing', 'memo', 'other']);
export type DocType = z.infer<typeof DocTypeEnum>;

export const DocMetaSchema = z.object({
  id: z.string().min(1).describe('Stable id, e.g. "2026-Q1-NVDA-earnings"'),
  type: DocTypeEnum,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // For earnings calls: the issuer's ticker. For research notes: the
  // covered company. Multiple allowed if a research note covers a basket.
  tickers: z.array(z.string()).optional(),
  // For earnings: "NVDA Q1 FY27 Earnings Call". For research: the title
  // of the broker's note.
  title: z.string().min(1),
  // For earnings: "NVIDIA". For research: the broker / analyst firm.
  source: z.string().optional(),
  // Free-form tags so the model can filter on topic.
  topics: z.array(z.string()).optional(),
  confidence: z.enum(['public', 'paywalled', 'internal']).optional(),
  url: z.string().url().optional(),
});
export type DocMeta = z.infer<typeof DocMetaSchema>;

// A chunk produced by the build-time indexer over earnings + research.
// Shape mirrors agentArticleIndex chunks so the same TF-IDF code can run
// against both corpora. sectionHint = the heading nearest above the chunk.
export type DocChunk = {
  id: string;
  type: DocType;
  date: string;
  title: string;
  source?: string;
  tickers?: string[];
  topics?: string[];
  url?: string;
  sectionHint: string;
  text: string;
};

export type DocIndex = {
  generatedAt: string;
  chunks: DocChunk[];
};

// ── Loader-level types ─────────────────────────────────────────────────

export type LoadedDataset<T> = {
  items: T[];
  source: string;
  loadedAt: string;
  invalidCount: number; // entries we skipped due to schema failure
};
