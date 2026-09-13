'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
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
  DAILY_SNAP_MAX_BYTES,
  DAILY_TEXT_SWATCHES,
  DAILY_THEME_DEFAULT,
  noteIsPublished,
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          width: 56,
          fontFamily: sans,
          fontSize: 11,
          letterSpacing: '0.04em',
          opacity: 0.55,
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: hex,
                border: on ? '1.5px solid currentColor' : '1px solid rgba(0,0,0,0.18)',
                padding: 0,
                cursor: 'pointer',
                boxShadow: on ? '0 0 0 2px rgba(0,0,0,0.12)' : 'none',
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

async function fileToSnap(
  file: File,
): Promise<{ mime: string; data: string } | { error: 'too_large' | 'invalid' }> {
  const toB64 = async (blob: Blob, mime: string) => {
    if (blob.size > DAILY_SNAP_MAX_BYTES) return { error: 'too_large' as const };
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      bin += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    return { mime, data: btoa(bin) };
  };

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1200;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height, 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return { error: 'invalid' };
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.72));
    if (!blob) return { error: 'invalid' };
    return toB64(blob, 'image/jpeg');
  } catch {
    if (!file.type || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return { error: 'invalid' };
    }
    return toB64(file, file.type);
  }
}

function snapImgStyle(): CSSProperties {
  return {
    display: 'block',
    width: '100%',
    maxHeight: 360,
    height: 'auto',
    objectFit: 'contain',
    background: 'transparent',
  };
}

