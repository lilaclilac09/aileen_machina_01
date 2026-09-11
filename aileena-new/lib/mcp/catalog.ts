import { callComputer, computerReady, computerTools } from './computer';
import { callGithub, githubReady, githubTools } from './github';
import { callRemote, listRemoteTools, parseMcpServers } from './remote';
import type { McpAppStatus, McpCallResult } from './types';

export async function listMcpApps(): Promise<McpAppStatus[]> {
  const computer = computerReady();
  const github = githubReady();
  const apps: McpAppStatus[] = [
    {
      name: 'computer',
      kind: 'in-process',
      ready: computer.ready,
      reason: computer.reason,
      tools: computerTools(),
    },
    {
      name: 'github',
      kind: 'in-process',
      ready: github.ready,
      reason: github.reason,
      tools: githubTools(),
    },
  ];
  const remotes = await Promise.all(
    parseMcpServers().map(async (server) => {
      try {
        const tools = await listRemoteTools(server);
        return {
          name: server.name,
          kind: 'remote' as const,
          ready: true,
          reason: 'MCP_SERVERS',
          tools,
        };
      } catch (err) {
        return {
          name: server.name,
          kind: 'remote' as const,
          ready: false,
          reason: err instanceof Error ? err.message : 'remote list failed',
          tools: [],
        };
      }
    }),
  );
  apps.push(...remotes);
  return apps;
}

export async function callMcpApp(
  app: string,
  tool: string,
  args: Record<string, unknown>,
  workspaceId: string,
): Promise<McpCallResult> {
  const name = app.trim().slice(0, 40);
  const toolName = tool.trim().slice(0, 80);
  if (!name || !toolName) {
    return { ok: false, app, tool, text: 'app and tool required' };
  }
  if (name === 'computer') return callComputer(toolName, args, workspaceId);
  if (name === 'github') return callGithub(toolName, args);
  const remote = parseMcpServers().find((s) => s.name === name);
  if (remote) return callRemote(remote, toolName, args);
  return { ok: false, app: name, tool: toolName, text: `unknown app ${name}` };
}
