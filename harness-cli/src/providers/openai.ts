import { randomUUID } from 'node:crypto';
import type { Provider, ProviderRequest, ProviderResponse, ToolCall, ToolDefinition } from '../core/types.ts';

export function createOpenAIProvider(): Provider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY required for --provider openai');
  }
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  return {
    name: 'openai',
    async complete(req: ProviderRequest): Promise<ProviderResponse> {
      const body = {
        model,
        messages: [
          { role: 'system', content: req.system },
          ...req.messages.map(toOpenAIMessage),
        ],
        tools: req.tools.map(toOpenAITool),
        tool_choice: 'auto',
      };

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: req.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`openai ${res.status}: ${errText.slice(0, 500)}`);
      }

      const json = (await res.json()) as {
        choices: Array<{
          message: {
            content?: string | null;
            tool_calls?: Array<{
              id: string;
              function: { name: string; arguments: string };
            }>;
          };
        }>;
      };

      const msg = json.choices?.[0]?.message;
      if (!msg) throw new Error('openai: empty choices');

      if (msg.tool_calls?.length) {
        const toolCalls: ToolCall[] = msg.tool_calls.map((tc) => ({
          id: tc.id || `call_${randomUUID().slice(0, 8)}`,
          name: tc.function.name,
          arguments: safeJson(tc.function.arguments),
        }));
        return {
          type: 'tool_calls',
          content: msg.content || '',
          toolCalls,
        };
      }

      return { type: 'message', content: msg.content || '' };
    },
  };
}

function safeJson(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

function toOpenAITool(tool: ToolDefinition) {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  };
}

function toOpenAIMessage(m: ProviderRequest['messages'][number]) {
  if (m.role === 'tool') {
    return {
      role: 'tool',
      tool_call_id: m.toolCallId,
      content: m.content,
    };
  }
  if (m.role === 'assistant' && m.toolCalls?.length) {
    return {
      role: 'assistant',
      content: m.content || null,
      tool_calls: m.toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function',
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.arguments ?? {}),
        },
      })),
    };
  }
  return { role: m.role, content: 'content' in m ? m.content : '' };
}
