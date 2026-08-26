/**
 * Console voice accent — TTS + spoken register for the site agent.
 *
 * A harness is the loop around a model (tools, context, retries).
 * DeepSeek Harness (`dsh`) is a local coding agent (CLI / :3080 web UI).
 * It is not something you bake into base-model weights, and it cannot
 * run on the Vercel Edge orb.
 *
 * Two Console paths, same DeepSeek pin, different loops:
 * - Talk (`/api/chat`): spoken register so Bella TTS matches 上海阿姨.
 * - Voice → code (`/api/voice-code`): propose-only diffs. Never wrap this
 *   path in spokenRegisterPrompt — auntie cadence would ruin a unified diff.
 *   Still not dsh: no disk, no sandbox, write_target stays null.
 */

export const VOICE_ACCENT_STORAGE_KEY = 'aileena.console.voiceAccent';

export const VOICE_ACCENTS = ['shanghai', 'london', 'berlin'] as const;
export type VoiceAccent = (typeof VOICE_ACCENTS)[number];

export function parseVoiceAccent(raw: unknown): VoiceAccent | null {
  if (typeof raw !== 'string') return null;
  const key = raw.trim().toLowerCase();
  return (VOICE_ACCENTS as readonly string[]).includes(key) ? (key as VoiceAccent) : null;
}

export function readStoredVoiceAccent(): VoiceAccent {
  try {
    return parseVoiceAccent(localStorage.getItem(VOICE_ACCENT_STORAGE_KEY)) ?? 'shanghai';
  } catch {
    return 'shanghai';
  }
}

/** Premade ElevenLabs IDs — library voices 402 on free tier. */
export const ELEVEN_VOICE_ID = {
  shanghai: 'EXAVITQu4vr4xnSDxMaL', // Bella
  london: 'pFZP5JQG7iQjIQuC4Bku', // Lily — British
  berlin: 'JBFqnCBsd6RMkjVDRZzb', // George
} as const;

const SHANGHAI_TTS_INSTRUCTIONS =
  '用很软、很暖的上海阿姨口音说话。像邻居阿姨拉家常：温柔、慢一点、带点呼吸感。' +
  '句子之间自然停顿，不要一口气读完整段，不要机场广播或播音腔。' +
  '可以说「侬好」「老漂亮」「欢迎来到上海」这种软软的语气。不要太年轻太甜腻，也不要客服腔。';

const LONDON_TTS_INSTRUCTIONS =
  'Speak in calm British English, received pronunciation. Warm, unhurried, not American, ' +
  'not a newsreader, not a call-centre greeting. Short spoken sentences with a little air between them.';

const BERLIN_TTS_INSTRUCTIONS =
  'Sprich ruhiges, klares Deutsch, nicht amerikanisch, nicht Nachrichtensprecher, nicht Callcenter. ' +
  'Kurze gesprochene Sätze, etwas Luft dazwischen.';

/** OpenAI gpt-4o-mini-tts instructions. Must follow the selected city, not default auntie. */
export function ttsSpokenInstructions(accent: VoiceAccent | null, voiceId?: string): string {
  const fromVoice =
    voiceId === ELEVEN_VOICE_ID.london
      ? 'london'
      : voiceId === ELEVEN_VOICE_ID.berlin
        ? 'berlin'
        : voiceId === ELEVEN_VOICE_ID.shanghai
          ? 'shanghai'
          : null;
  const key = accent ?? fromVoice;
  if (key === 'london') return LONDON_TTS_INSTRUCTIONS;
  if (key === 'berlin') return BERLIN_TTS_INSTRUCTIONS;
  return SHANGHAI_TTS_INSTRUCTIONS;
}

/** Extra system slice when the orb is speaking. Empty when voice is off. */
export function spokenRegisterPrompt(accent: VoiceAccent | null): string {
  if (!accent) return '';
  if (accent === 'shanghai') {
    return `

# Spoken register (Shanghai orb)
The visitor is listening through the Shanghai voice. Match their language (Chinese if they spoke Chinese).
Speak in 2–4 short sentences, slow enough to read aloud. In Chinese a warm 上海阿姨 cadence is OK — 侬好 / 老 / 啊 — never cute, never 客服腔, never airport PA.
You are still the site agent. Facts stay third person. Do not become Aileen.`;
  }
  if (accent === 'london') {
    return `

# Spoken register (London orb)
The visitor is listening through the London voice. British English (calm RP) unless they wrote another language.
2–4 short spoken sentences. Not American, not broadcast news, not chirpy customer service.
You are still the site agent. Facts stay third person. Do not become Aileen.`;
  }
  return `

# Spoken register (Berlin orb)
The visitor is listening. German if they wrote German; otherwise their language.
2–4 short spoken sentences. Calm, not broadcast. Site agent, third person, not Aileen.`;
}
