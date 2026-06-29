/**
 * ElevenLabs Text-to-Speech Integration
 * Handles voice synthesis for AI responses
 */

export interface TTSConfig {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
}

export class ElevenLabsClient {
  private apiKey: string;
  private voiceId: string;
  private modelId: string;

  constructor(config: TTSConfig) {
    this.apiKey = config.apiKey;
    // Default to a gentle female voice suitable for Aileen
    this.voiceId = config.voiceId || 'EXAVITQu4vr4xnSDxMaL'; // Bella voice
    this.modelId = config.modelId || 'eleven_turbo_v2_5';
  }

  async textToSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: this.modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw error;
    }
  }

  async streamTextToSpeech(
    text: string,
    onChunk: (chunk: Uint8Array) => void
  ): Promise<void> {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: this.modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        onChunk(value);
      }
    } catch (error) {
      console.error('ElevenLabs streaming error:', error);
      throw error;
    }
  }

  // Get list of available voices
  static async getVoices(apiKey: string): Promise<any[]> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }
}

export default ElevenLabsClient;
