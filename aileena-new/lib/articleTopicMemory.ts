/**
 * Cross-session "topic memory" for the chat agent.
 *
 * Stored in localStorage so it persists across browser closes (unlike the
 * in-conversation history which is sessionStorage-scoped). The server
 * receives `priorTopics: string[]` in the chat request body and uses it as
 * soft context for what the visitor has previously cared about.
 *
 * Pure client. No server persistence — small, opt-out by clearing site
 * storage, no PII surfaced.
 */

const STORAGE_KEY = 'aileena-visitor-topics';
const MAX_TOPICS = 5;
const MAX_TOPIC_CHARS = 80;

export type TopicMemory = {
  topics: string[];
  updatedAt: string;
};

function isBrowser() {
  return typeof window !== 'undefined' && 'localStorage' in window;
}

export function readTopicMemory(): TopicMemory {
  if (!isBrowser()) return { topics: [], updatedAt: '' };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { topics: [], updatedAt: '' };
    const parsed = JSON.parse(raw) as Partial<TopicMemory>;
    if (!Array.isArray(parsed.topics)) return { topics: [], updatedAt: '' };
    return {
      topics: parsed.topics.filter((t): t is string => typeof t === 'string').slice(0, MAX_TOPICS),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return { topics: [], updatedAt: '' };
  }
}

export function appendUserTopic(userMessage: string): void {
  if (!isBrowser()) return;
  const trimmed = userMessage.trim().replace(/\s+/g, ' ');
  if (!trimmed) return;
  const topic = trimmed.length > MAX_TOPIC_CHARS ? trimmed.slice(0, MAX_TOPIC_CHARS - 1) + '…' : trimmed;

  const current = readTopicMemory();
  // Drop a prior topic that's fully contained in (or contains) the new one —
  // cheap dedup so refining a question doesn't leave both variants in memory.
  const filtered = current.topics.filter((t) => {
    const a = t.toLowerCase();
    const b = topic.toLowerCase();
    return !(a === b || a.includes(b) || b.includes(a));
  });
  const next: TopicMemory = {
    topics: [topic, ...filtered].slice(0, MAX_TOPICS),
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // private mode / quota — silently drop the update; agent still works.
  }
}

export function clearTopicMemory(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Short label for catch-up (trim ellipsis / filler). */
function tidyTopic(topic: string): string {
  return topic.replace(/…$/u, '').trim();
}

/**
 * Warm hello + optional catch-up from prior topics.
 * Used on console open and for canned greetings — accommodate-first.
 */
export function buildCatchUpGreeting(topics: string[] = []): string {
  const top = topics.map(tidyTopic).filter(Boolean).slice(0, 2);
  if (top.length === 0) {
    return "Hey — good to see you. Ask about Aileen's work, writing, music shelf, or whether she's free to hire.";
  }
  if (top.length === 1) {
    return `Hey — welcome back. Last time you were into “${top[0]}”. Want to pick that up, or something new?`;
  }
  return `Hey — welcome back. You were looking at “${top[0]}” and “${top[1]}”. Catch up on those, or ask something new?`;
}

/** One-line catch-up hint for empty-state UI (no full greeting). */
export function buildCatchUpHint(topics: string[] = []): string | null {
  const top = topics.map(tidyTopic).filter(Boolean).slice(0, 2);
  if (top.length === 0) return null;
  if (top.length === 1) return `catch-up · last time: ${top[0]}`;
  return `catch-up · ${top[0]} · ${top[1]}`;
}
