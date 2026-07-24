import { randomUUID } from 'node:crypto';
import type { Message, Provider, ProviderRequest, ProviderResponse, ToolCall } from '../core/types.ts';

/**
 * Deterministic offline provider so the CLI is demoable without API keys.
 * Heuristics map natural-language prompts onto tool calls / code_mode.
 */
export function createMockProvider(): Provider {
  return {
    name: 'mock',
    async complete(req: ProviderRequest): Promise<ProviderResponse> {
      const lastUser = [...req.messages].reverse().find((m) => m.role === 'user');
      const raw = lastUser && lastUser.role === 'user' ? lastUser.content : '';
      const text = raw.toLowerCase();

      // If we already have tool results pending a final answer, summarize.
      const last = req.messages[req.messages.length - 1];
      if (last?.role === 'tool') {
        const toolOutputs = collectRecentToolOutputs(req.messages);
        return {
          type: 'message',
          content: formatToolSummary(toolOutputs),
        };
      }

      if (text.includes('code mode') || text.includes('code_mode') || text.includes('compose')) {
        return toolCalls([
          {
            name: 'code_mode',
            arguments: {
              source: `
const entries = await tools.list_dir({ path: "." });
const lines = String(entries).split("\\n").filter(Boolean);
const md = lines.filter((l) => l.includes(".md"));
return { total: lines.length, md: md.length, sample: md.slice(0, 8) };
`,
            },
          },
        ]);
      }

      if (text.includes('grep') || text.includes('search') || text.includes('find ')) {
        const query =
          raw.match(/["']([^"']+)["']/)?.[1] ||
          raw.match(/grep\s+(\S+)/i)?.[1] ||
          raw.match(/find\s+(\S+)/i)?.[1] ||
          'TODO';
        return toolCalls([{ name: 'grep', arguments: { query, path: '.' } }]);
      }

      if (text.includes('read ')) {
        const path =
          raw.match(/read\s+(\S+)/i)?.[1]?.replace(/["']/g, '') || 'DESIGN.md';
        return toolCalls([{ name: 'read_file', arguments: { path } }]);
      }

      if (text.includes('list') || text.includes('files') || text.includes('ls')) {
        return toolCalls([{ name: 'list_dir', arguments: { path: '.' } }]);
      }

      return {
        type: 'message',
        content: [
          'hx mock provider — no network.',
          'Try: "list files", "read DESIGN.md", "grep harness", "use code mode to count md files".',
          'Or: hx run "..." --provider openai',
        ].join('\n'),
      };
    },
  };
}

function toolCalls(calls: { name: string; arguments: Record<string, unknown> }[]): ProviderResponse {
  const toolCalls: ToolCall[] = calls.map((c) => ({
    id: `call_${randomUUID().slice(0, 8)}`,
    name: c.name,
    arguments: c.arguments,
  }));
  return { type: 'tool_calls', content: '', toolCalls };
}

function collectRecentToolOutputs(messages: Message[]): { name: string; content: string }[] {
  const out: { name: string; content: string }[] = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'tool') out.push({ name: m.name, content: m.content });
    else if (m.role === 'assistant' && m.toolCalls?.length) break;
  }
  return out.reverse();
}

function formatToolSummary(outputs: { name: string; content: string }[]): string {
  if (!outputs.length) return '(no tool output)';
  return outputs
    .map((o) => {
      const body = o.content.length > 2500 ? o.content.slice(0, 2500) + '\n…[truncated]' : o.content;
      return `## ${o.name}\n${body}`;
    })
    .join('\n\n');
}