function OwnerSnapPreview({ noteId }: { noteId: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/daily/snap?noteId=${encodeURIComponent(noteId)}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (cancelled) return;
      if (!res.ok) {
        setMissing(true);
        return;
      }
      const json = (await res.json()) as { mime?: string; data?: string };
      if (json.mime && json.data) setSrc(`data:${json.mime};base64,${json.data}`);
      else setMissing(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  if (missing) {
    return (
      <p data-testid="daily-owner-snap-missing" style={{ margin: 0, fontSize: 11, opacity: 0.4 }}>
        snap missing.
      </p>
    );
  }
  if (!src) {
    return (
      <p style={{ margin: 0, fontSize: 11, opacity: 0.4 }} data-testid="daily-owner-snap-loading">
        loading snap…
      </p>
    );
  }
  return (
    <figure data-testid="daily-owner-snap-preview" style={{ margin: '12px 0 0' }}>
      {/* data URL; Next/Image cannot host a view-once blob */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="your snap" style={snapImgStyle()} />
      <figcaption style={{ marginTop: 6, fontSize: 11, opacity: 0.4 }}>
        you can look — it burns for them
      </figcaption>
    </figure>
  );
}

function VisitorSnap({ note }: { note: DailyNote }) {
  const [phase, setPhase] = useState<'none' | 'seal' | 'seen' | 'burned'>(
    note.snap === 'ready' ? 'seal' : note.snap === 'burned' ? 'burned' : 'none',
  );
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPhase(note.snap === 'ready' ? 'seal' : note.snap === 'burned' ? 'burned' : 'none');
    setSrc(null);
  }, [note.id, note.snap]);

  if (phase === 'none') return null;

  const open = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/daily/snap/open', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId: note.id }),
      });
      if (res.status === 410 || res.status === 404) {
        setPhase('burned');
        setSrc(null);
        return;
      }
      if (!res.ok) return;
      const json = (await res.json()) as { mime?: string; data?: string };
      if (json.mime && json.data) {
        setSrc(`data:${json.mime};base64,${json.data}`);
        setPhase('seen');
      } else {
        setPhase('burned');
      }
    } finally {
      setBusy(false);
    }
  };

  if (phase === 'burned') {
    return (
      <p data-testid="daily-snap-burned" style={{ margin: '12px 0 0', fontSize: 12, opacity: 0.4 }}>
        burned.
      </p>
    );
  }

  if (phase === 'seen' && src) {
    return (
      <button
        type="button"
        data-testid="daily-snap-seen"
        onClick={() => {
          setPhase('burned');
          setSrc(null);
        }}
        style={{
          display: 'block',
          width: '100%',
          marginTop: 12,
          padding: 0,
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="snap" style={snapImgStyle()} />
        <span style={{ display: 'block', marginTop: 6, fontSize: 11, opacity: 0.4 }}>
          tap to burn
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      data-testid="daily-snap-seal"
      onClick={() => void open()}
      disabled={busy}
      style={{
        display: 'block',
        width: '100%',
        marginTop: 14,
        minHeight: 88,
        padding: '18px 14px',
        border: '1px dashed color-mix(in srgb, currentColor 28%, transparent)',
        borderRadius: 10,
        background: 'transparent',
        color: 'inherit',
        fontFamily: sans,
        fontSize: 13,
        letterSpacing: '0.02em',
        opacity: busy ? 0.45 : 0.7,
        cursor: busy ? 'wait' : 'pointer',
      }}
    >
      tap to see · then it burns
    </button>
  );
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

export default function DailyBoard({
  initial = null,
}: {
  initial?: BoardPayload | null;
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
  const snapInputRef = useRef<HTMLInputElement | null>(null);
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
    if (todayNote?.body) {
      setTitle(todayNote.title ?? '');
      setBody(todayNote.body);
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
  const latest = notes[0] ?? null;
  const todayNote = notes.find((n) => n.date === today) ?? null;
  const showWriter = owner;
  const older = owner ? notes.filter((n) => n.date !== today) : notes.slice(1);
  const showDecorativeCaret = !showWriter;
  const commentNote =
    todayNote && noteIsPublished(todayNote) ? todayNote : notes.find((n) => noteIsPublished(n)) ?? null;
  const showBubbles = Boolean(commentNote && noteIsPublished(commentNote));
  const todayIsDraft = owner && (!todayNote || !noteIsPublished(todayNote));

  const flash = (msg: string, fail = false) => {
    setToast(msg);
    setToastFail(fail);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const saveNote = async (nextBody = body, nextTitle = title, opts?: { published?: boolean }) => {
    if (!owner) return null;
    setSaving(true);
    try {
      const res = await fetch('/api/daily/notes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: nextTitle,
          body: nextBody,
          ...(opts?.published ? { published: true } : {}),
        }),
      });
      if (res.status === 403) {
        flash('Not allowed.', true);
        return null;
      }
      if (res.status === 503) {
        flash('Nope.', true);
        return null;
      }
      if (!res.ok) {
        flash('Save failed.', true);
        return null;
      }
      writeDraft('');
      const json = (await res.json()) as { note?: DailyNote };
      await load();
      return json.note ?? null;
    } finally {
      setSaving(false);
    }
  };

  const publishNote = async () => {
    if (!owner) return;
    if (!body.trim() && !title.trim() && todayNote?.snap !== 'ready') {
      flash('nothing to publish.', true);
      return;
    }
    const note = await saveNote(body, title, { published: true });
    if (note) flash('published.');
  };

  const attachSnap = async (file: File | undefined) => {
    if (!owner || !file) return;
    const packed = await fileToSnap(file);
    if ('error' in packed) {
      flash(packed.error === 'too_large' ? 'snap too large.' : 'snap failed.', true);
      return;
    }
    let note = todayNote;
    if (!note) {
      note = await saveNote(body, title);
    }
    if (!note?.id) {
      flash('Save failed.', true);
      return;
    }
    const res = await fetch('/api/daily/snap', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: note.id, mime: packed.mime, data: packed.data }),
    });
    if (res.status === 403) {
      flash('Not allowed.', true);
      return;
    }
    if (res.status === 503) {
      flash('Nope.', true);
      return;
    }
    if (!res.ok) {
      flash('snap failed.', true);
      return;
    }
    await load();
  };

  useEffect(() => {
    if (didRestoreDraft.current) return;
    if (todayNote?.body) {
      didRestoreDraft.current = true;
      return;
    }
    const draft = readDraft();
    if (draft) setBody(draft);
    didRestoreDraft.current = true;
  }, [todayNote?.body]);

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
      flash('Save failed.', true);
      await load();
    }
  };

  const sendBubble = async (e: FormEvent) => {
    e.preventDefault();
    if (!commentNote) return;
    const text = bubble.trim();
    if (!text) return;
    const res = await fetch('/api/daily/comments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: commentNote.id, body: text, nickname: nick }),
    });
    if (res.status === 503) {
      flash('Nope.', true);
      return;
    }
    if (!res.ok) {
      flash('Nope.', true);
      return;
    }
    setBubble('');
    flash('Bubble sent.');
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
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
              daily board
            </h1>
            {owner ? (
              <button
                type="button"
                data-testid="daily-publish"
                aria-label="publish"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void publishNote()}
                disabled={saving}
                style={{
                  flexShrink: 0,
                  marginTop: 4,
                  background: 'transparent',
                  border: '1.5px solid currentColor',
                  borderRadius: 999,
                  color: 'inherit',
                  fontFamily: sans,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '7px 14px',
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.45 : 1,
                }}
              >
                PUBLISH
              </button>
            ) : null}
          </div>
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
          {todayIsDraft ? (
            <p
              data-testid="daily-draft-badge"
              style={{
                margin: '6px 0 0',
                fontFamily: sans,
                fontSize: 11,
                opacity: 0.45,
                fontWeight: 500,
              }}
            >
              draft · only you
            </p>
          ) : owner && todayNote && noteIsPublished(todayNote) ? (
            <p
              data-testid="daily-published-badge"
              style={{
                margin: '6px 0 0',
                fontFamily: sans,
                fontSize: 11,
                opacity: 0.4,
                fontWeight: 500,
              }}
            >
              published
            </p>
          ) : null}
          {board?.persistence === 'memory' ? (
            <p
              data-testid="daily-persistence"
              style={{
                margin: '4px 0 0',
                fontFamily: sans,
                fontSize: 11,
                opacity: 0.4,
                fontWeight: 500,
              }}
            >
              this instance
            </p>
          ) : board ? (
            <p data-testid="daily-persistence" hidden>
              kept
            </p>
          ) : null}
        </header>

        {!board ? null : (
        <>
        {owner ? (
          <div data-testid="daily-theme-controls" style={{ display: 'grid', gap: 8, marginBottom: 28 }}>
            <SwatchRow label="paper" value={theme.background} colors={DAILY_BG_SWATCHES} onPick={(hex) => void patchTheme({ background: hex })} />
            <SwatchRow label="ink" value={theme.text} colors={DAILY_TEXT_SWATCHES} onPick={(hex) => void patchTheme({ text: hex })} />
            <SwatchRow label="accent" value={theme.accent} colors={DAILY_ACCENT_SWATCHES} onPick={(hex) => void patchTheme({ accent: hex })} />
            <SwatchRow label="bubble" value={theme.bubble} colors={DAILY_BUBBLE_SWATCHES} onPick={(hex) => void patchTheme({ bubble: hex })} />
          </div>
        ) : null}

        {showWriter ? (
          <section data-testid="daily-owner-editor" style={{ marginBottom: 40 }}>
            <input
              aria-label="title"
              placeholder="title, if you want"
              value={title}
              maxLength={DAILY_NOTE_TITLE_MAX}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (owner) void saveNote();
              }}
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'inherit',
                fontFamily: sans,
                fontSize: 13,
                opacity: 0.5,
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
            <p style={{ margin: '8px 0 0', fontSize: 11, opacity: 0.4, fontFamily: sans, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
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
              <button
                type="button"
                data-testid="daily-snap-attach"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => snapInputRef.current?.click()}
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
                {todayNote?.snap === 'ready' ? 'replace snap' : 'one snap'}
              </button>
            </p>
            <input
              ref={snapInputRef}
              data-testid="daily-snap-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                void attachSnap(file);
              }}
            />
            {todayNote?.snap === 'ready' ? <OwnerSnapPreview noteId={todayNote.id} /> : null}
            {todayNote?.snap === 'burned' ? (
              <p data-testid="daily-snap-burned" style={{ margin: '12px 0 0', fontSize: 12, opacity: 0.4 }}>
                burned. attach another?
              </p>
            ) : null}
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
                  <NoteBody text={latest.body} caret={showDecorativeCaret} />
                </div>
                <VisitorSnap note={latest} />
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
                {showDecorativeCaret ? <Caret /> : null}
              </p>
            )}
          </section>
        )}

        {showBubbles && commentNote ? (
          <div data-testid="daily-comments" style={{ display: 'grid', gap: 10, marginBottom: 36 }}>
            {commentsFor(commentNote.id).map((c) => (
              <div
                key={c.id}
                data-testid="daily-bubble"
                style={{
                  justifySelf: 'start',
                  maxWidth: '88%',
                  background: theme.bubble,
                  borderRadius: '18px 18px 18px 6px',
                  padding: '8px 12px 9px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 11, opacity: 0.5, fontFamily: sans }}>{c.nickname || 'anon'}</span>
                  {owner ? (
                    <button
                      type="button"
                      aria-label="hide bubble"
                      onClick={() => void hideComment(c.id)}
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
                  }}
                >
                  “{c.body}”
                </p>
              </div>
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
            {owner && note.snap === 'ready' ? <OwnerSnapPreview noteId={note.id} /> : null}
            {owner && note.snap === 'burned' ? (
              <p data-testid="daily-snap-burned" style={{ margin: '8px 0 0', fontSize: 12, opacity: 0.5 }}>
                burned.
              </p>
            ) : null}
            {!owner ? <VisitorSnap note={note} /> : null}
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {commentsFor(note.id).map((c) => (
                <div
                  key={c.id}
                  style={{
                    justifySelf: 'start',
                    maxWidth: '88%',
                    background: theme.bubble,
                    borderRadius: '16px 16px 16px 6px',
                    padding: '6px 10px 7px',
                    fontSize: 13,
                  }}
                >
                  <span style={{ fontSize: 10, opacity: 0.55 }}>{c.nickname || 'anon'}</span>
                  <p style={{ margin: '1px 0 0', fontFamily: sans }}>“{c.body}”</p>
                </div>
              ))}
            </div>
          </section>
        ))}
        </>
        )}
      </div>

      {toast ? (
        <SystemToast testId="daily-toast" role={toastFail ? 'alert' : 'status'}>
          {toast}
        </SystemToast>
      ) : null}
    </div>
  );
}
