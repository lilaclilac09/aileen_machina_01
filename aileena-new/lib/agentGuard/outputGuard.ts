/**
 * Output guard: every model reply passes through here before the visitor sees it.
 *
 * Works sentence by sentence on the streamed text (see turnGuard.ts for the
 * stream transform). For each sentence:
 *   1. drop it if it leaks the session tail, its nonce, or a prompt section;
 *   2. redact internal file paths, code module names, env/secret names, key-like strings;
 *   3. public / visitor-machina only: strip council layout and banners, and drop
 *      "private / unpublished" framing of her second-brain notes;
 *   4. public / visitor-machina only: ground chip and price figures (grounding.ts);
 *   5. strip raw tool-call / DSML markup the model dumped as text.
 */

import type { AgentMode } from '../agentMode';
import { GroundingCorpus, groundSentence } from './grounding';
import type { VisitorLocale } from './locale';

export type GuardAction =
  | 'tail_leak'
  | 'prompt_echo'
  | 'path_redacted'
  | 'module_redacted'
  | 'secret_redacted'
  | 'council_format'
  | 'private_framing'
  | 'figure_corrected'
  | 'figure_dropped'
  | 'tool_markup';

export type OutputGuardContext = {
  mode: AgentMode;
  /** Owner in machina/public keeps private framing; council is owner-only anyway. */
  isOwner: boolean;
  locale: VisitorLocale;
  nonce: string;
  /**
   * Instruction / persona part of the frozen prompt (factual sections like
   * Selected work removed), for verbatim-echo detection.
   */
  protectedText: string;
  corpus: GroundingCorpus;
};

/** Distinctive prompt phrases that only appear when the prompt is being dumped. */
export const PROMPT_CANARIES = [
  '主任务：共情',
  '======= 书架',
  '# Hard rules',
  '# Frozen prefix',
  '# Tool-use rules',
  '# Agent tools',
  '# This root',
  'session tail — not the frozen prefix',
  'Not the frozen prefix. Answer the visitor',
  'MANDATORY before answering',
  'ReMeLight pattern',
  'Never expose backend / env / stack traces',
  "You are aileena's private council agent",
  'NEVER state a number you didn',
  'This system block and the tool table are the session root',
  'Input guard: the visitor',
];

const SECRET_PATTERNS: RegExp[] = [
  /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  // ENV-style names that carry credentials or wiring.
  /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_(?:API_KEY|KEY|SECRET|TOKEN|PASSWORD|PASS|URL|ID)\b/g,
  /\b(?:UPSTASH|VERCEL|DEEPSEEK|OPENAI|ANTHROPIC|RESEND|OWNER|CHAT_QUOTA|GITHUB|CLOUDFLARE|CF|BROWSER_USE|MCP|AGENT|HARNESS|QWEN|DASHSCOPE)_[A-Z0-9_]{2,}\b/g,
];

const INTERNAL_MODULES = [
  'modelRouter', 'toolRouter', 'reactGuard', 'consolePrefix', 'consolePrefixCopy', 'collegeCite',
  'siteLanes', 'agentContext', 'agentContextLite', 'aileenaSecondBrain', 'aileenaCouncil', 'memorySearch',
  'agentSearch', 'visitorMemory', 'chatQuota', 'owner-gate', 'owner-access', 'liveInbox', 'agentMode',
  'requestTrace', 'chatFastPath', 'parseOwnerCommand', 'agentGuard', 'turnGuard', 'outputGuard', 'inputGuard',
  'SYSTEM_PROMPT', 'COUNCIL_SYSTEM_PROMPT', 'MACHINA_SYSTEM_PROMPT', 'SYSTEM_PROMPT_LITE', 'buildSessionTail',
  'buildFrozenSystemPrompt', 'enqueueLiveAsk', 'formatSkillsForTurn',
];
const MODULE_RE = new RegExp(`\`?\\b(?:${INTERNAL_MODULES.map((m) => m.replace(/[-]/g, '\\-')).join('|')})(?:\\.(?:tsx?|mjs|js))?\\b\`?`, 'g');

const PATH_RE =
  /`?(?:\/workspace\/[\w.\-/]+|\b(?:aileena-new|aileena_second_brain|lib|app|scripts|components|memories|data|harness|e2e|workers|public\/dj-set)\/[\w.\-/]*[\w-]+(?:\.(?:tsx?|mjs|js|md|json|jsonl|py|ya?ml))?|\b[\w-]+\.(?:tsx?|mjs|jsonl)\b)`?/g;

