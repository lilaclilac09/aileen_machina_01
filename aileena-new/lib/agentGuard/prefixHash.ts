/**
 * Prefix hash: one short hash over everything the provider sees before the
 * conversation — the frozen system prompt and the tool table (names,
 * descriptions, input field names). Same session → same hash, every turn.
 * If it changes mid-session the prompt cache is being thrown away.
 * Replaces the old constant X-Frozen-Prefix: 1 header.
 */

type ToolLike = { description?: unknown; inputSchema?: unknown };

function schemaFields(schema: unknown): string {
  const s = schema as { shape?: Record<string, unknown>; _def?: { shape?: () => Record<string, unknown> } } | undefined;
  if (!s) return '';
  const shape = s.shape ?? (typeof s._def?.shape === 'function' ? s._def.shape() : undefined);
  if (shape && typeof shape === 'object') return Object.keys(shape).sort().join(',');
  const json = (schema as { jsonSchema?: { properties?: Record<string, unknown> } }).jsonSchema;
  if (json?.properties) return Object.keys(json.properties).sort().join(',');
  return '';
}

/** Canonical text of a tool table: sorted by name, one line per tool. */
export function toolTableText(tools: Record<string, ToolLike>): string {
  return Object.keys(tools)
    .sort()
    .map((name) => {
      const t = tools[name];
      const desc = typeof t.description === 'string' ? t.description : '';
      return `${name}\t${desc}\t${schemaFields(t.inputSchema)}`;
    })
    .join('\n');
}

export async function prefixHash(system: string, tools: Record<string, ToolLike>): Promise<string> {
  const data = new TextEncoder().encode(`${system}\n\u0000\n${toolTableText(tools)}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}
