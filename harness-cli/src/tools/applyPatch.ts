import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, isAbsolute } from 'node:path';
import type { ToolDefinition } from '../core/types.ts';

function safePath(cwd: string, p: string): string {
  const abs = resolve(cwd, p);
  const rel = relative(cwd, abs);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`path escapes cwd: ${p}`);
  }
  return abs;
}

/**
 * Minimal unified-diff applier (create/update files).
 * Enough for harness demos — not a full patch(1).
 */
export function applyUnifiedDiff(cwd: string, patch: string): string {
  const lines = patch.replace(/\r\n/g, '\n').split('\n');
  const reports: string[] = [];
  let i = 0;

  while (i < lines.length) {
    while (i < lines.length && !lines[i].startsWith('--- ')) i++;
    if (i >= lines.length) break;

    const fromLine = lines[i++].slice(4).trim(); // a/path or /dev/null
    if (!lines[i]?.startsWith('+++ ')) {
      throw new Error(`expected +++ after ${fromLine}`);
    }
    const toLine = lines[i++].slice(4).trim(); // b/path

    const strip = (s: string) => s.replace(/^[ab]\//, '');
    const targetRel = toLine === '/dev/null' ? strip(fromLine) : strip(toLine);
    if (!targetRel || targetRel === '/dev/null') {
      throw new Error('cannot determine target path');
    }
    const target = safePath(cwd, targetRel);

    const hunks: string[][] = [];
    while (i < lines.length && lines[i].startsWith('@@')) {
      i++; // skip @@ header
      const body: string[] = [];
      while (
        i < lines.length &&
        !lines[i].startsWith('@@') &&
        !lines[i].startsWith('--- ')
      ) {
        body.push(lines[i++]);
      }
      hunks.push(body);
    }

    if (toLine === '/dev/null') {
      // delete not implemented in v0 — report
      reports.push(`skip delete ${targetRel}`);
      continue;
    }

    let content = existsSync(target) ? readFileSync(target, 'utf8') : '';
    // For v0: if file missing or single hunk of only '+' lines, treat as full write from patch adds
    const added = hunks
      .flat()
      .filter((l) => l.startsWith('+'))
      .map((l) => l.slice(1));
    const removed = hunks
      .flat()
      .filter((l) => l.startsWith('-'))
      .map((l) => l.slice(1));
    const context = hunks
      .flat()
      .filter((l) => l.startsWith(' ') || l === '')
      .map((l) => (l.startsWith(' ') ? l.slice(1) : l));

    if (!existsSync(target) || content.length === 0) {
      content = added.join('\n');
      if (content.length && !content.endsWith('\n') && added.length) content += '\n';
    } else if (removed.length === 0 && context.length === 0) {
      // append-only style
      content = content.endsWith('\n') ? content + added.join('\n') : content + '\n' + added.join('\n');
      if (!content.endsWith('\n')) content += '\n';
    } else {
      // naive: replace first removed block with added
      const oldBlock = removed.join('\n');
      const newBlock = added.join('\n');
      if (oldBlock && content.includes(oldBlock)) {
        content = content.replace(oldBlock, newBlock);
      } else if (added.length && !removed.length) {
        content = content.endsWith('\n') ? content + added.join('\n') + '\n' : content + '\n' + added.join('\n') + '\n';
      } else {
        throw new Error(`apply_patch: could not match context in ${targetRel}`);
      }
    }

    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, 'utf8');
    reports.push(`updated ${relative(cwd, target)}`);
  }

  if (!reports.length) throw new Error('apply_patch: no file hunks found');
  return reports.join('\n');
}

export const applyPatchTool: ToolDefinition = {
  name: 'apply_patch',
  description: 'Apply a unified diff patch under cwd (create/update files).',
  parameters: {
    type: 'object',
    properties: {
      patch: { type: 'string', description: 'Unified diff text' },
    },
    required: ['patch'],
  },
  async execute(args, ctx) {
    return applyUnifiedDiff(ctx.cwd, String(args.patch ?? ''));
  },
};
