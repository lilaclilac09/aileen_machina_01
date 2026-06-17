#!/usr/bin/env tsx
/**
 * Build-time bundler for Aileen's tracked-data files.
 *
 * Two jobs:
 *
 * 1. JSONL → JSON. Pricing observations and news items are stored as
 *    JSONL so they're append-friendly. The edge runtime can't read fs,
 *    so we pre-bundle each .jsonl into a sibling .json (parsed array)
 *    that lib/data/* can import as a static module.
 *
 *      data/pricing.jsonl  →  data/pricing.json
 *      data/news.jsonl     →  data/news.json
 *
 *    If the .jsonl is absent, an empty array is written so the module
 *    imports still succeed. data/skus.json is hand-authored — left
 *    alone.
 *
 * 2. Document chunking. Walks data/earnings/ and data/research/ for
 *    *.md / *.txt files. Each file has YAML front-matter (--- delimited)
 *    with metadata (id / date / title / source / tickers / topics /
 *    url / confidence). Body is chunked into ~500-char passages broken
 *    at blank lines + heading boundaries. Output goes to
 *    lib/dataDocIndex.json with shape { generatedAt, chunks[] }.
 *
 * Run via `pnpm build:data-index` or as part of `pnpm build`.
 */

import { promises as fs } from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(REPO_ROOT, 'data');
const OUT_DOC_INDEX = path.join(REPO_ROOT, 'lib', 'dataDocIndex.json');

// ─── JSONL → JSON ──────────────────────────────────────────────────────

async function bundleJsonl(base: string): Promise<void> {
  const jsonlPath = path.join(DATA_DIR, `${base}.jsonl`);
  const jsonPath = path.join(DATA_DIR, `${base}.json`);

  let lines: string[] = [];
  try {
    const raw = await fs.readFile(jsonlPath, 'utf-8');
    lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('//'));
  } catch {
    // No .jsonl file — write empty array so module import still works.
    await fs.writeFile(jsonPath, '[]\n', 'utf-8');
    console.log(`[build-data-index] ${base}.jsonl absent → wrote empty ${base}.json`);
    return;
  }

  const items: unknown[] = [];
  let bad = 0;
  for (const line of lines) {
    try {
      items.push(JSON.parse(line));
    } catch (e) {
      bad++;
      if (bad <= 3) console.warn(`[build-data-index] ${base}.jsonl: invalid JSON line —`, e);
    }
  }
  if (bad > 3) console.warn(`[build-data-index] ${base}.jsonl: ${bad - 3} more invalid lines suppressed`);

  await fs.writeFile(jsonPath, JSON.stringify(items, null, 2) + '\n', 'utf-8');
  console.log(`[build-data-index] ${base}.jsonl → ${base}.json (${items.length} items, ${bad} bad)`);
}

// ─── Document chunker ──────────────────────────────────────────────────

type DocType = 'earnings' | 'research' | 'filing' | 'memo' | 'other';

type FrontMatter = {
  id: string;
  type: DocType;
  date: string;
  title: string;
  source?: string;
  tickers?: string[];
  topics?: string[];
  url?: string;
  confidence?: string;
};

