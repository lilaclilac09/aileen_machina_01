/**
 * Stable site-agent voice profile.
 * Same accent/voice/style/speed on every chunk of a session.
 * Secrets stay server-side; the client only sends an allowlisted accent.
 */

import {
  ELEVEN_VOICE_ID,
  parseVoiceAccent,
  ttsSpokenInstructions,
  type VoiceAccent,
} from '../voiceAccent';

export const TTS_ACCENT_LANG: Record<VoiceAccent, string> = {
  shanghai: 'zh-CN',
  london: 'en-GB',
  berlin: 'de-DE',
};

export const TTS_OPENAI_VOICE: Record<VoiceAccent, 'coral' | 'sage' | 'onyx'> = {
  shanghai: 'coral',
  london: 'sage',
  berlin: 'onyx',
};

export type SiteAgentTtsProfile = {
  accent: VoiceAccent;
  elevenVoiceId: string;
  openaiVoice: 'coral' | 'sage' | 'onyx';
  lang: string;
  speed: number;
  style: number;
  instructions: string;
};

export type TtsEnvPins = {
  voiceId?: string;
  style?: string;
  accent?: string;
  speed?: string;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function parseStyle(raw: string | undefined): number {
  if (!raw) return 0.14;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? clamp(n, 0, 1) : 0.14;
}

function parseSpeed(raw: string | undefined): number {
  if (!raw) return 0.9;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? clamp(n, 0.7, 1.2) : 0.9;
}

export function allowlistedElevenIds(pin?: string): Set<string> {
  const ids: string[] = [...Object.values(ELEVEN_VOICE_ID)];
  if (pin?.trim()) ids.push(pin.trim());
  return new Set(ids);
}

export function readTtsEnvPins(): TtsEnvPins {
  return {
    voiceId: process.env.SITE_AGENT_TTS_VOICE_ID?.trim() || process.env.ELEVENLABS_VOICE_ID?.trim(),
    style: process.env.SITE_AGENT_TTS_STYLE?.trim(),
    accent: process.env.SITE_AGENT_TTS_ACCENT?.trim(),
    speed: process.env.SITE_AGENT_TTS_SPEED?.trim(),
  };
}

/** Resolve one profile for a whole playback session. Client accent is ignored if env pins accent. */
export function resolveTtsProfile(input: {
  accent?: unknown;
  voice?: unknown;
  env?: TtsEnvPins;
}): SiteAgentTtsProfile {
  const env = input.env ?? {};
  const pinnedAccent = parseVoiceAccent(env.accent);
  const bodyAccent = parseVoiceAccent(input.accent);
  const accent: VoiceAccent = pinnedAccent ?? bodyAccent ?? 'shanghai';

  const pinId = env.voiceId?.trim() || '';
  const requested = typeof input.voice === 'string' ? input.voice.trim() : '';
  const allowed = allowlistedElevenIds(pinId);
  const elevenVoiceId = pinId
    ? pinId
    : requested && allowed.has(requested)
      ? requested
      : ELEVEN_VOICE_ID[accent];

  return {
    accent,
    elevenVoiceId,
    openaiVoice: TTS_OPENAI_VOICE[accent],
    lang: TTS_ACCENT_LANG[accent],
    speed: parseSpeed(env.speed),
    style: parseStyle(env.style),
    instructions: ttsSpokenInstructions(accent, elevenVoiceId),
  };
}

export function profileFingerprint(p: SiteAgentTtsProfile): string {
  return [p.accent, p.elevenVoiceId, p.openaiVoice, p.lang, p.speed.toFixed(2), p.style.toFixed(2)].join('|');
}
