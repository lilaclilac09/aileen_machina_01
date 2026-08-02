import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Whisper STT for the Console voice orb (any modern browser via MediaRecorder).
 * Requires OPENAI_API_KEY. Without it, the client falls back to Web Speech.
 */

const MAX_BYTES = 25 * 1024 * 1024;

function guessFilename(ctype: string, fallback: string): string {
  if (fallback) return fallback;
  if (ctype.includes('wav')) return 'audio.wav';
  if (ctype.includes('mpeg') || ctype.includes('mp3')) return 'audio.mp3';
  if (ctype.includes('mp4') || ctype.includes('m4a')) return 'audio.m4a';
  if (ctype.includes('ogg')) return 'audio.ogg';
  return 'audio.webm';
}

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json({ ok: false, error: 'no_openai_key', text: '' }, { status: 503 });
  }

  const url = new URL(req.url);
  const filenameParam = url.searchParams.get('filename') || '';
  const lang = url.searchParams.get('lang') || '';

  const ctype = (req.headers.get('content-type') || 'audio/webm').split(';')[0].trim();
  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) {
    return NextResponse.json({ ok: false, error: 'empty_audio', text: '' }, { status: 400 });
  }
  if (buf.length > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'too_large', text: '' }, { status: 413 });
  }

  const filename = guessFilename(ctype, filenameParam);
  const form = new FormData();
  form.append('model', 'whisper-1');
  if (lang) form.append('language', lang);
  form.append('file', new Blob([new Uint8Array(buf)], { type: ctype }), filename);

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error('[transcribe] whisper failed', res.status, err.slice(0, 300));
      return NextResponse.json(
        { ok: false, error: `http_${res.status}`, message: err.slice(0, 240), text: '' },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { text?: string };
    const text = String(data.text || '').trim();
    return NextResponse.json({ ok: Boolean(text), text });
  } catch (e) {
    console.error('[transcribe] network', e);
    return NextResponse.json(
      { ok: false, error: 'network', message: String(e), text: '' },
      { status: 502 },
    );
  }
}
