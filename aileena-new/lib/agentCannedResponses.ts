/**
 * Client-side canned-response short-circuit for the chat agent.
 *
 * Hard truth on latency floors: a real LLM round-trip is structurally
 * ~1.5 s minimum (network + prefill + first token) even on the fastest
 * vendors. The only way to feel "instant" (~10–30 ms) for a question is
 * to NOT call the LLM at all — answer from a regex-matched canned reply.
 *
 * This module covers the top-N "obvious" patterns: greetings, thanks,
 * meta-questions about the agent itself, top-level CV one-liners. Real
 * questions still fall through to the LLM.
 *
 * Each pattern returns a single string. The caller's responsibility is
 * to inject it into the messages array as if it had been streamed.
 */

export type CannedHit = {
  reply: string;
  pattern: string; // for diagnostic logging
};

type Rule = {
  name: string;
  test: RegExp;
  reply: string;
};

const RULES: Rule[] = [
  // ── Greetings ──────────────────────────────────────────────────────────
  {
    name: 'greeting-en',
    test: /^\s*(hi|hello|hey|yo|sup|howdy|hiya)[\s.!,?]*$/i,
    reply: "Hey. Ask anything about Aileen's work, projects, writing, or whether she's hiring out.",
  },
  {
    name: 'greeting-zh',
    test: /^\s*(你好|嗨|哈喽|hello您好)[\s。！，？.!,?]*$/,
    reply: '你好。可以问 Aileen 的项目、文章、技术栈,或者她最近有没有空接 role。',
  },
  {
    name: 'greeting-de',
    test: /^\s*(hallo|hi|guten\s*tag|servus|moin)[\s.!,?]*$/i,
    reply: "Hallo. Frag mich nach Aileens Projekten, Artikeln, Tech-Stack oder ob sie verfügbar ist.",
  },

  // ── Thanks ─────────────────────────────────────────────────────────────
  {
    name: 'thanks-en',
    test: /^\s*(thanks|thank\s*you|ty|cheers|cool|nice|great|got it|gotcha|makes sense)[\s.!,?]*$/i,
    reply: 'Anytime. Anything else?',
  },
  {
    name: 'thanks-zh',
    test: /^\s*(谢谢|多谢|感谢|好的|了解|明白|懂了|可以)[\s。！，？.!,?]*$/,
    reply: '随时。还有什么想问的?',
  },
  {
    name: 'thanks-de',
    test: /^\s*(danke|vielen\s*dank|alles\s*klar)[\s.!,?]*$/i,
    reply: 'Gerne. Noch was?',
  },

  // ── Meta: who are you / what is this ───────────────────────────────────
  {
    name: 'who-are-you',
    test: /\b(who\s*are\s*you|what\s*are\s*you|are\s*you\s*(real|human|ai|a\s*bot|chatgpt|gpt))\b/i,
    reply:
      "I'm a small AI agent Aileen built for this site. Streaming LLM (DeepSeek) plus a build-time TF-IDF index over her 35+ articles I can search on demand. Not Aileen herself.",
  },
  {
    name: 'who-built-this',
    test: /\b(who\s*(built|made|wrote|coded)\s*(this|you|the\s*agent|the\s*chat))\b/i,
    reply:
      'Aileen did. Fresh implementation on Vercel AI SDK + Next.js, DeepSeek-chat as the model, build-time TF-IDF RAG over her own article corpus. No frameworks borrowed.',
  },
  {
    name: 'who-is-aileen',
    test: /^(\s*who(\s+is|'s)\s+aileen|tell\s+me\s+about\s+aileen|what\s+does\s+aileen\s+do)\b/i,
    reply:
      "Software engineer + on-chain researcher, Solana focus. M.Sc. Statistics, Humboldt Berlin. Builds AI agents in production. Solana SG Mini Hackathon Winner 2026. Currently open to engineering / research roles.",
  },

  // ── Availability / hire ────────────────────────────────────────────────
  {
    name: 'availability',
    test: /\b(available|hire|hiring|open\s*to\s*work|job|role|position|looking\s*for\s*work)\b/i,
    reply:
      "Yes — open to engineering, research, and product-minded technical roles. Drop your email in the lead panel below this console, or use GitHub for code context.",
  },
  {
    name: 'contact',
    test: /\b(contact|reach|email|get\s*in\s*touch|how\s*do\s*i\s*find|how\s*to\s*reach)\b.{0,30}(her|aileen|you)?$/i,
    reply:
      'Drop your email in the panel below this console; it goes to her inbox. GitHub: github.com/lilaclilac09.',
  },

  // ── Stack one-liner ────────────────────────────────────────────────────
  {
    name: 'stack',
    test: /\b(stack|tech\s*stack|tech|languages?|what\s*does\s*she\s*use|what\s*does\s*she\s*work\s*with)\b/i,
    reply:
      "Solana: Rust, Anchor, Pinocchio, Helius, Jito, SVM internals. Data + ML: Python, Monte Carlo, scikit-learn. AI agents: RAG, streaming, multi-step. Web: TypeScript, Next.js, Supabase, ClickHouse.",
  },
];

/**
 * Return a canned response for the input text if any rule matches, else null.
 * Pass priorTopics so greetings can catch up without an LLM round-trip.
 */
export function matchCanned(text: string, priorTopics: string[] = []): CannedHit | null {
  const stripped = text.trim();
  if (!stripped) return null;
  // Only short queries are candidates for canned replies. Long inputs
  // are probably substantive questions that deserve the real LLM path.
  if (stripped.length > 80) return null;

  for (const rule of RULES) {
    if (!rule.test.test(stripped)) continue;

    // Personalize greetings with catch-up when we know prior topics.
    if (rule.name.startsWith('greeting-') && priorTopics.length > 0) {
      const top = priorTopics
        .map((t) => t.replace(/…$/u, '').trim())
        .filter(Boolean)
        .slice(0, 2);
      if (rule.name === 'greeting-zh' && top.length > 0) {
        const tip =
          top.length === 1
            ? `上次你在看「${top[0]}」。要接着聊，还是换个话题？`
            : `上次你在看「${top[0]}」和「${top[1]}」。接着聊还是换新的？`;
        return { reply: `你好 — 欢迎回来。${tip}`, pattern: `${rule.name}+catchup` };
      }
      if (rule.name === 'greeting-de' && top.length > 0) {
        const tip =
          top.length === 1
            ? `Letztes Mal ging's um „${top[0]}“. Weitermachen oder was Neues?`
            : `Letztes Mal: „${top[0]}“ und „${top[1]}“. Weitermachen oder neu fragen?`;
        return { reply: `Hallo — willkommen zurück. ${tip}`, pattern: `${rule.name}+catchup` };
      }
      const tip =
        top.length === 1
          ? `Last time you were into “${top[0]}”. Pick that up, or something new?`
          : `You were looking at “${top[0]}” and “${top[1]}”. Catch up, or ask something new?`;
      return { reply: `Hey — welcome back. ${tip}`, pattern: `${rule.name}+catchup` };
    }

    return { reply: rule.reply, pattern: rule.name };
  }
  return null;
}
