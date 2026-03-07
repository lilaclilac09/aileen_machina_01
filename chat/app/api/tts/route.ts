import { NextRequest, NextResponse } from 'next/server';
import ElevenLabsClient from '@/lib/elevenlabs';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const ttsClient = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY!,
    });

    const audioBuffer = await ttsClient.textToSpeech(text);

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
