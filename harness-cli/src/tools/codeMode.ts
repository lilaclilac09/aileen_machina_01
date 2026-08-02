import type { ToolContext } from '../core/types.ts';

/**
 * Tiny Code Mode host: inject tools.* bridges into an AsyncFunction sandbox.
 * Not a security boundary — demo only.
 */
export async function runCodeMode(source: string, ctx: ToolContext): Promise<string> {
  const logs: unknown[] = [];
  const toolsProxy: Record<string, (args?: Record<string, unknown>) => Promise<unknown>> = {};

  for (const [name, def] of ctx.tools) {
    if (name === 'code_mode') continue; // prevent recursion
    toolsProxy[name] = async (args = {}) => {
      const out = await def.execute(args, ctx);
      try {
        return JSON.parse(out);
      } catch {
        return out;
      }
    };
  }

  const text = (value: unknown) => {
    logs.push(value);
    return value;
  };

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
    ...args: string[]
  ) => (...args: unknown[]) => Promise<unknown>;

  const fn = new AsyncFunction('tools', 'text', 'cwd', `"use strict";\n${source}`);
  const result = await fn(toolsProxy, text, ctx.cwd);

  if (logs.length) {
    return logs.map((v) => (typeof v === 'string' ? v : JSON.stringify(v, null, 2))).join('\n');
  }
  if (result === undefined) return '(code_mode completed with no return)';
  return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
}
