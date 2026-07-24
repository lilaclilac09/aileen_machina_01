import { randomUUID } from 'node:crypto';
import type {
  Checkpoint,
  Message,
  Provider,
  Snapshot,
  ToolCall,
  ToolDefinition,
  ToolResult,
} from './types.ts';

export type TurnResult = {
  text: string;
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  checkpoint: Checkpoint;
};

export type Turn = {
  id: string;
  steer: (text: string) => Promise<void>;
  cancel: () => Promise<void>;
  result: () => Promise<TurnResult>;
};

type DriverState = {
  sessionId: string;
  system: string;
  messages: Message[];
  provider: Provider;
  tools: Map<string, ToolDefinition>;
  cwd: string;
};

export type HarnessOptions = {
  provider: Provider;
  tools: ToolDefinition[];
  cwd: string;
  system: string;
};

export class Harness {
  readonly sessionId: string;
  #state: DriverState;
  #queue: Promise<void> = Promise.resolve();

  private constructor(state: DriverState) {
    this.sessionId = state.sessionId;
    this.#state = state;
  }

  static builder(opts: HarnessOptions) {
    return {
      build(): Harness {
        return new Harness({
          sessionId: randomUUID(),
          system: opts.system,
          messages: [],
          provider: opts.provider,
          tools: new Map(opts.tools.map((t) => [t.name, t])),
          cwd: opts.cwd,
        });
      },
      resume(snapshot: Snapshot): Harness {
        return new Harness({
          sessionId: snapshot.sessionId,
          system: snapshot.system,
          messages: structuredClone(snapshot.messages),
          provider: opts.provider,
          tools: new Map(opts.tools.map((t) => [t.name, t])),
          cwd: opts.cwd,
        });
      },
    };
  }

  async prompt(text: string): Promise<Turn> {
    const turnId = randomUUID();
    const ac = new AbortController();
    let steered = '';
    let rejectResult: ((err: Error) => void) | null = null;

    const resultPromise = new Promise<TurnResult>((resolve, reject) => {
      rejectResult = reject;
      this.#queue = this.#queue.then(async () => {
        try {
          const userText = steered ? `${text}\n\n[steer] ${steered}` : text;
          this.#state.messages.push({ role: 'user', content: userText });
          const out = await this.#runTurn(ac.signal);
          resolve(out);
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    });

    return {
      id: turnId,
      steer: async (s: string) => {
        steered = steered ? `${steered}\n${s}` : s;
      },
      cancel: async () => {
        ac.abort();
        rejectResult?.(new Error('TurnCancelled'));
      },
      result: () => resultPromise,
    };
  }

  async fork(): Promise<Harness> {
    const snap = this.#checkpoint().snapshot();
    return Harness.builder({
      provider: this.#state.provider,
      tools: [...this.#state.tools.values()],
      cwd: this.#state.cwd,
      system: this.#state.system,
    }).resume({ ...snap, sessionId: randomUUID() });
  }

  snapshot(): Snapshot {
    return this.#checkpoint().snapshot();
  }

  async #runTurn(signal: AbortSignal): Promise<TurnResult> {
    const collectedCalls: ToolCall[] = [];
    const collectedResults: ToolResult[] = [];
    let finalText = '';

    // Bound tool loops so mock / flaky models cannot spin forever.
    for (let step = 0; step < 8; step++) {
      if (signal.aborted) throw new Error('TurnCancelled');

      const response = await this.#state.provider.complete({
        system: this.#state.system,
        messages: this.#state.messages,
        tools: [...this.#state.tools.values()],
        signal,
      });

      if (response.type === 'message') {
        finalText = response.content;
        this.#state.messages.push({ role: 'assistant', content: finalText });
        break;
      }

      this.#state.messages.push({
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
      });
      collectedCalls.push(...response.toolCalls);

      for (const call of response.toolCalls) {
        if (signal.aborted) throw new Error('TurnCancelled');
        const tool = this.#state.tools.get(call.name);
        let output: string;
        let ok = true;
        if (!tool) {
          ok = false;
          output = `unknown tool: ${call.name}`;
        } else {
          try {
            output = await tool.execute(call.arguments, {
              cwd: this.#state.cwd,
              signal,
              tools: this.#state.tools,
            });
          } catch (err) {
            ok = false;
            output = err instanceof Error ? err.message : String(err);
          }
        }
        collectedResults.push({
          toolCallId: call.id,
          name: call.name,
          ok,
          output,
        });
        this.#state.messages.push({
          role: 'tool',
          toolCallId: call.id,
          name: call.name,
          content: output,
        });
      }
    }

    if (!finalText) {
      finalText =
        collectedResults.map((r) => r.output).join('\n\n').slice(0, 4000) ||
        '(no model text — tool outputs only)';
      this.#state.messages.push({ role: 'assistant', content: finalText });
    }

    return {
      text: finalText,
      toolCalls: collectedCalls,
      toolResults: collectedResults,
      checkpoint: this.#checkpoint(),
    };
  }

  #checkpoint(): Checkpoint {
    const id = randomUUID();
    const messages = structuredClone(this.#state.messages);
    const sessionId = this.#state.sessionId;
    const system = this.#state.system;
    return {
      id,
      sessionId,
      messages,
      snapshot: (): Snapshot => ({
        version: 1,
        sessionId,
        system,
        messages: structuredClone(messages),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    };
  }
}
