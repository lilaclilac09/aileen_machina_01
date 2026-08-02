import { NextResponse } from 'next/server';

/**
 * Voice capability probe for the Console orb.
 * Whisper STT needs OPENAI_API_KEY; TTS uses /api/tts (ElevenLabs or OpenAI).
 *
 * If tts=false, the client falls back to browser speechSynthesis —
 * voice presets (Auntie / Tech / …) will NOT sound like ElevenLabs.
 */
export async function GET() {
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  const eleven = Boolean(process.env.ELEVENLABS_API_KEY?.trim());
  const tts = openai || eleven;
  const whisper = openai;
  const provider = eleven ? 'elevenlabs' : openai ? 'openai' : 'none';
  const mode = whisper && tts ? 'openai' : tts ? 'mixed' : 'webspeech';
  return NextResponse.json({
    ok: true,
    whisper,
    tts,
    provider,
    mode,
    hint: !tts
      ? 'No ELEVENLABS_API_KEY / OPENAI_API_KEY on this deploy — browser voice only; presets ignored'
      : whisper
        ? 'MediaRecorder → Whisper → /api/chat → /api/tts'
        : 'Web Speech STT → /api/chat → /api/tts',
  });
}
