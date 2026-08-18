/**
 * Daily board — private-write / public-read notes + anonymous bubbles.
 * Types, defaults, and sanitizers. Persistence lives in dailyBoardStore.
 */

export type DailyTheme = {
  background: string;
  text: string;
  accent: string;
  bubble: string;
};

export type DailyNote = {
  id: string;
  date: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyComment = {
  id: string;
  noteId: string;
  nickname: string;
  body: string;
  createdAt: string;
  hidden: boolean;
};

export const DAILY_THEME_DEFAULT: DailyTheme = {
  background: '#f4efe6',
  text: '#2a241c',
  accent: '#00a89d',
  bubble: '#ece6dc',
};

export const DAILY_NOTE_BODY_MAX = 400;
export const DAILY_NOTE_TITLE_MAX = 80;
export const DAILY_COMMENT_MAX = 160;
export const DAILY_NICK_MAX = 24;

export const DAILY_BG_SWATCHES = [
  '#f4efe6',
  '#f7f3ea',
  '#efe8dc',
  '#e7f0ee',
  '#f3e6e8',
  '#ece8f3',
] as const;

export const DAILY_TEXT_SWATCHES = [
  '#2a241c',
  '#1a1814',
  '#3d3428',
  '#1f3d3a',
  '#4a2c2a',
  '#243044',
] as const;

export const DAILY_ACCENT_SWATCHES = [
  '#00a89d',
  '#c45c4a',
  '#2a241c',
  '#6b8f71',
  '#8b6914',
  '#5a6ea8',
] as const;

export const DAILY_BUBBLE_SWATCHES = [
  '#ece6dc',
  '#e4efe9',
  '#f0e4e6',
  '#fffdf8',
  '#dfe8e6',
  '#e8e4f0',
] as const;

const HEX = /^#[0-9a-fA-F]{6}$/;
const BLOCKED_NICKS = new Set(['aileena', 'aileen', 'owner', 'admin', 'aileena.xyz']);

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX.test(value);
}

export function sanitizeTheme(raw: unknown): DailyTheme {
  const t = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    background: isHexColor(t.background) ? t.background : DAILY_THEME_DEFAULT.background,
    text: isHexColor(t.text) ? t.text : DAILY_THEME_DEFAULT.text,
    accent: isHexColor(t.accent) ? t.accent : DAILY_THEME_DEFAULT.accent,
    bubble: isHexColor(t.bubble) ? t.bubble : DAILY_THEME_DEFAULT.bubble,
  };
}

export function noteIdForDate(date: string): string {
  return `n-${date}`;
}

export function isYmd(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function clipText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').slice(0, max);
}

export function sanitizeNickname(value: unknown): string {
  const raw = clipText(value, DAILY_NICK_MAX).replace(/\s+/g, ' ').trim();
  if (!raw) return 'anon';
  if (BLOCKED_NICKS.has(raw.toLowerCase())) return 'anon';
  return raw;
}

export function commentLooksSpammy(body: string): boolean {
  const urls = body.match(/https?:\/\/\S+/gi) ?? [];
  if (urls.length >= 2) return true;
  const trimmed = body.trim();
  if (urls.length === 1 && trimmed === urls[0]) return true;
  if ((body.match(/@/g) ?? []).length >= 3) return true;
  return false;
}

export function publicComment(c: DailyComment): Omit<DailyComment, 'hidden'> {
  return {
    id: c.id,
    noteId: c.noteId,
    nickname: c.nickname,
    body: c.body,
    createdAt: c.createdAt,
  };
}
