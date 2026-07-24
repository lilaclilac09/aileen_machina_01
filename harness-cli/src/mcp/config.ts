import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { ToolDefinition } from '../core/types.ts';

export type McpServerConfig = {
  name: string;
  /** v0: command line for future stdio transport */
  command?: string;
  url?: string;
  /** Declared tool stubs until real MCP handshake exists */
  tools?: Array<{ name: string; description?: string }>;
};

export type McpConfigFile = {
  servers: McpServerConfig[];
};

const CONFIG_PATH = join(homedir(), '.hx', 'mcp.json');

export function mcpConfigPath(): string {
  return CONFIG_PATH;
}

export function loadMcpConfig(): McpConfigFile {
  if (!existsSync(CONFIG_PATH)) return { servers: [] };
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8')) as McpConfigFile;
}

export function saveMcpConfig(cfg: McpConfigFile): void {
  mkdirSync(join(homedir(), '.hx'), { recursive: true });
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

export function addMcpServer(server: McpServerConfig): McpConfigFile {
  const cfg = loadMcpConfig();
  cfg.servers = cfg.servers.filter((s) => s.name !== server.name);
  cfg.servers.push(server);
  saveMcpConfig(cfg);
  return cfg;
}

export function removeMcpServer(name: string): McpConfigFile {
  const cfg = loadMcpConfig();
  cfg.servers = cfg.servers.filter((s) => s.name !== name);
  saveMcpConfig(cfg);
  return cfg;
}

/**
 * Project configured MCP servers into the same ToolRegistry as builtins.
 * v0 tools are stubs that report "not connected" — registration path is the point.
 */
export function mcpToolsFromConfig(cfg: McpConfigFile = loadMcpConfig()): ToolDefinition[] {
  const out: ToolDefinition[] = [];
  for (const server of cfg.servers) {
    const declared = server.tools?.length
      ? server.tools
      : [{ name: 'status', description: `MCP server ${server.name} status stub` }];
    for (const t of declared) {
      const fullName = `mcp__${server.name}__${t.name}`;
      out.push({
        name: fullName,
        description: t.description || `MCP stub ${fullName} (stdio not wired yet)`,
        parameters: {
          type: 'object',
          properties: {
            input: { type: 'string' },
          },
        },
        async execute(args) {
          return JSON.stringify(
            {
              ok: false,
              reason: 'mcp_transport_not_wired',
              server: server.name,
              tool: t.name,
              command: server.command ?? null,
              url: server.url ?? null,
              input: args.input ?? null,
              hint: 'Registration path works. Wire stdio/SSE next (HANDWRITTEN_HARNESS.md S8).',
            },
            null,
            2,
          );
        },
      });
    }
  }
  return out;
}
