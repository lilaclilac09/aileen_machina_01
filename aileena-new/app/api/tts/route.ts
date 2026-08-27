import { NextResponse } from 'next/server';
import { readTtsEnvPins, resolveTtsProfile } from '../../../lib/tts/voiceProfile';

export const runtime = 'edge';
export const maxDuration = 60;

/**
 * Console / narration TTS.
 *
 * Voice profile is resolved server-side (env pins + allowlisted accent/voice).
 * Client may send accent + voice id; it cannot invent provider secrets.
 *
 *   1. ElevenLabs — profile.elevenVoiceId
 *   2. OpenAI gpt-4o-mini-tts — profile.openaiVoice + same accent instructions
 *   3. 503 → browser SpeechSynthesis fallback
 */

const MAX_CHARS = 30000;

export async function POST(req: Request) {
  let body: { text?: unknown; voice?: unknown; accent?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.', code: 'failed' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return NextResponse.json({ error: 'No text.', code: 'failed' }, { status: 400 });
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Text too long (>${MAX_CHARS} chars).`, code: 'failed' },
      { status: 413 },
    );
  }

  const profile = resolveTtsProfile({
    accent: body.accent,
    voice: body.voice,
    env: readTtsEnvPins(),
  });

  const elevenKey =
    process.env.ELEVENLABS_API_KEY?.trim() ||
    process.env.ELEVEN_LABS_API_KEY?.trim() ||
    '';
  if (elevenKey) {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${profile.elevenVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': elevenKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.72,
            similarity_boost: 0.78,
            style: profile.style,
            use_speaker_boost: true,
          },
        }),
      },
    );
    if (res.status === 429) {
      return NextResponse.json({ error: 'busy', code: 'busy' }, { status: 429 });
    }
    if (!res.ok || !res.body) {
      console.error('[tts] ElevenLabs failed', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'failed', code: 'failed' }, { status: 502 });
    }
    return new Response(res.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=0, no-store',
        'X-TTS-Voice': profile.elevenVoiceId,
        'X-TTS-Accent': profile.accent,
        'X-TTS-Profile': `${profile.accent}:${profile.elevenVoiceId}`,
      },
    });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: profile.openaiVoice,
        input: text,
        instructions: profile.instructions,
        speed: profile.speed,
        response_format: 'mp3',
      }),
    });
    if (res.status === 429) {
      return NextResponse.json({ error: 'busy', code: 'busy' }, { status: 429 });
    }
    if (!res.ok || !res.body) {
      console.error('[tts] OpenAI failed', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'failed', code: 'failed' }, { status: 502 });
    }
    return new Response(res.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=0, no-store',
        'X-TTS-Voice': `${profile.openaiVoice}-${profile.accent}`,
        'X-TTS-Accent': profile.accent,
        'X-TTS-Profile': `${profile.accent}:${profile.openaiVoice}`,
      },
    });
  }

  return NextResponse.json(
    {
      error: 'No TTS provider.',
      code: 'failed',
    },
    { status: 503 },
  );
}
