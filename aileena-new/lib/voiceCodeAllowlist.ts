/**
 * Owner Voice → code write allowlist.
 *
 * There is no Footer.tsx. Console + footer live in these real files:
 * - components/AgentChat.tsx — Console overlay, including bottom footer chrome
 *   (quota chips, Voice → code, leave-a-note). Canonical “fix the Console footer”.
 * - lib/translations.ts — site footer copy (`hero.footer`, `footer.body` / columns).
 *
 * Public /api/voice-code never uses this list. Owner apply is the only writer.
 */

export const VOICE_CODE_WRITE_ALLOWLIST = [
  'components/AgentChat.tsx',
  'lib/translations.ts',
] as const;

export type VoiceCodeWritePath = (typeof VOICE_CODE_WRITE_ALLOWLIST)[number];

const ALLOW = new Set<string>(VOICE_CODE_WRITE_ALLOWLIST);

/** Normalize a unified-diff path to an allowlist key (app-root relative). */
export function normalizeVoiceCodePath(raw: string): string | null {
  let p = raw.trim().replace(/\\/g, '/');
  if (!p || p === '/dev/null') return null;
  if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1);
  p = p.replace(/^[ab]\//, '');
  p = p.replace(/^\/+/, '');
  if (p.startsWith('aileena-new/')) p = p.slice('aileena-new/'.length);
  if (!p || p.includes('\0')) return null;
  const parts = p.split('/').filter(Boolean);
  if (parts.some((seg) => seg === '.' || seg === '..')) return null;
  return parts.join('/');
}

export function isAllowedVoiceCodePath(raw: string): raw is VoiceCodeWritePath {
  const n = normalizeVoiceCodePath(raw);
  return n != null && ALLOW.has(n);
}

export function allowlistError(path: string): string {
  return `Path not on Console/footer allowlist: ${path}. Allowed: ${VOICE_CODE_WRITE_ALLOWLIST.join(', ')}.`;
}
