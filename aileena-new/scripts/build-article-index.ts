/**
 * Build-time article indexer.
 *
 * Scans aileena-new/app/blog/<slug>/page.tsx files, extracts slug/title/dek/body,
 * strips JSX, chunks the body, and writes lib/agentArticleIndex.json.
 *
 * Run from inside aileena-new/:
 *   tsx scripts/build-article-index.ts
 */

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';

type Chunk = {
  slug: string;
  title: string;
  sectionHint: string;
  text: string;
};

type Index = {
  generatedAt: string;
  chunks: Chunk[];
};

const ROOT = process.cwd();
const BLOG_DIR = join(ROOT, 'app', 'blog');
const OUT_PATH = join(ROOT, 'lib', 'agentArticleIndex.json');

const CHUNK_TARGET_MIN = 400;
const CHUNK_TARGET_MAX = 600;

// ── HTML entity decoder ───────────────────────────────────────────────────────
const ENTITIES: Record<string, string> = {
  '&mdash;': '—',
  '&ndash;': '–',
  '&micro;': 'µ',
  '&yen;': '¥',
  '&hellip;': '…',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
};

function decodeEntities(s: string): string {
  let out = s;
  for (const [k, v] of Object.entries(ENTITIES)) {
    out = out.split(k).join(v);
  }
  // numeric entities
  out = out.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  out = out.replace(/&#x([0-9a-fA-F]+);/g, (_, n) =>
    String.fromCodePoint(parseInt(n, 16)),
  );
  return out;
}

// ── File walk ─────────────────────────────────────────────────────────────────
function walkPages(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      // Skip _substack helpers
      if (entry === '_substack') continue;
      // Skip explainer subdirs (restyled duplicates)
      if (entry === 'explainer') continue;
      out.push(...walkPages(full));
    } else if (entry === 'page.tsx') {
      // Only top-level slug/page.tsx, not slug/explainer/page.tsx
      // (explainer dirs are already skipped above)
      out.push(full);
    }
  }
  return out;
}

// ── Slug ──────────────────────────────────────────────────────────────────────
function slugFromPath(filePath: string): string {
  return basename(dirname(filePath));
}

