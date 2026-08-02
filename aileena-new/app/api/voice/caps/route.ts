import { NextResponse } from 'next/server';

/**
 * Voice capability probe for the Console orb.
 * Whisper STT needs OPENAI_API_KEY; TTS uses /api/tts (ElevenLabs or OpenAI).
 */
export async function GET() {
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());
  const eleven = Boolean(process.env.ELEVENLABS_API_KEY?.trim());
  const tts = openai || eleven;
  const whisper = openai;
  const mode = whisper && tts ? 'openai' : tts ? 'mixed' : 'webspeech';
  return NextResponse.json({
    ok: true,
    whisper,
    tts,
    mode,
    hint: whisper
      ? 'MediaRecorder → Whisper → /api/chat → /api/tts'
      : 'Web Speech STT → /api/chat → /api/tts (or browser speech)',
  });
}
