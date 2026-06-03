import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

/**
 * Article-narration TTS proxy.
 *
 * The brief is "English-accent female warmth", which the browser's built-in
 * SpeechSynthesis can't reliably deliver. So we proxy to a hosted provider
 * keyed via env vars, with a graceful 503 if nothing is configured (the
 * client then falls back to browser SpeechSynthesis).
 *
 * Provider precedence:
 *   1. ELEVENLABS_API_KEY  — best for British female warmth. Default voice
 *      is Lily (pFZP5JQG7iQjIQuC4Bku); override with ELEVENLABS_VOICE_ID.
 *   2. OPENAI_API_KEY      — gpt-4o-mini-tts with instructions that ask for
 *      a warm British female accent. The voice itself isn't natively
 *      British, but the instructions tend to bend the cadence.
 *   3. neither             — 503; client falls back to in-browser TTS.
 */

const MAX_CHARS = 30000;
const DEFAULT_ELEVENLABS_VOICE = 'pFZP5JQG7iQjIQuC4Bku'; // "Lily" — warm female

const BRITISH_FEMALE_INSTRUCTIONS =
  'Speak in a warm, calm, female British-English accent — soft, reflective, ' +
  'like a thoughtful podcast narrator. Slight pauses between sentences. ' +
  'Conversational, never robotic.';

export async function POST(req: Request) {
  let body: { text?: unknown };
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

  const elevenKey = process.env.ELEVENLABS_API_KEY;
  if (elevenKey) {
    const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_ELEVENLABS_VOICE;
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
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.15,
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
        voice: 'nova',
        input: text,
        instructions: BRITISH_FEMALE_INSTRUCTIONS,
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
      },
    });
  }

  return NextResponse.json(
    {
      error:
        'No TTS provider configured. Set ELEVENLABS_API_KEY (preferred, real British female voice) or OPENAI_API_KEY (gpt-4o-mini-tts with British-accent instructions) in Vercel, then redeploy.',
    },
    { status: 503 },
  );
}
