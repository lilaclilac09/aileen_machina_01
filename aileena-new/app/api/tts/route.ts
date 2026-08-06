import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

/**
 * Console / narration TTS.
 *
 * Soft default voice (欢迎来到上海 · 侬好啊):
 *   1. ElevenLabs — body.voice or ELEVENLABS_VOICE_ID or Bella default
 *   2. OpenAI gpt-4o-mini-tts with soft Shanghainese-auntie instructions
 *   3. 503 → browser SpeechSynthesis fallback
 *
 * Free-tier note: ElevenLabs Voice Library IDs (e.g. Coco Li) return 402 on
 * free plans. Console presets use premade voices that work on free API:
 *   Shanghai EXAVITQu4vr4xnSDxMaL (Bella) · London pFZP5JQG7iQjIQuC4Bku (Lily)
 *   Berlin JBFqnCBsd6RMkjVDRZzb (George)
 */

const MAX_CHARS = 30000;

/** Bella — soft female premade; free-tier API OK (library voices need paid). */
const SHANGHAI_SOFT_VOICE = 'EXAVITQu4vr4xnSDxMaL';

const SOFT_AUNTIE_INSTRUCTIONS =
  '用很软、很暖的上海阿姨口音说话。像邻居阿姨拉家常：温柔、慢一点、带点笑意。' +
  '可以说「侬好」「老漂亮」「欢迎来到上海」这种软软的语气。不要播音腔，不要太年轻太甜腻。';

export async function POST(req: Request) {
  let body: { text?: unknown; voice?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return NextResponse.json({ error: 'No text.' }, { status: 400 });
  if (text.length > MAX_CHARS) {
    return NextResponse.json(
      { error: `Text too long (>${MAX_CHARS} chars).` },
      { status: 413 },
    );
  }

  const elevenKey =
    process.env.ELEVENLABS_API_KEY?.trim() ||
    process.env.ELEVEN_LABS_API_KEY?.trim() || // common typo alias
    '';
  if (elevenKey) {
    const voiceId =
      (typeof body.voice === 'string' && body.voice.trim()) ||
      process.env.ELEVENLABS_VOICE_ID ||
      SHANGHAI_SOFT_VOICE;
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
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
            similarity_boost: 0.7,
            style: 0.08,
            use_speaker_boost: true,
          },
        }),
      },
    );
    if (!res.ok || !res.body) {
      console.error('[tts] ElevenLabs failed', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'TTS provider failed.' }, { status: 502 });
    }
    return new Response(res.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-TTS-Voice': voiceId,
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
        voice: 'coral',
        input: text,
        instructions: SOFT_AUNTIE_INSTRUCTIONS,
        response_format: 'mp3',
      }),
    });
    if (!res.ok || !res.body) {
      console.error('[tts] OpenAI failed', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'TTS provider failed.' }, { status: 502 });
    }
    return new Response(res.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-TTS-Voice': 'coral-shanghai-soft',
      },
    });
  }

  return NextResponse.json(
    {
      error:
        'No TTS provider. Set ELEVENLABS_API_KEY (Bella soft default) or OPENAI_API_KEY, then redeploy.',
    },
    { status: 503 },
  );
}