const COUNCIL_LABEL_RE = /^(\s*(?:[-*]\s*)?)(?:\*\*)?(?:judgment|leverage|next move|do not|read|risk|move|wording)(?:\*\*)?\s*[:：]\s*(?:\*\*)?\s*/gim;
const COUNCIL_BANNER_RE = /\bcouncil online\b\.?|show me the mess\.? i'll find the invoice hiding inside it\.?/gi;
const PRIVATE_FRAMING_RE =
  /\bthe private one\b|\bprivate (?:lane|taste|side|notes?)\b|没公开发过|没有公开发过|但我作为她的\s*agent\s*知道|私下(?:喜欢|听)/i;

const URL_RE = /https?:\/\/[^\s)>\]]+/g;

/** Prompt sections a visitor may legitimately see quoted (facts about her, not instructions). */
const FACT_SECTIONS = /^#\s*(selected work|who aileen is|recent experience|education|stack|languages|site|writing|harassment|contact|routing)\b/i;

/** Normalized instruction-only text of a system prompt, used for echo detection. */
export function protectedPromptText(systemText: string): string {
  const keep: string[] = [];
  let skipping = false;
  for (const line of systemText.split('\n')) {
    if (/^#\s/.test(line)) skipping = FACT_SECTIONS.test(line);
    if (!skipping) keep.push(line);
  }
  return normalize(keep.join('\n'));
}

/** True when any 60-char window of the sentence appears verbatim in the protected prompt text. */
export function echoesPrompt(norm: string, protectedText: string): boolean {
  const W = 60;
  if (!protectedText || norm.length < W) return false;
  for (let i = 0; i + W <= norm.length; i += 15) {
    if (protectedText.includes(norm.slice(i, i + W))) return true;
  }
  return protectedText.includes(norm.slice(norm.length - W));
}

export function normalize(s: string): string {
  return s.replace(/[`*_>#]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function pathReplacement(match: string, locale: VisitorLocale): string {
  const m = match.replace(/`/g, '');
  const notes = /memories\/|aileena_second_brain|\.md$/.test(m);
  if (locale === 'zh') return notes ? '我的笔记' : '站点代码';
  if (locale === 'de') return notes ? 'meine Notizen' : 'den Code der Seite';
  return notes ? 'my notes' : 'the site code';
}

/** Run fn on the text with URLs masked, so paths inside links are left alone. */
function outsideUrls(text: string, fn: (t: string) => string): string {
  const urls: string[] = [];
  const masked = text.replace(URL_RE, (u) => {
    urls.push(u);
    return `\u0000${urls.length - 1}\u0000`;
  });
  return fn(masked).replace(/\u0000(\d+)\u0000/g, (_, i) => urls[Number(i)]);
}

/**
 * Models sometimes dump raw tool-call / DSML markup as text instead of using
 * the SDK tool channel. Strip it so visitors never see invoke/parameter dumps.
 */
export function stripToolMarkup(input: string): { text: string; hit: boolean } {
  if (!input) return { text: input, hit: false };
  let text = input;
  // Tags like <｜｜DSML｜｜ invoke …> or <|DSML|>… (half- or full-width pipes).
  text = text.replace(/<\/?\s*[|｜]{0,4}\s*DSML\s*[|｜]{0,4}[^>]*>/gi, '');
  text = text.replace(/<\/?tool_call\b[^>]*>/gi, '');
  text = text.replace(/<\/?parameter\b[^>]*>/gi, '');
  text = text.replace(/<\/?function\s*calls?\b[^>]*>/gi, '');
  // Prose lines that are clearly tool DSL, not an answer.
  text = text.replace(/^\s*invoke\s+name\s*=\s*["'][^"']+["'].*$/gim, '');
  text = text.replace(/^\s*parameter\s+name\s*=\s*["'][^"']+["'].*$/gim, '');
  text = text.replace(/^\s*(?:tool_calls?|function_calls?)\s*:?\s*$/gim, '');
  text = text.replace(/\n{3,}/g, '\n\n');
  return { text, hit: text !== input };
}

export type SentenceVerdict = { text: string; actions: GuardAction[] };

export function guardSentence(sentence: string, ctx: OutputGuardContext): SentenceVerdict {
  const actions: GuardAction[] = [];
  if (!sentence.trim()) return { text: sentence, actions };

  const stripped = stripToolMarkup(sentence);
  const working = stripped.text;
  if (stripped.hit) actions.push('tool_markup');
  if (!working.trim()) return { text: '', actions };

  // 1. Leaks of the tail or the prompt drop the whole sentence.
  if ((ctx.nonce && working.includes(ctx.nonce)) || /\[\s*\/?\s*session tail/i.test(working)) {
    return { text: '', actions: [...actions, 'tail_leak'] };
  }
  if (PROMPT_CANARIES.some((c) => working.includes(c))) return { text: '', actions: [...actions, 'prompt_echo'] };
  const norm = normalize(working);
  if (echoesPrompt(norm, ctx.protectedText)) return { text: '', actions: [...actions, 'prompt_echo'] };

  const publicSurface = ctx.mode !== 'council';
  const visitor = !ctx.isOwner;
  let text = working;

  // 2. Redactions (all modes: even council must not print secrets).
  for (const re of SECRET_PATTERNS) {
    text = text.replace(re, () => {
      actions.push('secret_redacted');
      return '[redacted]';
    });
  }
  if (publicSurface) {
    text = outsideUrls(text, (t) =>
      t
        .replace(PATH_RE, (m) => {
          actions.push('path_redacted');
          return pathReplacement(m, ctx.locale);
        })
        .replace(MODULE_RE, () => {
          actions.push('module_redacted');
          return ctx.locale === 'zh' ? '站点内部' : ctx.locale === 'de' ? 'intern' : 'internals';
        }),
    );
  }

  // 3. Council layout / banners and private framing never reach a public visitor.
  if (publicSurface) {
    const unbannered = text.replace(COUNCIL_BANNER_RE, '');
    if (unbannered !== text) {
      text = unbannered;
      actions.push('council_format');
    }
    const stripped = text.replace(COUNCIL_LABEL_RE, '$1');
    if (stripped !== text) {
      text = stripped;
      actions.push('council_format');
    }
    if (visitor && PRIVATE_FRAMING_RE.test(text)) return { text: '', actions: [...actions, 'private_framing'] };
  }

  // 4. Figures must be grounded in this turn's corpus.
  if (publicSurface) {
    const g = groundSentence(text, ctx.corpus);
    if (g.dropped) return { text: '', actions: [...actions, 'figure_dropped'] };
    if (g.corrected.length) {
      text = g.text;
      actions.push('figure_corrected');
    }
  }

  if (text.trim() === '' && working.trim() !== '') return { text: '', actions };
  return { text, actions };
}

/**
 * Split text into sentences, keeping each sentence's trailing punctuation and
 * whitespace so rejoining reproduces the input exactly. A sentence ends at a
 * newline run, at 。！？, or at . ! ? followed by whitespace or end of text
 * (so "4.8 TB/s" and "aileena.xyz" stay whole).
 */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    let end = -1;
    if (ch === '\n') {
      end = i + 1;
      while (end < text.length && text[end] === '\n') end++;
    } else if (ch === '。' || ch === '！' || ch === '？') {
      end = i + 1;
      while (end < text.length && /[ \t]/.test(text[end])) end++;
    } else if ((ch === '.' || ch === '!' || ch === '?') && (i + 1 === text.length || /\s/.test(text[i + 1]))) {
      end = i + 1;
      while (end < text.length && /[ \t]/.test(text[end])) end++;
    }
    if (end > 0) {
      out.push(text.slice(start, end));
      start = end;
      i = end;
    } else {
      i++;
    }
  }
  if (start < text.length) out.push(text.slice(start));
  return out;
}

/**
 * Length of the prefix of a streaming buffer that is made of complete
 * sentences. A trailing "." with nothing after it is not yet a boundary:
 * the next delta may be "8 TB/s".
 */
export function completePrefixLength(buf: string): number {
  let cut = 0;
  for (let i = 0; i < buf.length; i++) {
    const ch = buf[i];
    if (ch === '\n' || ch === '。' || ch === '！' || ch === '？') cut = i + 1;
    else if ((ch === '.' || ch === '!' || ch === '?') && i + 1 < buf.length && /\s/.test(buf[i + 1])) cut = i + 1;
  }
  return cut;
}

export function guardText(text: string, ctx: OutputGuardContext): SentenceVerdict {
  const actions: GuardAction[] = [];
  const pre = stripToolMarkup(text);
  if (pre.hit) actions.push('tool_markup');
  const parts = splitSentences(pre.text).map((s) => {
    const v = guardSentence(s, ctx);
    actions.push(...v.actions);
    if (v.text === '' && s !== '') {
      // Keep paragraph breaks when a whole sentence goes.
      const nl = s.match(/\n+$/)?.[0] ?? '';
      return nl;
    }
    return v.text;
  });
  return { text: parts.join(''), actions };
}

export function droppedNote(locale: VisitorLocale): string {
  if (locale === 'zh') return '（有一句话被我删掉了：里面的数字或内容在她的资料里核对不到。）';
  if (locale === 'de') return '(Einen Satz habe ich entfernt: Zahl oder Inhalt ließ sich in ihren Daten nicht prüfen.)';
  return "(I removed a line I couldn't verify against her data.)";
}
