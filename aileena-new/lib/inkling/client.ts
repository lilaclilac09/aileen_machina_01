import { readFileSync } from 'node:fs';

export type InklingConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  reasoningEffort?: string;
  maxTokens: number;
};

export function getInklingConfig(): InklingConfig {
  const apiKey = process.env.INKLING_API_KEY ?? process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing INKLING_API_KEY or TOGETHER_API_KEY. Set one in your environment before running.',
    );
  }
  return {
    baseUrl: (process.env.INKLING_BASE_URL ?? 'https://api.together.xyz/v1').replace(/\/$/, ''),
    apiKey,
    model: process.env.INKLING_MODEL ?? 'thinkingmachines/inkling',
    reasoningEffort: process.env.INKLING_REASONING_EFFORT,
    maxTokens: Number(process.env.INKLING_MAX_TOKENS ?? '4096'),
  };
}

function contentToText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'object' && part && 'text' in part) {
          return String((part as { text: string }).text);
        }
        return '';
      })
      .join('');
  }
  return '';
}

export async function chatWithAudio(
  cfg: InklingConfig,
  text: string,
  audioWavPath: string,
): Promise<string> {
  const audioBase64 = readFileSync(audioWavPath).toString('base64');
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text },
          {
            type: 'input_audio',
            input_audio: { data: audioBase64, format: 'wav' },
          },
        ],
      },
    ],
    max_tokens: cfg.maxTokens,
  };
  if (cfg.reasoningEffort) {
    body.reasoning_effort = cfg.reasoningEffort;
  }

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Inkling API ${res.status}: ${errText.slice(0, 800)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const textOut = contentToText(json.choices?.[0]?.message?.content);
  if (!textOut.trim()) {
    throw new Error('Inkling API returned empty text content');
  }
  return textOut;
}
