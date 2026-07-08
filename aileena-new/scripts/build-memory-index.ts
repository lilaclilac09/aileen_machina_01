/**
 * Build-time indexer for aileena_second_brain memories.
 * ReMeLight pattern: Markdown on disk → JSON index for edge TF-IDF retrieval.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

type MemoryTier = 'personal' | 'semantic' | 'episodic' | 'procedural' | 'archived' | 'prompt';

type Chunk = {
  path: string;
  tier: MemoryTier;
  title: string;
  section: string;
  text: string;
};

type Index = {
  generatedAt: string;
  chunkCount: number;
  chunks: Chunk[];
};

const ROOT = process.cwd();
const BRAIN = join(ROOT, 'aileena_second_brain');
const MEMORIES = join(BRAIN, 'memories');
const PROMPTS = join(BRAIN, 'prompts');
const OUT = join(ROOT, 'lib', 'memoryIndex.json');

const CHUNK_MIN = 120;
const CHUNK_MAX = 520;

function tierFromPath(rel: string): MemoryTier {
  if (rel.startsWith('prompts/')) return 'prompt';
  const parts = rel.replace(/^memories\//, '').split('/');
  const t = parts[0];
  if (t === 'personal' || t === 'semantic' || t === 'episodic' || t === 'archived') return t;
  if (t === 'procedural') return 'procedural';
  return 'semantic';
}

function titleFromMarkdown(content: string, fallback: string): string {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function chunkBody(text: string, path: string, tier: MemoryTier, docTitle: string): Chunk[] {
  const sections = text.split(/\n(?=##\s+)/);
  const out: Chunk[] = [];

  for (const block of sections) {
    const trimmed = block.trim();
    if (trimmed.length < 40) continue;

    const secMatch = trimmed.match(/^##\s+(.+)/);
    const section = secMatch ? secMatch[1].trim() : docTitle;

    if (trimmed.length <= CHUNK_MAX) {
      out.push({ path, tier, title: docTitle, section, text: trimmed });
      continue;
    }

    const paras = trimmed.split(/\n\n+/);
    let buf = '';
    for (const p of paras) {
      if ((buf + '\n\n' + p).length > CHUNK_MAX && buf.length >= CHUNK_MIN) {
        out.push({ path, tier, title: docTitle, section, text: buf.trim() });
        buf = p;
      } else {
        buf = buf ? buf + '\n\n' + p : p;
      }
    }
    if (buf.trim().length >= 40) {
      out.push({ path, tier, title: docTitle, section, text: buf.trim() });
    }
  }

  return out;
}

function walkMd(dir: string, base: string, acc: string[]): void {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkMd(full, base, acc);
    else if (name.endsWith('.md')) acc.push(relative(base, full));
  }
}

function main() {
  const files: string[] = [];
  walkMd(MEMORIES, BRAIN, files);
  walkMd(PROMPTS, BRAIN, files);

  const chunks: Chunk[] = [];
  for (const rel of files.sort()) {
    const abs = join(BRAIN, rel);
    const raw = readFileSync(abs, 'utf8');
    const baseName = rel.split('/').pop()?.replace(/\.md$/, '') ?? rel;
    const docTitle = titleFromMarkdown(raw, baseName);
    const tier = tierFromPath(rel);
    chunks.push(...chunkBody(raw, rel, tier, docTitle));
  }

  const index: Index = {
    generatedAt: new Date().toISOString(),
    chunkCount: chunks.length,
    chunks,
  };

  writeFileSync(OUT, JSON.stringify(index, null, 2));
  console.log(`[build-memory-index] ${chunks.length} chunks from ${files.length} files → ${OUT}`);
}

main();
