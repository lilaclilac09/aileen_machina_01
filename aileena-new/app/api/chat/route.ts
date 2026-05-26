import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { SYSTEM_PROMPT } from '../../../lib/agentContext';

export const runtime = 'edge';
export const maxDuration = 30;

const MODEL = 'claude-sonnet-4-6';

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY is not set on the server.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: { messages?: UIMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'No messages provided.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Cap the conversation we forward to the model so a long session doesn't
  // blow up token cost. The system prompt holds all the durable knowledge;
  // the last ~20 turns are plenty of context for follow-ups.
  const trimmed = messages.slice(-20);

  const modelMessages = await convertToModelMessages(trimmed);

  const result = streamText({
    model: anthropic(MODEL),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    temperature: 0.4,
    providerOptions: {
      anthropic: {
        // Prompt caching on the system block — system is ~3k tokens of
        // static CV data, reused on every request, perfect cache target.
        cacheControl: { type: 'ephemeral' as const },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
