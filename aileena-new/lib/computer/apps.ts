import { z } from 'zod';

/**
 * Site computer apps. Each app saves one JSON file in the actor's own
 * Cloudflare Computer workspace (owner DO or visitor `v-…` DO).
 */
export const COMPUTER_APP_IDS = ['notes', 'mines', 'snake', 'timemachine'] as const;
export type ComputerAppId = (typeof COMPUTER_APP_IDS)[number];

const count = z.number().int().min(0).max(1_000_000);
const id = z.string().min(1).max(40);
const iso = z.string().max(40);
const webUrl = z
  .string()
  .max(500)
  .url()
  .refine((value) => /^https?:\/\//i.test(value), 'http(s) only');

export const APP_STATE_SCHEMAS = {
  notes: z.object({
    notes: z
      .array(z.object({ id, title: z.string().max(120), body: z.string().max(4000), updatedAt: iso }))
      .max(50),
  }),
  mines: z.object({
    wins: count,
    losses: count,
    bestSeconds: z.number().int().min(1).max(99_999).nullable(),
  }),
  snake: z.object({ best: count, games: count }),
  timemachine: z.object({
    visits: z
      .array(
        z.object({
          id,
          url: webUrl,
          year: z.number().int().min(1996).max(2100),
          timestamp: z.string().regex(/^\d{14}$/),
          note: z.string().max(280),
          savedAt: iso,
        }),
      )
      .max(30),
  }),
} satisfies Record<ComputerAppId, z.ZodTypeAny>;

export type ComputerAppState = { [K in ComputerAppId]: z.infer<(typeof APP_STATE_SCHEMAS)[K]> };

export const DEFAULT_APP_STATE: ComputerAppState = {
  notes: { notes: [] },
  mines: { wins: 0, losses: 0, bestSeconds: null },
  snake: { best: 0, games: 0 },
  timemachine: { visits: [] },
};

export const APP_STATE_MAX_BYTES = 64 * 1024;

export function isComputerAppId(value: unknown): value is ComputerAppId {
  return typeof value === 'string' && (COMPUTER_APP_IDS as readonly string[]).includes(value);
}

export function appStatePath(app: ComputerAppId): string {
  return `/workspace/scratch/apps/${app}.json`;
}

export function parseAppState<K extends ComputerAppId>(app: K, value: unknown): ComputerAppState[K] | null {
  const parsed = APP_STATE_SCHEMAS[app].safeParse(value);
  return parsed.success ? (parsed.data as ComputerAppState[K]) : null;
}
