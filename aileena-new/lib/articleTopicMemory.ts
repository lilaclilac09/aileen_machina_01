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
