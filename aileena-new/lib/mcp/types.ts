/** Machina calling other apps. Not the worker-shell computer. No @cloudflare/computer in Next. */

export type McpAppName = 'computer' | 'github' | string;

export type McpToolDesc = {
  name: string;
  description: string;
};

export type McpAppStatus = {
  name: string;
  kind: 'in-process' | 'remote';
  ready: boolean;
  reason: string;
  tools: McpToolDesc[];
};

export type McpCallResult = {
  ok: boolean;
  app: string;
  tool: string;
  text: string;
  blocked?: boolean;
};
