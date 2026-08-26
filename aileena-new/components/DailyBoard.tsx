'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import OwnerCornerUnlock from './OwnerCornerUnlock';
import SystemToast from './SystemToast';
import {
  type DailyComment,
  type DailyNote,
  type DailyTheme,
  DAILY_ACCENT_SWATCHES,
  DAILY_BG_SWATCHES,
  DAILY_BUBBLE_SWATCHES,
  DAILY_COMMENT_MAX,
  DAILY_NOTE_BODY_MAX,
  DAILY_NOTE_TITLE_MAX,
  DAILY_TEXT_SWATCHES,
  DAILY_THEME_DEFAULT,
  noteIdForDate,
} from '../lib/dailyBoard';

const serif = "'Iowan Old Style', 'Charter', 'Source Serif Pro', Georgia, serif";
const sans = "'Nunito', system-ui, -apple-system, sans-serif";
const DRAFT_KEY = 'daily:draft-body';

function readDraft(): string {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(DRAFT_KEY) || '';
  } catch {
    return '';
  }
}

function writeDraft(value: string) {
  if (typeof window === 'undefined') return;
  try {
    if (value) sessionStorage.setItem(DRAFT_KEY, value);
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* private mode */
  }
}

type BoardPayload = {
  theme: DailyTheme;
  notes: DailyNote[];
  comments: Record<string, Omit<DailyComment, 'hidden'>[]>;
  persistence: 'redis' | 'memory';
  today: string;
  owner: boolean;
};

function formatQuietDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function SwatchRow({
  label,
  value,
  colors,
  onPick,
}: {
  label: string;
  value: string;
  colors: readonly string[];
  onPick: (hex: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 44,
          fontFamily: sans,
          fontSize: 10,
          letterSpacing: '0.04em',
          opacity: 0.4,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {colors.map((hex) => {
          const on = hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={`${label}-${hex}`}
              type="button"
              aria-label={`${label} ${hex}`}
              data-testid={`daily-swatch-${label}-${hex.slice(1)}`}
              onClick={() => onPick(hex)}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: hex,
                border: on ? '1.5px solid currentColor' : '1px solid rgba(0,0,0,0.16)',
                padding: 0,
                cursor: 'pointer',
                boxShadow: on ? '0 0 0 2px rgba(0,0,0,0.1)' : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function Caret() {
  return <span className="daily-caret" aria-hidden data-testid="daily-caret" />;
}

function NoteBody({
  text,
  caret,
}: {
  text: string;
  caret?: boolean;
}) {
  const lines = text.length ? text.split('\n') : [''];
  return (
    <p
      data-testid={caret ? 'daily-latest-body' : undefined}
      style={{
        margin: 0,
        fontFamily: serif,
        fontSize: 'inherit',
        fontWeight: 400,
        lineHeight: 1.45,
        letterSpacing: '-0.01em',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 ? '\n' : null}
        </span>
      ))}
      {caret ? <Caret /> : null}
    </p>
  );
}

function Bubble({
  comment,
  owner,
  onHide,
}: {
  comment: Omit<DailyComment, 'hidden'>;
  owner: boolean;
  onHide: (id: string) => void;
}) {
  return (
    <div
      data-testid="daily-bubble"
      style={{
        justifySelf: 'start',
        maxWidth: '88%',
        background: 'var(--daily-bubble)',
        borderRadius: '18px 18px 18px 6px',
        padding: '8px 12px 9px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontSize: 11, opacity: 0.5, fontFamily: sans }}>{comment.nickname || 'anon'}</span>
        {owner ? (
          <button
            type="button"
            aria-label="hide bubble"
            onClick={() => onHide(comment.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              opacity: 0.35,
              cursor: 'pointer',
              fontSize: 11,
              padding: 0,
            }}
          >
            hide
          </button>
        ) : null}
      </div>
      <p
        style={{
          margin: '2px 0 0',
          fontFamily: sans,
          fontSize: 14,
          lineHeight: 1.35,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {comment.body}
      </p>
    </div>
  );
}

export default function DailyBoard({
  initial = null,
  denied = false,
}: {
  initial?: BoardPayload | null;
  denied?: boolean;
}) {
  const [board, setBoard] = useState<BoardPayload | null>(initial);
  const [title, setTitle] = useState(() => {
    const today = initial?.today ?? '';
    return initial?.notes?.find((n) => n.date === today)?.title ?? '';
  });
  const [body, setBody] = useState(() => {
    const today = initial?.today ?? '';
    return initial?.notes?.find((n) => n.date === today)?.body ?? '';
  });
  const [saving, setSaving] = useState(false);
  const [nick, setNick] = useState('');
  const [bubble, setBubble] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [toastFail, setToastFail] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toastTimer = useRef<number | null>(null);
  const didRestoreDraft = useRef(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/daily', { cache: 'no-store', credentials: 'include' });
    if (!res.ok) return;
    const data = (await res.json()) as BoardPayload;
    const notes = Array.isArray(data.notes) ? data.notes : [];
    const today = typeof data.today === 'string' ? data.today : '';
    setBoard({
      theme: data.theme ?? DAILY_THEME_DEFAULT,
      notes,
      comments: data.comments ?? {},
      persistence: data.persistence === 'redis' ? 'redis' : 'memory',
      today,
      owner: Boolean(data.owner),
    });
    const todayNote = notes.find((n) => n.date === today);
    if (data.owner) {
      setTitle(todayNote?.title ?? '');
      setBody(todayNote?.body ?? '');
    }
  }, []);

  const owner = Boolean(board?.owner);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  }, [body, owner]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const theme = board?.theme ?? DAILY_THEME_DEFAULT;
  const notes = board?.notes ?? [];
  const today = board?.today ?? '';
  const visibleNotes = notes.filter((n) => n.body.trim());
  const latest = visibleNotes[0] ?? null;
  const todayNote = notes.find((n) => n.date === today) ?? null;
  const showWriter = owner;
  const older = owner
    ? visibleNotes.filter((n) => n.date !== today)
    : visibleNotes.slice(1);
  const commentNoteId = owner
    ? todayNote?.id || (today ? noteIdForDate(today) : '')
    : latest?.id || (today ? noteIdForDate(today) : '');

  const flash = (msg: string, fail = false) => {
    setToast(msg);
    setToastFail(fail);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const saveNote = async (nextBody = body, nextTitle = title) => {
    if (!owner) return;
    setSaving(true);
    flash('⚡ Saving.');
    try {
      const res = await fetch('/api/daily/notes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle, body: nextBody }),
      });
      if (res.status === 403) {
        flash('⚡ Save failed.', true);
        return;
      }
      if (res.status === 503) {
        flash('⚡ Save failed.', true);
        return;
      }
      if (!res.ok) {
        flash('⚡ Save failed.', true);
        return;
      }
      writeDraft('');
      await load();
      flash('⚡ Saved.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!owner) return;
    if (didRestoreDraft.current) return;
    if (todayNote?.body) {
      didRestoreDraft.current = true;
      return;
    }
    const draft = readDraft();
    if (draft) setBody(draft);
    didRestoreDraft.current = true;
  }, [owner, todayNote?.body]);

  useEffect(() => {
    if (!owner) return;
    const id = window.setTimeout(() => {
      const draft = body.trim() ? body : readDraft();
      if (!draft.trim() && !title.trim()) return;
      if (todayNote && draft === todayNote.body && title === todayNote.title) return;
      void saveNote(draft, title);
    }, 900);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, body, title, todayNote?.id, todayNote?.body, todayNote?.title]);

  const patchTheme = async (partial: Partial<DailyTheme>) => {
    if (!owner) return;
    const next = { ...theme, ...partial };
    setBoard((prev) => (prev ? { ...prev, theme: next } : prev));
    const res = await fetch('/api/daily/theme', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
    if (!res.ok) {
      flash('⚡ Save failed.', true);
      await load();
    }
  };

  const sendBubble = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!commentNoteId) return;
    const text = bubble.trim();
    if (!text) return;
    const res = await fetch('/api/daily/comments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: commentNoteId, body: text, nickname: nick }),
    });
    if (!res.ok) {
      flash('⚡ Bubble failed.', true);
      return;
    }
    setBubble('');
    flash('⚡ Bubble sent.');
    await load();
  };

  const hideComment = async (id: string) => {
    if (!owner) return;
    const res = await fetch(`/api/daily/comments?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) await load();
  };

  const commentsFor = useCallback(
    (noteId: string) => board?.comments?.[noteId] ?? [],
    [board],
  );

  const pageStyle = useMemo(
    () =>
      ({
        '--daily-bg': theme.background,
        '--daily-text': theme.text,
        '--daily-accent': theme.accent,
        '--daily-bubble': theme.bubble,
        background: theme.background,
        color: theme.text,
        minHeight: '100dvh',
        fontFamily: sans,
      }) as CSSProperties,
    [theme],
  );

  return (
    <div className="mobile-page daily-board" data-testid="daily-board" style={pageStyle}>
      <div
        style={{
          maxWidth: 560,
          margin: '0 auto',
          padding:
            'max(88px, calc(env(safe-area-inset-top, 0px) + 72px)) 22px max(48px, calc(env(safe-area-inset-bottom, 0px) + 28px))',
        }}
      >
        <header style={{ marginBottom: 36 }}>
          <h1
            data-testid="daily-title"
            style={{
              margin: 0,
              fontFamily: serif,
              fontSize: 'clamp(1.85rem, 6vw, 2.4rem)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            two lines
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontFamily: sans,
              fontSize: 14,
              opacity: 0.55,
              fontWeight: 500,
            }}
          >
            one or two lines a day.
          </p>
        </header>

        {!board ? null : (
        <>
        {owner ? (
          <div data-testid="daily-theme-controls" style={{ display: 'grid', gap: 6, marginBottom: 28 }}>
            <SwatchRow label="bg" value={theme.background} colors={DAILY_BG_SWATCHES} onPick={(hex) => void patchTheme({ background: hex })} />
            <SwatchRow label="text" value={theme.text} colors={DAILY_TEXT_SWATCHES} onPick={(hex) => void patchTheme({ text: hex })} />
            <SwatchRow label="accent" value={theme.accent} colors={DAILY_ACCENT_SWATCHES} onPick={(hex) => void patchTheme({ accent: hex })} />
            <SwatchRow label="bubble" value={theme.bubble} colors={DAILY_BUBBLE_SWATCHES} onPick={(hex) => void patchTheme({ bubble: hex })} />
          </div>
        ) : null}

        {showWriter ? (
          <section data-testid="daily-owner-editor" style={{ marginBottom: 40 }}>
            <input
              aria-label="title"
              placeholder=""
              value={title}
              maxLength={DAILY_NOTE_TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (owner) void saveNote();
              }}
              style={{
                display: title || owner ? 'block' : 'none',
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'inherit',
                fontFamily: sans,
                fontSize: 12,
                opacity: 0.4,
                marginBottom: 8,
                padding: 0,
                userSelect: 'text',
                WebkitUserSelect: 'text',
              }}
            />
            <textarea
              ref={textareaRef}
              data-testid="daily-owner-textarea"
              placeholder="write one or two lines"
              value={body}
              maxLength={DAILY_NOTE_BODY_MAX}
              rows={5}
              onBlur={() => {
                if (owner) void saveNote();
              }}
              onChange={(e) => {
                const next = e.target.value;
                setBody(next);
                writeDraft(next);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.max(96, e.target.scrollHeight)}px`;
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (owner) void saveNote();
                }
              }}
              inputMode="text"
              autoCapitalize="sentences"
              autoCorrect="on"
              spellCheck
              enterKeyHint="done"
              style={{
                display: 'block',
                width: '100%',
                resize: 'none',
                overflow: 'hidden',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'inherit',
                caretColor: theme.accent,
                fontFamily: serif,
                fontSize: 'max(16px, clamp(1.35rem, 4.6vw, 1.85rem))',
                lineHeight: 1.45,
                letterSpacing: '-0.01em',
                padding: 0,
                minHeight: 120,
                cursor: 'text',
                touchAction: 'manipulation',
                userSelect: 'text',
                WebkitUserSelect: 'text',
              }}
            />
            <p style={{ margin: '8px 0 0', fontSize: 11, opacity: 0.4, fontFamily: sans, display: 'flex', gap: 12 }}>
              <span>{saving ? 'saving' : today ? formatQuietDate(today) : 'today'}</span>
              <button
                type="button"
                data-testid="daily-save"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void saveNote()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.accent,
                  fontFamily: sans,
                  fontSize: 11,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                save
              </button>
            </p>
          </section>
        ) : (
          <section data-testid="daily-latest" style={{ marginBottom: 28 }}>
            {latest ? (
              <>
                <p style={{ margin: '0 0 10px', fontSize: 12, opacity: 0.45, fontFamily: sans }}>
                  {formatQuietDate(latest.date)}
                </p>
                {latest.title ? (
                  <p style={{ margin: '0 0 8px', fontSize: 13, opacity: 0.5, fontFamily: sans }}>{latest.title}</p>
                ) : null}
                <div style={{ fontSize: 'clamp(1.35rem, 4.6vw, 1.85rem)' }}>
                  <NoteBody text={latest.body} caret />
                </div>
              </>
            ) : (
              <p
                data-testid="daily-empty"
                style={{
                  margin: 0,
                  fontFamily: serif,
                  fontSize: 'clamp(1.35rem, 4.6vw, 1.85rem)',
                  lineHeight: 1.45,
                  opacity: 0.55,
                }}
              >
                nothing today yet.
                <Caret />
              </p>
            )}
          </section>
        )}

        {commentNoteId ? (
          <div data-testid="daily-comments" style={{ display: 'grid', gap: 10, marginBottom: 36 }}>
            {commentsFor(commentNoteId).map((c) => (
              <Bubble key={c.id} comment={c} owner={owner} onHide={(id) => void hideComment(id)} />
            ))}
            <form
              onSubmit={(e) => void sendBubble(e)}
              data-testid="daily-bubble-form"
              style={{
                display: 'grid',
                gap: 6,
                marginTop: 6,
                paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))',
              }}
            >
              <input
                aria-label="nickname"
                placeholder="anon"
                value={nick}
                maxLength={24}
                onChange={(e) => setNick(e.target.value)}
                style={{
                  width: 120,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid color-mix(in srgb, ${theme.text} 18%, transparent)`,
                  color: 'inherit',
                  fontFamily: sans,
                  fontSize: 16,
                  opacity: 0.55,
                  outline: 'none',
                  padding: '4px 0',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                  data-testid="daily-bubble-input"
                  placeholder="leave a small bubble"
                  value={bubble}
                  maxLength={DAILY_COMMENT_MAX}
                  rows={2}
                  onChange={(e) => setBubble(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void sendBubble();
                    }
                  }}
                  style={{
                    flex: 1,
                    resize: 'none',
                    background: 'transparent',
                    border: `1px solid color-mix(in srgb, ${theme.text} 16%, transparent)`,
                    borderRadius: 14,
                    color: 'inherit',
                    fontFamily: sans,
                    fontSize: 16,
                    lineHeight: 1.35,
                    padding: '10px 12px',
                    outline: 'none',
                    minHeight: 44,
                    cursor: 'text',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                  }}
                />
                <button
                  type="submit"
                  data-testid="daily-bubble-send"
                  disabled={!bubble.trim()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.accent,
                    fontFamily: sans,
                    fontSize: 13,
                    cursor: bubble.trim() ? 'pointer' : 'default',
                    opacity: bubble.trim() ? 1 : 0.35,
                    padding: '8px 0',
                    minHeight: 44,
                  }}
                >
                  send
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {older.map((note) => (
          <section
            key={note.id}
            style={{ marginTop: 36, opacity: 0.55 }}
            data-testid="daily-older-note"
          >
            <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: sans }}>{formatQuietDate(note.date)}</p>
            {note.title ? (
              <p style={{ margin: '0 0 6px', fontSize: 12, fontFamily: sans }}>{note.title}</p>
            ) : null}
            <div style={{ fontSize: 'clamp(1.05rem, 3.2vw, 1.25rem)' }}>
              <NoteBody text={note.body} />
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {commentsFor(note.id).map((c) => (
                <Bubble key={c.id} comment={c} owner={owner} onHide={(id) => void hideComment(id)} />
              ))}
            </div>
          </section>
        ))}
        </>
        )}
      </div>

      {!owner ? <OwnerCornerUnlock denied={denied} /> : null}

      {toast ? (
        <SystemToast testId="daily-toast" role={toastFail ? 'alert' : 'status'}>
          {toast}
        </SystemToast>
      ) : null}
    </div>
  );
}
