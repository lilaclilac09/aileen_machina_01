/**
 * Visitor-facing Console prefix copy. Tiny on purpose — imported by
 * the client overlay. Do not put Redis / tool routing here.
 */

export const COMPACTION_PING =
  'Context is full. Fresh thread — earlier turns stay on the desk, not in this kiln.';

export const MODEL_SWAP_PING =
  'Switching brains. Fresh thread — Cloud and on-device do not share a prefix.';

export const ACCENT_SWAP_PING =
  'Accent changed. Fresh thread — spoken register stays frozen for one root.';

export type NewRootReason = 'compaction' | 'model_swap' | 'accent_swap';

export function pingForNewRootReason(reason: string | undefined, fallback?: string): string {
  if (reason === 'model_swap') return MODEL_SWAP_PING;
  if (reason === 'accent_swap') return ACCENT_SWAP_PING;
  if (reason === 'compaction') return COMPACTION_PING;
  return fallback || COMPACTION_PING;
}

/** Parse /api/chat 409 JSON (also useChat error.message, which may wrap JSON). */
export function parseNewRootError(raw: string): { reason: NewRootReason | string; message: string } | null {
  const t = raw.trim();
  if (!t) return null;
  const jsonStart = t.indexOf('{');
  const jsonEnd = t.lastIndexOf('}');
  if (jsonStart < 0 || jsonEnd <= jsonStart) return null;
  let parsed: { code?: unknown; reason?: unknown; error?: unknown };
  try {
    parsed = JSON.parse(t.slice(jsonStart, jsonEnd + 1)) as typeof parsed;
  } catch {
    return null;
  }
  if (parsed.code !== 'new_root') return null;
  const reason = typeof parsed.reason === 'string' ? parsed.reason : 'compaction';
  const fallback = typeof parsed.error === 'string' ? parsed.error : COMPACTION_PING;
  return { reason, message: pingForNewRootReason(reason, fallback) };
}

/** This root's speaking model. Empty lock is unset — never default to DeepSeek. */
export type RootKind = 'unset' | 'deepseek' | 'on-device' | 'qwen' | 'fallback' | 'named';

export function classifyRootProvider(provider: string | undefined): RootKind {
  const p = (provider ?? '').trim().toLowerCase();
  if (!p) return 'unset';
  if (p === 'deepseek' || p.startsWith('deepseek')) return 'deepseek';
  if (p.includes('qwen')) return 'qwen';
  if (p === 'on-device' || p === 'browser' || p === 'nano' || p.includes('gemini')) {
    return 'on-device';
  }
  if (p.startsWith('fallback:') || p === 'fallback') return 'fallback';
  return 'named';
}

function namedProviderLabel(provider: string): string {
  const raw = provider.trim();
  const token = raw.split(/[/:]/)[0] || raw;
  return token.slice(0, 32);
}

/**
 * Visitor line when they ask what model this is.
 * Names THIS root only. Empty lock does not say DeepSeek.
 */
export function machinaRootSpoken(provider: string | undefined, lang: 'en' | 'zh' = 'en'): string {
  const kind = classifyRootProvider(provider);
  if (lang === 'zh') {
    if (kind === 'unset') {
      return 'Machina，Aileen 站点上的控制台。不是 dsh。这一根的模型在锁定后才点名。';
    }
    if (kind === 'qwen') {
      return 'Machina，Aileen 站点上的控制台。这一根是端上的 Qwen，不是 DeepSeek，也不是 dsh。';
    }
    if (kind === 'on-device') {
      return 'Machina，Aileen 站点上的控制台。这一根跑在端上，不是 DeepSeek，也不是 dsh。';
    }
    if (kind === 'fallback') {
      return 'Machina，Aileen 站点上的控制台。这一根是 modelRouter 的备用模型，不是 DeepSeek Harness。';
    }
    if (kind === 'named') {
      return `Machina，Aileen 站点上的控制台。这一根是 ${namedProviderLabel(provider ?? '')}，不是 dsh。`;
    }
    return 'Machina，Aileen 站点上的控制台。这一根是 DeepSeek（modelRouter），不是 dsh — dsh 是本地写代码的运行时，不是这颗球。';
  }
  if (kind === 'unset') {
    return "Machina — Aileen's site console. Not dsh. This root names its model when the session locks.";
  }
  if (kind === 'qwen') {
    return "Machina — Aileen's site console. This root is Qwen on-device, not DeepSeek and not dsh.";
  }
  if (kind === 'on-device') {
    return "Machina — Aileen's site console. This root is on-device, not DeepSeek and not dsh.";
  }
  if (kind === 'fallback') {
    return "Machina — Aileen's site console. This root is a fallback via modelRouter, not DeepSeek Harness.";
  }
  if (kind === 'named') {
    return `Machina — Aileen's site console. This root is ${namedProviderLabel(provider ?? '')}, not dsh.`;
  }
  return "Machina — Aileen's site console. This root is DeepSeek via modelRouter, not dsh — dsh is a local coding runtime, not this orb.";
}

/** Frozen-prefix block. Names THIS root's provider only. New root after 409 may say Qwen. */
export function frozenRootIdentity(provider: string | undefined): string {
  const kind = classifyRootProvider(provider);
  const modelLine =
    kind === 'unset'
      ? 'This root has no speaking-model lock yet. Do not claim DeepSeek, Qwen, Claude, GPT, or dsh until the lock is set.'
      : kind === 'qwen'
        ? "This root's speaking model is Qwen on-device. You are not DeepSeek and not DeepSeek Harness (dsh)."
        : kind === 'on-device'
          ? "This root's speaking model is on-device (Chrome Prompt API). You are not DeepSeek and not DeepSeek Harness (dsh)."
          : kind === 'fallback'
            ? "This root's speaking model is a fallback via modelRouter. You are not DeepSeek Harness (dsh)."
            : kind === 'named'
              ? `This root's speaking model is ${namedProviderLabel(provider ?? '')}. You are not DeepSeek Harness (dsh).`
              : "This root's speaking model is DeepSeek via modelRouter (Shanghai register when Voice is on). You are not DeepSeek Harness (dsh).";
  return `
# This root
You are Machina, Aileen's site console on aileena.xyz.
${modelLine} dsh is a local coding runtime, not this orb.
This line names the provider of THIS root only. After a new-root ping, do not keep the previous provider name.
If asked what model you are / 你是什么模型 / who you run on: one or two short sentences, kiln/desk, Berlin-dry. Do not waffle. Do not claim Claude, GPT, or dsh. Do not dump a model card.`;
}
