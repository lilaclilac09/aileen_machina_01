/**
 * TurnGuard: the single owner of guard state for one /api/chat request.
 *
 * /api/chat creates one per request and hands it the transcript, the session
 * tail and the model stream. Nothing else mutates guard state. It records what
 * it did as counters, which the route logs once per request under the trace id
 * (lib/requestTrace.ts, JSONL). Nothing from here is sent to the visitor except
 * the guarded text itself.
 */

import type { TextStreamPart, ToolSet, UIMessage } from 'ai';
import type { AgentMode } from '../agentMode';
import { guardTranscript, newTailNonce, wrapSessionTail } from './inputGuard';
import { detectLocale, replyLanguageNote, type VisitorLocale } from './locale';
import { GroundingCorpus } from './grounding';
import {
  completePrefixLength,
  droppedNote,
  guardText,
  protectedPromptText,
  type GuardAction,
  type OutputGuardContext,
} from './outputGuard';

export type TurnGuardInit = {
  mode: AgentMode;
  isOwner: boolean;
  lastQuestion: string;
};

/** Longest stretch we hold back waiting for a sentence end before flushing at a space. */
const MAX_HOLD_CHARS = 480;

export class TurnGuard {
  readonly mode: AgentMode;
  readonly isOwner: boolean;
  readonly locale: VisitorLocale;
  readonly nonce = newTailNonce();
  private readonly corpus = new GroundingCorpus();
  private protectedText = '';
  private inputHits = 0;
  private droppedParts = 0;
  private readonly counts = new Map<GuardAction, number>();

  constructor(init: TurnGuardInit) {
    this.mode = init.mode;
    this.isOwner = init.isOwner;
    this.locale = detectLocale(init.lastQuestion);
  }

  /**
   * (a) Accept only text from the client: drop system messages and tool /
   * reasoning / file parts, neutralize forged markers. Council (owner-only)
   * keeps its text as typed but still loses non-text parts.
   */
  guardTranscript(messages: UIMessage[]): UIMessage[] {
    const r = guardTranscript(messages, { neutralize: this.mode !== 'council' });
    this.inputHits = r.hits;
    this.droppedParts = r.droppedParts;
    // Visitor text is deliberately NOT grounding: "the H200 has 94GB, right?"
    // must not let the model repeat 94GB. Only prompt, tail and tool data ground figures.
    return r.messages;
  }

  get droppedClientParts(): number {
    return this.droppedParts;
  }

  get inputGuardHits(): number {
    return this.inputHits;
  }

  /** (d) Reply-language line for the session tail. */
  languageNote(): string {
    return replyLanguageNote(this.locale);
  }

  /** (a) Wrap the genuine tail in this request's nonce; also ground figures the tail carries. */
  wrapTail(body: string): string {
    this.corpus.addText(body);
    return wrapSessionTail(body, this.nonce, this.inputHits);
  }

  /** The frozen system prompt is grounding for figures and the reference for echo detection. */
  setSystem(systemText: string): void {
    this.protectedText = protectedPromptText(systemText);
    this.corpus.addText(systemText);
  }

  private ctx(): OutputGuardContext {
    return {
      mode: this.mode,
      isOwner: this.isOwner,
      locale: this.locale,
      nonce: this.nonce,
      protectedText: this.protectedText,
      corpus: this.corpus,
    };
  }

  private note(actions: GuardAction[]): void {
    for (const a of actions) this.counts.set(a, (this.counts.get(a) ?? 0) + 1);
  }

  /** Guard a complete reply (non-streaming callers and tests). */
  guardReply(text: string): string {
    const v = guardText(text, this.ctx());
    this.note(v.actions);
    const dropped = v.actions.some((a) => a === 'figure_dropped');
    return dropped && this.mode !== 'council' ? `${v.text.trimEnd()} ${droppedNote(this.locale)}` : v.text;
  }

  /** Record a tool result as grounding for later figures. */
  addToolOutput(output: unknown): void {
    this.corpus.addToolOutput(output);
  }

  /** (b)(c) streamText experimental_transform: sentence-buffered output guard. */
  transform<TOOLS extends ToolSet>() {
    return () => {
      const buffers = new Map<string, string>();
      const droppedIn = new Set<string>();
      const emit = (
        controller: TransformStreamDefaultController<TextStreamPart<TOOLS>>,
        id: string,
        raw: string,
      ) => {
        if (!raw) return;
        const v = guardText(raw, this.ctx());
        this.note(v.actions);
        if (v.actions.some((a) => a === 'figure_dropped')) droppedIn.add(id);
        if (v.text) controller.enqueue({ type: 'text-delta', id, text: v.text } as TextStreamPart<TOOLS>);
      };
      const flush = (controller: TransformStreamDefaultController<TextStreamPart<TOOLS>>, id: string) => {
        const buf = buffers.get(id) ?? '';
        buffers.delete(id);
        emit(controller, id, buf);
        if (droppedIn.has(id) && this.mode !== 'council') {
          droppedIn.delete(id);
          controller.enqueue({ type: 'text-delta', id, text: ` ${droppedNote(this.locale)}` } as TextStreamPart<TOOLS>);
        }
      };
      return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
        transform: (part, controller) => {
          if (part.type === 'text-delta') {
            const buf = (buffers.get(part.id) ?? '') + part.text;
            let cut = completePrefixLength(buf);
            if (cut === 0 && buf.length > MAX_HOLD_CHARS) cut = buf.lastIndexOf(' ') + 1;
            if (cut > 0) {
              emit(controller, part.id, buf.slice(0, cut));
              buffers.set(part.id, buf.slice(cut));
            } else {
              buffers.set(part.id, buf);
            }
            return;
          }
          if (part.type === 'text-end') {
            flush(controller, part.id);
            controller.enqueue(part);
            return;
          }
          if (part.type === 'tool-result') {
            this.addToolOutput((part as { output?: unknown }).output);
          }
          // Any other part closes open text first so ordering is preserved.
          for (const id of [...buffers.keys()]) flush(controller, id);
          controller.enqueue(part);
        },
        flush: (controller) => {
          for (const id of [...buffers.keys()]) flush(controller, id);
        },
      });
    };
  }

  /** Counters for the per-request trace log. No text, no prompt content. */
  summary(): Record<string, unknown> {
    return {
      mode: this.mode,
      locale: this.locale,
      inputGuardHits: this.inputHits,
      droppedClientParts: this.droppedParts,
      output: Object.fromEntries(this.counts),
    };
  }
}
