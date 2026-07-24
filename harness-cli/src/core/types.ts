export type JsonSchema = Record<string, unknown>;

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolResult = {
  toolCallId: string;
  name: string;
  ok: boolean;
  output: string;
};

export type Message =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; name: string; content: string };

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: JsonSchema;
  execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<string>;
};

export type ToolContext = {
  cwd: string;
  signal: AbortSignal;
  tools: Map<string, ToolDefinition>;
};

export type ProviderRequest = {
  system: string;
  messages: Message[];
  tools: ToolDefinition[];
  signal: AbortSignal;
};

export type ProviderResponse =
  | { type: 'message'; content: string }
  | { type: 'tool_calls'; content: string; toolCalls: ToolCall[] };

export interface Provider {
  readonly name: string;
  complete(req: ProviderRequest): Promise<ProviderResponse>;
}

export type Snapshot = {
  version: 1;
  sessionId: string;
  system: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export type Checkpoint = {
  id: string;
  sessionId: string;
  messages: Message[];
  snapshot: () => Snapshot;
};

/** Side-channel events for JSONL / IDE adapters (never mutate history). */
export type HarnessEvent =
  | { type: 'turn.start'; turnId: string; prompt: string }
  | { type: 'tool.start'; turnId: string; call: ToolCall }
  | { type: 'tool.end'; turnId: string; result: ToolResult }
  | { type: 'turn.end'; turnId: string; text: string; checkpointId: string }
  | { type: 'turn.error'; turnId: string; error: string };

export type EventSink = (event: HarnessEvent) => void;
