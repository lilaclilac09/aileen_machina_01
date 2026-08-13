/**
 * Shared council turn runner for the local CLI (and a future TUI).
 * Does not write files. Does not open an HTTP route.
 */

import { generateText } from 'ai';
import { buildCouncilCliSystemPrompt } from './aileenaCouncil';
import type { CouncilLens } from './councilCopy';
import {
  createModelAbortSignal,
  recordModelFailure,
  recordModelSuccess,
  routeModel,
} from './modelRouter';

export type CouncilChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function runCouncilTurn(opts: {
  question: string;
  history?: CouncilChatMessage[];
  lens?: CouncilLens;
  repoContext?: string;
}): Promise<{ text: string; provider: string }> {
  const decision = routeModel({
    toolRoute: 'council',
    lastQuestion: opts.question,
  });
  if (decision.mode === 'degrade') {
    const hint =
      decision.reason === 'no_model'
        ? 'Set DEEPSEEK_API_KEY or AGENT_API_KEY in aileena-new/.env.local.'
        : decision.message;
    throw new Error(`Council model unavailable (${decision.reason}). ${hint}`);
  }

  const system = buildCouncilCliSystemPrompt({
    lens: opts.lens,
    repoContext: opts.repoContext,
  });
  const messages = [...(opts.history ?? []), { role: 'user' as const, content: opts.question }];

  try {
    const result = await generateText({
      model: decision.pick.model,
      system,
      messages,
      abortSignal: createModelAbortSignal(90_000),
    });
    recordModelSuccess();
    const text = result.text?.trim();
    if (!text) {
      throw new Error('Council returned an empty reply.');
    }
    return { text, provider: decision.pick.provider };
  } catch (err) {
    recordModelFailure(err);
    throw err;
  }
}
