/**
 * Voice-to-code intent — shared by Console client (pack).
 * Keep in sync with /api/voice-code expectations.
 */

export const VCODE_DAILY_LIMIT = 5;
export const VCODE_SESSION_KEY = 'aileena_vcode_count_daily_v1';

/**
 * Idle chat must not burn vcode. Only implement / write code / 写代码 /
 * an explicit Voice → code chip (or close Chinese coding verbs).
 * Bare English "fix" is not enough — it must pair with a code/patch ask.
 */
const INTENT_RE =
  /(\bimplement\b|write code|改代码|写代码|修bug|修代码|重构)/i;
const FIX_PAIRED_RE =
  /\bfix\b.{0,40}\b(code|bug|patch|implement|footer|console)\b|\b(code|bug|patch|implement|footer|console)\b.{0,40}\bfix\b/i;

/** True when the utterance should burn a voice-code quota slot (not chat 20). */
export function isVoiceCodeIntent(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/^voice\s*→\s*code/i.test(t) || /^voice\s*->\s*code/i.test(t)) return true;
  return INTENT_RE.test(t) || FIX_PAIRED_RE.test(t);
}

export function quotaDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function readStoredVcodeCount(): number {
  try {
    const today = quotaDayKey();
    const raw = localStorage.getItem(VCODE_SESSION_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date?: unknown; count?: unknown };
    if (parsed.date !== today) return 0;
    const n = Number(parsed.count);
    return Number.isFinite(n) ? Math.max(0, Math.min(n, 99)) : 0;
  } catch {
    return 0;
  }
}

export function writeStoredVcodeCount(count: number): void {
  try {
    localStorage.setItem(
      VCODE_SESSION_KEY,
      JSON.stringify({ count: Math.max(0, Math.min(count, 99)), date: quotaDayKey() }),
    );
  } catch {
    /* private mode */
  }
}
