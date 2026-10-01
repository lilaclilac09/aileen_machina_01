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
  type DailySnapState,
  type DailyTheme,
  DAILY_COMMENT_MAX,
  DAILY_NOTE_BODY_MAX,
  DAILY_NOTE_TITLE_MAX,
  DAILY_SNAP_MAX_BYTES,
  clipText,
  coerceDailyNote,
  isDailySnapMime,
  isYmd,
  normalizeSnapBase64,
  noteIdForDate,
  noteIsPublished,
  publicComment,
  sanitizeNickname,
  sanitizeTheme,
  snapByteLength,
} from './dailyBoard';

const THEME_KEY = 'daily:theme';
const NOTES_KEY = 'daily:notes';

function commentsKey(noteId: string): string {
  return `daily:comments:${noteId}`;
}

function snapBlobKey(noteId: string): string {
  return `daily:snap:blob:${noteId}`;
}

type SnapBlob = { mime: string; data: string };

type Memory = {
  theme: DailyTheme;
  notes: DailyNote[];
  comments: Record<string, DailyComment[]>;
  snaps: Record<string, SnapBlob>;
};

const g = globalThis as typeof globalThis & { __aileenaDailyBoard?: Memory };

function memory(): Memory {
  if (!g.__aileenaDailyBoard) {
    g.__aileenaDailyBoard = { theme: sanitizeTheme(null), notes: [], comments: {}, snaps: {} };
  }
  if (!g.__aileenaDailyBoard.snaps) g.__aileenaDailyBoard.snaps = {};
  return g.__aileenaDailyBoard;
}

export function dailyBoardPersistence(): 'redis' | 'memory' {
  return getVisitorRedis() ? 'redis' : 'memory';
}

/** Vercel instances do not share RAM — refuse memory writes in production. */
export function dailyBoardWritesOk(): boolean {
  if (dailyBoardPersistence() === 'redis') return true;
  return process.env['VERCEL'] !== '1';
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
  const parsed = parseJson<unknown[]>(raw);
  if (!Array.isArray(parsed)) return [];
  return sortNotes(parsed.map(coerceDailyNote).filter((n): n is DailyNote => Boolean(n)));
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
  published?: boolean;
}): Promise<DailyNote> {
  const date = isYmd(input.date) ? input.date : taipeiDay();
  const id = noteIdForDate(date);
  const now = new Date().toISOString();
  const notes = await readDailyNotes();
  const existing = notes.find((n) => n.id === id || n.date === date);
  const published =
    input.published === true
      ? true
      : input.published === false
        ? false
        : existing
          ? noteIsPublished(existing)
          : false;
  const note: DailyNote = {
    id,
    date,
    title: clipText(input.title, DAILY_NOTE_TITLE_MAX).trim(),
    body: clipText(input.body, DAILY_NOTE_BODY_MAX),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    published,
    snap: existing?.snap ?? 'none',
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
  const note = notes.find((n) => n.id === noteId);
  if (!note || !noteIsPublished(note)) return { error: 'missing_note' };
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

async function persistNoteSnap(noteId: string, snap: DailySnapState): Promise<DailyNote | null> {
  const notes = await readDailyNotes();
  const existing = notes.find((n) => n.id === noteId);
  if (!existing) return null;
  const next: DailyNote = { ...existing, snap, updatedAt: new Date().toISOString() };
  await writeDailyNotes(notes.map((n) => (n.id === noteId ? next : n)));
  return next;
}

export async function writeDailySnap(input: {
  noteId: string;
  mime: unknown;
  data: unknown;
}): Promise<DailyNote | { error: 'missing_note' | 'invalid' | 'too_large' }> {
  const noteId = clipText(input.noteId, 80).trim();
  if (!noteId || !isDailySnapMime(input.mime)) return { error: 'invalid' };
  const data = normalizeSnapBase64(input.data);
  if (!data) return { error: 'invalid' };
  if (snapByteLength(data) > DAILY_SNAP_MAX_BYTES) return { error: 'too_large' };

  const notes = await readDailyNotes();
  if (!notes.some((n) => n.id === noteId)) return { error: 'missing_note' };

  const blob: SnapBlob = { mime: input.mime, data };
  const key = snapBlobKey(noteId);
  const redis = getVisitorRedis();
  if (redis) {
    await redis.set(key, blob);
  } else {
    memory().snaps[key] = blob;
  }
  const note = await persistNoteSnap(noteId, 'ready');
  return note || { error: 'missing_note' };
}

export async function readDailySnapBlob(noteId: string): Promise<SnapBlob | null> {
  const id = clipText(noteId, 80).trim();
  if (!id) return null;
  const key = snapBlobKey(id);
  const redis = getVisitorRedis();
  if (redis) {
    const raw = await redis.get(key);
    const parsed = parseJson<SnapBlob>(raw);
    if (!parsed || !isDailySnapMime(parsed.mime) || typeof parsed.data !== 'string') return null;
    return parsed;
  }
  return memory().snaps[key] || null;
}

async function deleteDailySnapBlob(noteId: string) {
  const key = snapBlobKey(noteId);
  const redis = getVisitorRedis();
  if (redis) {
    await redis.del(key);
    return;
  }
  delete memory().snaps[key];
}

export async function openAndBurnDailySnap(
  noteId: string,
): Promise<{ status: 'ready'; blob: SnapBlob } | { status: 'burned' } | { status: 'none' }> {
  const id = clipText(noteId, 80).trim();
  if (!id) return { status: 'none' };
  const notes = await readDailyNotes();
  const note = notes.find((n) => n.id === id);
  if (!note || !noteIsPublished(note)) return { status: 'none' };
  if (note.snap === 'burned') return { status: 'burned' };
  if (note.snap !== 'ready') return { status: 'none' };

  const blob = await readDailySnapBlob(id);
  await deleteDailySnapBlob(id);
  await persistNoteSnap(id, 'burned');
  if (!blob) return { status: 'burned' };
  return { status: 'ready', blob };
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

export type PublicDailyBoard = {
  theme: DailyTheme;
  notes: DailyNote[];
  comments: Record<string, ReturnType<typeof publicComment>[]>;
  persistence: 'redis' | 'memory';
  today: string;
  owner: boolean;
};

export async function readPublicDailyBoard(owner: boolean): Promise<PublicDailyBoard> {
  const board = await readDailyBoard({ owner });
  const notes = owner ? board.notes : board.notes.filter((n) => noteIsPublished(n));
  const comments: PublicDailyBoard['comments'] = {};
  for (const note of notes) {
    const list = board.comments[note.id] ?? [];
    comments[note.id] = list.filter((c) => !c.hidden).map(publicComment);
  }
  return {
    theme: board.theme,
    notes,
    comments,
    persistence: board.persistence,
    today: board.today,
    owner,
  };
}
