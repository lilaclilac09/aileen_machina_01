import type { ToolDefinition } from './types.ts';

/** Thin registry so builtins + MCP stubs share one map. */
export class ToolRegistry {
  #tools = new Map<string, ToolDefinition>();

  add(tool: ToolDefinition): void {
    this.#tools.set(tool.name, tool);
  }

  addAll(tools: ToolDefinition[]): void {
    for (const t of tools) this.add(t);
  }

  get(name: string): ToolDefinition | undefined {
    return this.#tools.get(name);
  }

  has(name: string): boolean {
    return this.#tools.has(name);
  }

  list(): ToolDefinition[] {
    return [...this.#tools.values()];
  }

  toMap(): Map<string, ToolDefinition> {
    return new Map(this.#tools);
  }
}
