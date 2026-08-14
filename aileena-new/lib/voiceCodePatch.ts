/**
 * Unified-diff extract + parse for Voice → code.
 * Edge-safe (no fs). Owner apply lives in voiceCodeApply.ts.
 * Not DeepSeek Harness / dsh.
 */

import { normalizeVoiceCodePath } from './voiceCodeAllowlist';

export type PatchFile = {
  from: string;
  to: string;
  rel: string;
  hunks: Hunk[];
};

export type Hunk = {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: string[];
};

const DIFF_FENCE = /```(?:diff|patch)\s*\n([\s\S]*?)```/i;

export function extractUnifiedDiff(text: string): string | null {
  const t = text.replace(/\r\n/g, '\n');
  const fenced = t.match(DIFF_FENCE);
  if (fenced?.[1] && /^(--- |\+\+\+ |diff --git )/m.test(fenced[1])) {
    return fenced[1].trim() + '\n';
  }
  const start = t.search(/^(diff --git |--- )/m);
  if (start < 0) return null;
  const rest = t.slice(start);
  if (!/^--- /m.test(rest) || !/^\+\+\+ /m.test(rest)) return null;
  return rest.trim() + '\n';
}

export function patchFilename(day = new Date()): string {
  const y = day.getUTCFullYear();
  const m = String(day.getUTCMonth() + 1).padStart(2, '0');
  const d = String(day.getUTCDate()).padStart(2, '0');
  return `aileena-vcode-${y}-${m}-${d}.patch`;
}

/** Downloadable .patch: unified diff when present, else proposal wrapped as comments. */
export function buildDownloadablePatch(opts: {
  proposal: string;
  prompt?: string;
  remaining?: number;
  limit?: number;
}): { patch: string; filename: string; hasDiff: boolean } {
  const filename = patchFilename();
  const extracted = extractUnifiedDiff(opts.proposal);
  const header = [
    `# aileena.xyz Voice → code`,
    `# door: public propose-only — nothing was written`,
    `# generated: ${new Date().toISOString()}`,
    opts.prompt ? `# ask: ${opts.prompt.replace(/\s+/g, ' ').slice(0, 200)}` : null,
    typeof opts.remaining === 'number' && typeof opts.limit === 'number'
      ? `# remaining: ${opts.remaining}/${opts.limit}`
      : null,
    `# apply: false`,
    `# write_target: null`,
    `# harness: propose-only`,
    `#`,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n');

  if (extracted) {
    return { patch: `${header}\n${extracted}`, filename, hasDiff: true };
  }
  return {
    patch: `${header}\n# (no unified diff — proposal text follows)\n#\n${opts.proposal.trim()}\n`,
    filename,
    hasDiff: false,
  };
}

function parseHunkHeader(line: string): Omit<Hunk, 'lines'> | null {
  const m = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
  if (!m) return null;
  return {
    oldStart: Number(m[1]),
    oldCount: m[2] == null ? 1 : Number(m[2]),
    newStart: Number(m[3]),
    newCount: m[4] == null ? 1 : Number(m[4]),
  };
}

export function parseUnifiedDiff(patch: string): PatchFile[] {
  const lines = patch.replace(/\r\n/g, '\n').split('\n');
  const files: PatchFile[] = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].startsWith('#') || lines[i].startsWith('diff --git ')) {
      i++;
      continue;
    }
    if (!lines[i].startsWith('--- ')) {
      i++;
      continue;
    }
    const from = lines[i].slice(4).trim();
    i++;
    if (!lines[i]?.startsWith('+++ ')) {
      throw new Error(`expected +++ after ${from}`);
    }
    const to = lines[i].slice(4).trim();
    i++;
    const rel = normalizeVoiceCodePath(to === '/dev/null' ? from : to);
    if (!rel) throw new Error('cannot determine target path');
    const hunks: Hunk[] = [];
    while (i < lines.length && lines[i].startsWith('@@')) {
      const meta = parseHunkHeader(lines[i]);
      if (!meta) throw new Error(`bad hunk header: ${lines[i]}`);
      i++;
      const body: string[] = [];
      while (
        i < lines.length &&
        !lines[i].startsWith('@@') &&
        !lines[i].startsWith('--- ') &&
        !lines[i].startsWith('diff --git ')
      ) {
        const l = lines[i];
        if (l.startsWith('\\')) {
          i++;
          continue;
        }
        if (l.startsWith('+') || l.startsWith('-') || l.startsWith(' ')) {
          body.push(l);
          i++;
          continue;
        }
        if (l === '') {
          i++;
          continue;
        }
        break;
      }
      hunks.push({ ...meta, lines: body });
    }
    files.push({ from, to, rel, hunks });
  }

  return files;
}

export function applyHunksToText(original: string, hunks: Hunk[]): string {
  const src = original.replace(/\r\n/g, '\n').split('\n');
  if (src.length && src[src.length - 1] === '') src.pop();
  const out: string[] = [];
  let cursor = 0;

  for (const hunk of hunks) {
    const start = Math.max(0, hunk.oldStart - 1);
    if (start < cursor) throw new Error('hunks overlap or go backwards');
    out.push(...src.slice(cursor, start));
    cursor = start;
    for (const line of hunk.lines) {
      const tag = line[0] ?? ' ';
      const body = line.slice(1);
      if (tag === ' ' || tag === '') {
        if (cursor >= src.length || src[cursor] !== body) {
          throw new Error(`context mismatch at line ${cursor + 1}`);
        }
        out.push(src[cursor]);
        cursor++;
      } else if (tag === '-') {
        if (cursor >= src.length || src[cursor] !== body) {
          throw new Error(`remove mismatch at line ${cursor + 1}`);
        }
        cursor++;
      } else if (tag === '+') {
        out.push(body);
      } else {
        throw new Error(`bad hunk line: ${line.slice(0, 40)}`);
      }
    }
  }
  out.push(...src.slice(cursor));
  return out.join('\n') + (original.endsWith('\n') || out.length === 0 ? '\n' : '');
}
