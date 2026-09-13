/**
 * Owner voice→code into the computer workspace (scratch only).
 * Not repo apply. Not public /api/voice-code (that stays propose-only).
 */
import { generateText } from 'ai';
import { classifyModelError, createModelAbortSignal, degradeMessage, recordModelFailure, recordModelSuccess, routeModel } from '../modelRouter';
import { extractSpokenPath } from './spokenCli';
import { isWritePath, resolveCwd, WORKSPACE_ROOT } from './terminal';

export function parseVcode(raw: string): { pathHint: string; prompt: string } | null {
  const t = raw.trim();
  if (!/^vcode\b/i.test(t)) return null;
  const rest = t.replace(/^vcode\b/i, '').trim();
  if (!rest) return { pathHint: '', prompt: 'write a small typed example' };
  const nl = rest.indexOf('\n');
  const first = (nl === -1 ? rest : rest.slice(0, nl)).trim();
  const body = nl === -1 ? '' : rest.slice(nl + 1).trim();
  if (/^[\w./-]+\.\w{1,8}$/.test(first) || first.startsWith('scratch/') || first.startsWith('/workspace/')) {
    return { pathHint: first, prompt: body || `write ${first}` };
  }
  const fromTokens = extractSpokenPath(first) || extractSpokenPath(rest);
  if (fromTokens) return { pathHint: fromTokens, prompt: body || rest };
  return { pathHint: '', prompt: rest };
}

export function looksLikeSource(text: string): boolean {
  const t = text.trim();
  return /^(export |import |function |const |let |class |type |interface |<!DOCTYPE|{)/.test(t);
}

function defaultVcodePath(hint: string, cwd: string): string | null {
  if (hint) return resolveCwd(cwd, hint);
  const stamp = Date.now().toString(36);
  return resolveCwd(WORKSPACE_ROOT, `scratch/vcode/${stamp}.ts`);
}

function extractGeneratedFile(text: string): { path?: string; body: string } | null {
  const fenceJson = /```json\s*([\s\S]*?)```/i.exec(text);
  const raw = (fenceJson?.[1] || text).trim();
  try {
    const j = JSON.parse(raw) as { path?: string; body?: string };
    if (typeof j.body === 'string' && j.body.trim()) return { path: j.path, body: j.body };
  } catch {
    /* not json */
  }
  const fence = /```(?:ts|tsx|js|javascript|typescript)?\s*([\s\S]*?)```/i.exec(text);
  if (fence?.[1]?.trim()) return { body: fence[1].trim() };
  return null;
}

export async function generateScratchFile(
  prompt: string,
  cwd: string,
  pathHint = '',
): Promise<{ ok: true; path: string; body: string } | { ok: false; text: string }> {
  const dest = defaultVcodePath(pathHint, cwd);
  if (!dest || !isWritePath(dest)) {
    return { ok: false, text: 'vcode only under scratch/reports/artifacts' };
  }
  if (looksLikeSource(prompt) && pathHint) {
    return { ok: true, path: dest, body: prompt };
  }

  const decision = routeModel({ toolRoute: 'voice_code', lastQuestion: prompt });
  if (decision.mode === 'degrade') {
    return { ok: false, text: decision.message };
  }
  try {
    const result = await generateText({
      model: decision.pick.model,
      system: `You write ONE file for Aileena's worker-shell computer.
Return JSON only: {"path":"${dest}","body":"<file contents>"}.
path must stay under /workspace/scratch/ or /workspace/reports/ or /workspace/artifacts/.
No git. No pnpm. No invented repo files. English comments if needed.`,
      prompt: `cwd: ${cwd}\nask:\n${prompt.slice(0, 2000)}`,
      maxOutputTokens: 1200,
      abortSignal: createModelAbortSignal(20_000),
    });
    recordModelSuccess();
    const extracted = extractGeneratedFile(result.text || '');
    if (!extracted?.body) return { ok: false, text: 'vcode empty — say a file and what it should do' };
    const path = extracted.path ? resolveCwd(cwd, extracted.path) : dest;
    if (!path || !isWritePath(path)) return { ok: false, text: 'vcode path stayed outside scratch' };
    return { ok: true, path, body: extracted.body };
  } catch (err) {
    recordModelFailure(err);
    const { reason } = classifyModelError(err);
    return { ok: false, text: degradeMessage(reason, prompt) };
  }
}
