/**
 * Owner-only allowlisted patch apply. Node runtime (needs fs).
 * Not git apply. Not DeepSeek Harness / dsh.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { allowlistError, isAllowedVoiceCodePath } from './voiceCodeAllowlist';
import { applyHunksToText, parseUnifiedDiff } from './voiceCodePatch';

export type ApplyResult =
  | { ok: true; written: string[] }
  | { ok: false; error: string; status: number; written: string[] };

function safeJoin(root: string, rel: string): string {
  const abs = resolve(root, rel);
  const fromRoot = relative(root, abs);
  if (fromRoot.startsWith('..') || isAbsolute(fromRoot)) {
    throw new Error(`path escapes root: ${rel}`);
  }
  return abs;
}

/**
 * Apply a unified diff under `root`, only to the Console/footer allowlist.
 * Never creates files outside the list. Never deletes. No git.
 * No-op patches return 409, never 200.
 */
export function applyAllowlistedPatch(root: string, patch: string): ApplyResult {
  const trimmed = patch.trim();
  if (!trimmed) {
    return { ok: false, error: 'Empty patch — nothing written.', status: 400, written: [] };
  }

  let files;
  try {
    files = parseUnifiedDiff(trimmed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid patch';
    return { ok: false, error: msg, status: 400, written: [] };
  }

  if (files.length === 0) {
    return { ok: false, error: 'No file hunks in patch — nothing written.', status: 400, written: [] };
  }

  for (const file of files) {
    if (file.to === '/dev/null') {
      return {
        ok: false,
        error: `Deletes are not allowed (${file.rel}).`,
        status: 403,
        written: [],
      };
    }
    if (!isAllowedVoiceCodePath(file.rel)) {
      return { ok: false, error: allowlistError(file.rel), status: 403, written: [] };
    }
  }

  const written: string[] = [];
  try {
    for (const file of files) {
      const abs = safeJoin(root, file.rel);
      const original = readFileSync(abs, 'utf8');
      const next = applyHunksToText(original, file.hunks);
      if (next === original) {
        return {
          ok: false,
          error: `No-op patch for ${file.rel} — nothing written.`,
          status: 409,
          written,
        };
      }
      writeFileSync(abs, next, 'utf8');
      written.push(file.rel);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg, status: 500, written };
  }

  if (written.length === 0) {
    return { ok: false, error: 'No-op write — nothing written.', status: 409, written: [] };
  }

  return { ok: true, written };
}