type Chunk = {
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

function parseFrontMatter(raw: string): { fm: FrontMatter | null; body: string } {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { fm: null, body: raw };

  const yamlBlock = m[1];
  const body = raw.slice(m[0].length);
  const fm: Record<string, unknown> = {};
  for (const line of yamlBlock.split(/\r?\n/)) {
    const kv = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let val: unknown = kv[2].trim();
    if (typeof val === 'string') {
      // strip surrounding quotes
      val = val.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
      // list shorthand: [a, b, c]
      const list = (val as string).match(/^\[(.*)\]$/);
      if (list) {
        val = list[1]
          .split(',')
          .map((s) => s.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1'))
          .filter(Boolean);
      }
    }
    fm[key] = val;
  }
  return { fm: fm as unknown as FrontMatter, body };
}

const CHUNK_TARGET = 500;
const CHUNK_MAX = 700;

function chunkBody(body: string): { sectionHint: string; text: string }[] {
  const out: { sectionHint: string; text: string }[] = [];
  let section = 'Intro';
  const paragraphs = body.split(/\n\s*\n/);

  let buf = '';
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    // Heading? Update sectionHint, don't include the # marks in chunk text.
    const heading = trimmed.match(/^#{1,4}\s+(.*)$/);
    if (heading) {
      if (buf.length > 0) {
        out.push({ sectionHint: section, text: buf.trim() });
        buf = '';
      }
      section = heading[1].trim();
      continue;
    }
    // Q&A markers in earnings transcripts — treat as their own section
    // when they show "Analyst — Question" / "CFO — Answer" patterns.
    const qa = trimmed.match(/^([A-Z][A-Za-z. ]{2,40})\s+[—\-:]\s+([A-Z].*)/);
    if (qa) {
      if (buf.length > CHUNK_TARGET) {
        out.push({ sectionHint: section, text: buf.trim() });
        buf = '';
      }
    }

    if (buf.length + trimmed.length + 2 > CHUNK_MAX) {
      out.push({ sectionHint: section, text: buf.trim() });
      buf = trimmed;
    } else {
      buf = buf.length === 0 ? trimmed : `${buf}\n\n${trimmed}`;
      if (buf.length >= CHUNK_TARGET) {
        out.push({ sectionHint: section, text: buf.trim() });
        buf = '';
      }
    }
  }
  if (buf.length > 0) out.push({ sectionHint: section, text: buf.trim() });
  return out;
}

async function walk(dir: string): Promise<string[]> {
  let entries: { name: string; isDirectory(): boolean; isFile(): boolean }[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (e.isFile() && /\.(md|txt|markdown)$/i.test(e.name) && !e.name.startsWith('.')) {
      out.push(full);
    }
  }
  return out;
}

async function buildDocIndex(): Promise<void> {
  const docDirs = [
    { dir: path.join(DATA_DIR, 'earnings'), type: 'earnings' as DocType },
    { dir: path.join(DATA_DIR, 'research'), type: 'research' as DocType },
  ];
  const chunks: Chunk[] = [];
  let fileCount = 0;
  let bad = 0;

  for (const { dir, type } of docDirs) {
    const files = await walk(dir);
    for (const file of files) {
      const raw = await fs.readFile(file, 'utf-8');
      const { fm, body } = parseFrontMatter(raw);
      if (!fm || !fm.id || !fm.date || !fm.title) {
        bad++;
        if (bad <= 3) {
          console.warn(`[build-data-index] ${path.relative(REPO_ROOT, file)}: missing front-matter (need id/date/title)`);
        }
        continue;
      }
      // Front-matter `type` overrides the directory default if set.
      const docType = (fm.type as DocType) ?? type;
      const docChunks = chunkBody(body);
      for (const c of docChunks) {
        chunks.push({
          id: fm.id,
          type: docType,
          date: fm.date,
          title: fm.title,
          source: fm.source,
          tickers: fm.tickers,
          topics: fm.topics,
          url: fm.url,
          sectionHint: c.sectionHint,
          text: c.text,
        });
      }
      fileCount++;
    }
  }

  if (bad > 3) console.warn(`[build-data-index] ${bad - 3} more docs with bad front-matter suppressed`);

  const index = {
    generatedAt: new Date().toISOString(),
    chunks,
  };
  await fs.writeFile(OUT_DOC_INDEX, JSON.stringify(index, null, 2) + '\n', 'utf-8');
  console.log(`[build-data-index] doc index: ${fileCount} files → ${chunks.length} chunks → ${path.relative(REPO_ROOT, OUT_DOC_INDEX)}`);
}

// ─── Run ───────────────────────────────────────────────────────────────

async function main() {
  await Promise.all([bundleJsonl('pricing'), bundleJsonl('news')]);
  await buildDocIndex();
}

main().catch((e) => {
  console.error('[build-data-index] fatal:', e);
  process.exit(1);
});