// ── Extract a prop value from `<SubstackShell ... title=... dek=... >` ───────
// Handles three forms:
//   title="..."            (string literal, escapes \")
//   title={"..."}          (string literal inside braces)
//   title={<>...</>}       (JSX fragment — strip tags inside)
//   title={isDE ? 'A' : 'B'} (conditional — take the English branch)
function extractProp(source: string, propName: string): string {
  // Try double-quoted string literal first
  const reStr = new RegExp(`\\b${propName}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
  const mStr = source.match(reStr);
  if (mStr) {
    return decodeEntities(mStr[1].replace(/\\"/g, '"'));
  }

  // Try a brace-wrapped expression. Find `propName={` and balance braces.
  const idx = source.search(new RegExp(`\\b${propName}\\s*=\\s*\\{`));
  if (idx === -1) return '';
  const braceStart = source.indexOf('{', idx);
  if (braceStart === -1) return '';
  let depth = 0;
  let end = -1;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return '';
  const inner = source.slice(braceStart + 1, end).trim();

  // Conditional: take whichever branch is the English one. Heuristic:
  // `isDE ? <DE> : <EN>` -> EN branch is after the colon.
  // `!isDE ? <EN> : <DE>` -> EN branch is after the question mark.
  const condMatch = inner.match(
    /^!?\s*(?:isDE|isEN)\s*\?\s*([\s\S]+?)\s*:\s*([\s\S]+)$/,
  );
  if (condMatch) {
    const negated = /^!\s*(?:isDE|isEN)/.test(inner);
    const positive = condMatch[1];
    const negative = condMatch[2];
    // For `isDE ? DE : EN`, English is the negative branch.
    // For `!isDE ? EN : DE`, English is the positive branch.
    const pick = negated ? positive : negative;
    return decodeEntities(stripJsx(unwrapStringLiteral(pick)));
  }

  // JSX fragment <>...</> or any JSX content — strip tags
  return decodeEntities(stripJsx(unwrapStringLiteral(inner)));
}

function unwrapStringLiteral(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    const body = t.slice(1, -1);
    return body.replace(/\\'/g, "'").replace(/\\"/g, '"');
  }
  return t;
}

// ── Strip JSX tags + interpolations ──────────────────────────────────────────
function stripJsx(src: string): string {
  let s = src;

  // Remove JSX expression containers {' '} {something}.
  // We need to keep prose, but `{<Link ...>text</Link>}` should be stripped
  // to its text. Replace simple whitespace strings like `{' '}` first.
  s = s.replace(/\{['"`]\s*['"`]\}/g, ' ');

  // Replace `{...}` interpolations with the inner text where it's a string
  // literal; otherwise drop the wrapper braces entirely (leaves the inner).
  // For our corpus, most braces wrap either string literals, Link components,
  // or simple JSX expressions — stripping tags below covers it.

  // Strip all JSX tags <... ...>
  s = s.replace(/<[^>]+>/g, ' ');

  // Now strip remaining braces (just delete them, keep inner content).
  s = s.replace(/[{}]/g, ' ');

  // Strip standalone JS-style operators left from braces, like `' '` artifacts.
  s = s.replace(/(^|\s)['"`]\s*['"`](\s|$)/g, ' ');

  return collapseWs(s);
}

function collapseWs(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// ── Extract the body inside <SubstackShell>...</SubstackShell> ──────────────
function extractBody(source: string): string {
  // Find the opening tag end. Since we're operating on JSX source code, the
  // structure is `<SubstackShell ...>BODY</SubstackShell>`. Find the matching
  // close by string search — there's only ever one SubstackShell per file.
  const openMatch = source.match(/<SubstackShell\b/);
  if (!openMatch || openMatch.index === undefined) return '';

  // Find where the opening tag closes. Walk forward from openMatch.index,
  // counting JSX braces and looking for the first `>` that closes the tag
  // outside of an expression container.
  const openIdx = openMatch.index;
  let i = openIdx;
  let braceDepth = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '{') braceDepth++;
    else if (ch === '}') braceDepth--;
    else if (ch === '>' && braceDepth === 0) {
      break;
    }
    i++;
  }
  if (i >= source.length) return '';
  const bodyStart = i + 1;

  const closeIdx = source.lastIndexOf('</SubstackShell>');
  if (closeIdx === -1 || closeIdx < bodyStart) return '';

  return source.slice(bodyStart, closeIdx);
}

// ── Convert body JSX to chunks with section hints ────────────────────────────
// Strategy:
//   1. Walk through the body source looking for either a SectionLabel or a
//      block-level prose element (<p>, <li>, <ol>, <ul>, <h2>).
//   2. For each chunk source, strip tags + decode entities -> plain text.
//   3. Track the current section hint as the most recent SectionLabel text.
//   4. Group adjacent paragraphs into chunks of ~400-600 chars, breaking at
//      paragraph boundaries.

type Block = { kind: 'section' | 'prose'; text: string };

function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  // Each block is the matched outer element.
  // We do a simple state-machine over the JSX tokens.

  // Find all SectionLabel occurrences (component, with children).
  // <SectionLabel>...</SectionLabel>
  // Also handle <SectionLabel>{...}</SectionLabel>
  const sectionRe =
    /<SectionLabel(?:\s[^>]*)?>([\s\S]*?)<\/SectionLabel>/g;

  // For prose, we match block tags. We also include <h2>, <h3>, <table>.
  const proseRe =
    /<(p|ul|ol|li|h1|h2|h3|h4|blockquote|pre|table|StatsWall)\b[^>]*>([\s\S]*?)<\/\1>/g;

  // Index by position so we can interleave.
  const events: Array<{ pos: number; kind: 'section' | 'prose'; text: string }> =
    [];

  let m: RegExpExecArray | null;
  while ((m = sectionRe.exec(body))) {
    events.push({ pos: m.index, kind: 'section', text: m[1] });
  }
  while ((m = proseRe.exec(body))) {
    events.push({ pos: m.index, kind: 'prose', text: m[2] });
  }

  events.sort((a, b) => a.pos - b.pos);

  for (const ev of events) {
    const cleaned = collapseWs(decodeEntities(stripJsx(ev.text)));
    if (!cleaned) continue;
    blocks.push({ kind: ev.kind, text: cleaned });
  }
  return blocks;
}

function chunkBlocks(
  blocks: Block[],
  slug: string,
  title: string,
): Chunk[] {
  const chunks: Chunk[] = [];
  let currentSection = 'Intro';
  let buffer = '';

  function flush() {
    const t = collapseWs(buffer);
    if (t.length > 0) {
      chunks.push({ slug, title, sectionHint: currentSection, text: t });
    }
    buffer = '';
  }

  for (const block of blocks) {
    if (block.kind === 'section') {
      // Flush any pending prose before switching sections.
      flush();
      currentSection = block.text || currentSection;
      continue;
    }

    const piece = block.text;
    // If a single block is huge, split it on sentence boundaries.
    const pieces = piece.length > CHUNK_TARGET_MAX
      ? splitLongProse(piece)
      : [piece];

    for (const p of pieces) {
      if (!buffer) {
        buffer = p;
      } else if ((buffer + ' ' + p).length <= CHUNK_TARGET_MAX) {
        buffer = buffer + ' ' + p;
      } else if (buffer.length < CHUNK_TARGET_MIN) {
        // Buffer too short — keep growing past max rather than emit a tiny chunk.
        buffer = buffer + ' ' + p;
      } else {
        flush();
        buffer = p;
      }

      if (buffer.length >= CHUNK_TARGET_MAX) {
        flush();
      }
    }
  }
  flush();
  return chunks;
}

function splitLongProse(text: string): string[] {
  // Split on sentence boundaries; aggregate up to CHUNK_TARGET_MAX.
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const s of sentences) {
    const piece = s.trim();
    if (!piece) continue;
    if (!cur) {
      cur = piece;
    } else if ((cur + ' ' + piece).length <= CHUNK_TARGET_MAX) {
      cur = cur + ' ' + piece;
    } else {
      out.push(cur);
      cur = piece;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// ── Per-file pipeline ────────────────────────────────────────────────────────
function indexOne(filePath: string): Chunk[] {
  const source = readFileSync(filePath, 'utf8');
  const slug = slugFromPath(filePath);
  const title = extractProp(source, 'title') || slug;
  // dek goes in as its own chunk at the top under "Intro" so RAG can hit it.
  const dek = extractProp(source, 'dek');
  const body = extractBody(source);
  const blocks = parseBlocks(body);

  // Prepend dek as a synthetic "Intro" prose block if we have one.
  if (dek) {
    blocks.unshift({ kind: 'prose', text: dek });
  }

  return chunkBlocks(blocks, slug, title);
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  const pages = walkPages(BLOG_DIR);
  pages.sort();
  const allChunks: Chunk[] = [];
  for (const p of pages) {
    const chunks = indexOne(p);
    allChunks.push(...chunks);
  }
  const index: Index = {
    generatedAt: new Date().toISOString(),
    chunks: allChunks,
  };
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(index, null, 2) + '\n', 'utf8');
  console.log(
    `[build-article-index] ${pages.length} pages -> ${allChunks.length} chunks`,
  );
  console.log(`[build-article-index] wrote ${OUT_PATH}`);
}

main();
