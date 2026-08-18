/**
 * Daily board persistence.
 * Redis when UPSTASH_* is set; in-memory fallback for same-instance local QA.
 * Memory is not durable across cold starts — GET reports persistence.
 */

import { getVisitorRedis } from './visitorMemory';
import { taipeiDay } from './taipeiDay';
import {
  type DailyComment,
  type DailyNote,
  type DailyTheme,
  DAILY_COMMENT_MAX,
  DAILY_NOTE_BODY_MAX,
  DAILY_NOTE_TITLE_MAX,
  clipText,
  isYmd,
  noteIdForDate,
  sanitizeNickname,
  sanitizeTheme,
} from './dailyBoard';

const THEME_KEY = 'daily:theme';
const NOTES_KEY = 'daily:notes';

function commentsKey(noteId: string): string {
  return `daily:comments:${noteId}`;
}

type Memory = {
  theme: DailyTheme;
  notes: DailyNote[];
  comments: Record<string, DailyComment[]>;
};

const g = globalThis as typeof globalThis & { __aileenaDailyBoard?: Memory };

function memory(): Memory {
  if (!g.__aileenaDailyBoard) {
    g.__aileenaDailyBoard = { theme: sanitizeTheme(null), notes: [], comments: {} };
  }
  return g.__aileenaDailyBoard;
}

export function dailyBoardPersistence(): 'redis' | 'memory' {
  return getVisitorRedis() ? 'redis' : 'memory';
}

function parseJson<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  if (typeof raw === 'object') return raw as T;
  return null;
}

function sortNotes(notes: DailyNote[]): DailyNote[] {
  return [...notes].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function newCommentId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return `c-${c.randomUUID()}`;
  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function readDailyTheme(): Promise<DailyTheme> {
  const redis = getVisitorRedis();
  if (!redis) return memory().theme;
  const raw = await redis.get(THEME_KEY);
  const parsed = parseJson<DailyTheme>(raw);
  return sanitizeTheme(parsed);
}

export async function writeDailyTheme(theme: DailyTheme): Promise<DailyTheme> {
  const next = sanitizeTheme(theme);
  const redis = getVisitorRedis();
  if (!redis) {
    memory().theme = next;
    return next;
  }
  await redis.set(THEME_KEY, next);
  return next;
}

export async function readDailyNotes(): Promise<DailyNote[]> {
  const redis = getVisitorRedis();
  if (!redis) return sortNotes(memory().notes);
  const raw = await redis.get(NOTES_KEY);
  const parsed = parseJson<DailyNote[]>(raw);
  if (!Array.isArray(parsed)) return [];
  return sortNotes(
    parsed.filter(
      (n) =>
        n &&
        typeof n === 'object' &&
        typeof n.id === 'string' &&
        isYmd(n.date) &&
        typeof n.body === 'string',
    ),
  );
}

async function writeDailyNotes(notes: DailyNote[]): Promise<void> {
  const next = sortNotes(notes);
  const redis = getVisitorRedis();
  if (!redis) {
    memory().notes = next;
    return;
  }
  await redis.set(NOTES_KEY, next);
}

export async function upsertDailyNote(input: {
  date?: string;
  title?: string;
  body: string;
}): Promise<DailyNote> {
  const date = isYmd(input.date) ? input.date : taipeiDay();
  const id = noteIdForDate(date);
  const now = new Date().toISOString();
  const notes = await readDailyNotes();
  const existing = notes.find((n) => n.id === id || n.date === date);
  const note: DailyNote = {
    id,
    date,
    title: clipText(input.title, DAILY_NOTE_TITLE_MAX).trim(),
    body: clipText(input.body, DAILY_NOTE_BODY_MAX),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const rest = notes.filter((n) => n.id !== id && n.date !== date);
  await writeDailyNotes([note, ...rest]);
  return note;
}

export async function readComments(noteId: string, includeHidden = false): Promise<DailyComment[]> {
  if (!noteId || noteId.length > 80) return [];
  const redis = getVisitorRedis();
  const raw = redis ? await redis.get(commentsKey(noteId)) : memory().comments[noteId];
  const parsed = redis ? parseJson<DailyComment[]>(raw) : (raw as DailyComment[] | undefined);
  if (!Array.isArray(parsed)) return [];
  const list = parsed.filter(
    (c) =>
      c &&
      typeof c === 'object' &&
      typeof c.id === 'string' &&
      typeof c.body === 'string' &&
      c.noteId === noteId,
  );
  const visible = includeHidden ? list : list.filter((c) => !c.hidden);
  return visible.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

async function writeComments(noteId: string, comments: DailyComment[]): Promise<void> {
  const redis = getVisitorRedis();
  if (!redis) {
    memory().comments[noteId] = comments;
    return;
  }
  await redis.set(commentsKey(noteId), comments);
}

export async function addDailyComment(input: {
  noteId: string;
  nickname?: string;
  body: string;
}): Promise<DailyComment | { error: 'missing_note' | 'empty' }> {
  const noteId = clipText(input.noteId, 80).trim();
  const body = clipText(input.body, DAILY_COMMENT_MAX).trim();
  if (!noteId || !body) return { error: 'empty' };
  const notes = await readDailyNotes();
  if (!notes.some((n) => n.id === noteId)) return { error: 'missing_note' };
  const comment: DailyComment = {
    id: newCommentId(),
    noteId,
    nickname: sanitizeNickname(input.nickname),
    body,
    createdAt: new Date().toISOString(),
    hidden: false,
  };
  const existing = await readComments(noteId, true);
  await writeComments(noteId, [...existing, comment]);
  return comment;
}

export async function hideDailyComment(commentId: string): Promise<boolean> {
  const id = clipText(commentId, 80).trim();
  if (!id) return false;
  const notes = await readDailyNotes();
  for (const note of notes) {
    const comments = await readComments(note.id, true);
    const next = comments.map((c) => (c.id === id ? { ...c, hidden: true } : c));
    if (next.some((c, i) => c.hidden !== comments[i]?.hidden)) {
      await writeComments(note.id, next);
      return true;
    }
  }
  return false;
}

export async function readDailyBoard(opts?: { owner?: boolean }) {
  const [theme, notes] = await Promise.all([readDailyTheme(), readDailyNotes()]);
  const comments: Record<string, DailyComment[]> = {};
  await Promise.all(
    notes.map(async (note) => {
      comments[note.id] = await readComments(note.id, Boolean(opts?.owner));
    }),
  );
  return {
    theme,
    notes,
    comments,
    persistence: dailyBoardPersistence(),
    today: taipeiDay(),
  };
}
