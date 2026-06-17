/**
 * POST /api/v1/query
 *
 * Single-shot agentic LLM endpoint. Body: { prompt: string }.
 * Response: { ok: true, data: { answer, toolCalls[], usage } }.
 *
 * Costs Aileen DeepSeek tokens per request, so rate-limited harder than
 * the data endpoints (LLM_RATE: 5/min, 30/day per IP).
 *
 * The agent has the same tool palette as the in-console /api/chat: article
 * RAG + chip / pricing / news / earnings / research. NO conversation
 * history (each call is independent), NO quota cookie, NO lead gate.
 */

import { generateText, tool, stepCountIs } from 'ai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { z } from 'zod';

import { withApi } from '../../../../lib/api/handler';
import { LLM_RATE } from '../../../../lib/api/ratelimit';
import { ok, err } from '../../../../lib/api/jsonResp';
import { SYSTEM_PROMPT } from '../../../../lib/agentContext';
import { searchArticles } from '../../../../lib/agentSearch';
import { agentDataTools, datasetSummary } from '../../../../lib/data/tools';

export const runtime = 'edge';
export const maxDuration = 30;

function getModel() {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const ds = createOpenAICompatible({
    name: 'aileena-deepseek',
    baseURL: 'https://api.deepseek.com',
    apiKey: key,
  });
  return ds.chatModel('deepseek-chat');
}

export const POST = withApi({ rate: LLM_RATE, scope: 'query' }, async (req) => {
  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return err('bad_request', 'Body must be JSON with a `prompt` string field.', 400);
  }
  const prompt = (body.prompt ?? '').trim();
  if (!prompt) return err('bad_request', 'Body field `prompt` is required.', 400);
  if (prompt.length > 1000) return err('bad_request', 'Prompt too long (max 1000 chars).', 400);

  const model = getModel();
  if (!model) return err('not_configured', 'Service temporarily unavailable.', 503);

  const ds = datasetSummary();
  const augmented =
    SYSTEM_PROMPT +
    `

# Agent tools
You have searchArticles + ${ds.skus.count} SKU specs, ${ds.pricing.count} price observations, ${ds.news.count} news items, ${ds.docs.totalChunks} document chunks (${ds.docs.earningsChunks} earnings + ${ds.docs.researchChunks} research). Choose the narrowest tool for the question. Answer in 2-3 sentences. NEVER state a number you didn't see in a tool result or in the static context above.`;

  try {
    const result = await generateText({
      model,
      system: augmented,
      prompt,
      temperature: 0.4,
      maxOutputTokens: 300,
      stopWhen: stepCountIs(4),
      tools: {
        searchArticles: tool({
          description:
            'Keyword-search the full body text of every published article on aileena.xyz.',
          inputSchema: z.object({
            query: z.string().min(2),
            k: z.number().int().min(1).max(5).optional(),
          }),
          execute: async ({ query, k }) => searchArticles(query, k ?? 3).map((h) => ({
            slug: h.slug,
            title: h.title,
            section: h.section,
            snippet: h.snippet,
            url: `https://aileena.xyz/blog/${h.slug}`,
          })),
        }),
        ...agentDataTools,
      },
    });

    // Surface the tool-call trace so consumers can see the agent's
    // reasoning path. Flatten across steps.
    const toolCalls: Array<{ name: string; input: unknown; output: unknown }> = [];
    for (const step of result.steps ?? []) {
      const calls = (step as { toolCalls?: Array<{ toolName: string; input: unknown }> }).toolCalls ?? [];
      const results = (step as { toolResults?: Array<{ toolName: string; output: unknown }> }).toolResults ?? [];
      for (let i = 0; i < calls.length; i++) {
        toolCalls.push({
          name: calls[i].toolName,
          input: calls[i].input,
          output: results[i]?.output,
        });
      }
    }

    return ok({
      answer: result.text,
      toolCalls,
      usage: result.usage,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[api/v1/query] error:', msg);
    if (/credit balance|too low|insufficient|quota|billing/i.test(msg)) {
      return err('upstream_unavailable', "Service temporarily unavailable.", 503);
    }
    return err('upstream_error', 'Upstream model error. Try again.', 502);
  }
});

export const OPTIONS = POST;
