'use client';

import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { SaveBadge, useAppState } from './useAppState';

function newId(): string {
  return `n-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function titleOf(body: string): string {
  return body.split('\n').find((line) => line.trim())?.trim().slice(0, 120) || 'Untitled';
}

export default function NotesApp() {
  const { state, update, status } = useAppState('notes');
  const [openId, setOpenId] = useState<string | null>(null);
  const notes = useMemo(
    () => [...state.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [state.notes],
  );
  const current = notes.find((n) => n.id === openId) ?? notes[0] ?? null;

  const create = () => {
    const note = { id: newId(), title: 'Untitled', body: '', updatedAt: new Date().toISOString() };
    update((prev) => ({ notes: [note, ...prev.notes].slice(0, 50) }));
    setOpenId(note.id);
  };

  const edit = (body: string) => {
    if (!current) return;
    update((prev) => ({
      notes: prev.notes.map((n) =>
        n.id === current.id ? { ...n, body, title: titleOf(body), updatedAt: new Date().toISOString() } : n,
      ),
    }));
  };

  const remove = (id: string) => {
    update((prev) => ({ notes: prev.notes.filter((n) => n.id !== id) }));
    if (openId === id) setOpenId(null);
  };

  return (
    <div data-testid="computer-app-notes" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={create}
          data-testid="notes-new"
          disabled={status === 'loading' || state.notes.length >= 50}
          className="inline-flex min-h-9 items-center gap-1 rounded-[7px] border border-[#d8cfc0] border-b-2 border-b-[#c2b7a3] bg-white px-2.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-[#007d75] disabled:opacity-40"
        >
          <Plus size={14} aria-hidden /> new note
        </button>
        <SaveBadge status={status} />
      </div>
      {notes.length ? (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" data-testid="notes-list">
          {notes.map((note) => (
            <span
              key={note.id}
              className={`inline-flex min-h-8 max-w-[11rem] shrink-0 items-center rounded-[6px] border text-[0.62rem] ${
                current?.id === note.id ? 'border-[#00a89d] bg-[#e7f6f3] text-[#00665f]' : 'border-[#d8cfc0] bg-white text-[#1b1713]/70'
              }`}
            >
              <button type="button" onClick={() => setOpenId(note.id)} className="truncate px-2 py-1 text-left">
                {note.title}
              </button>
              <button
                type="button"
                aria-label={`Delete ${note.title}`}
                onClick={() => remove(note.id)}
                className="px-1.5 py-1 text-[#1b1713]/35 hover:text-[#b4532a]"
              >
                <X size={12} aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {current ? (
        <textarea
          data-testid="notes-editor"
          aria-label="Note"
          value={current.body}
          onChange={(e) => edit(e.target.value.slice(0, 4000))}
          placeholder="Write anything. It saves to your computer."
          className="min-h-36 w-full resize-y rounded-[8px] border border-[#d8cfc0] bg-white px-3 py-2 text-[0.82rem] leading-relaxed text-[#1b1713]"
        />
      ) : (
        <p className="rounded-[8px] border border-dashed border-[#d8cfc0] px-3 py-6 text-center text-[0.72rem] text-[#1b1713]/50">
          {status === 'loading' ? 'Opening notes…' : 'No notes yet. Tap new note.'}
        </p>
      )}
    </div>
  );
}
