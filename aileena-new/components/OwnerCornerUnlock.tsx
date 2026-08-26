'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import SystemToast from './SystemToast';

/**
 * Quiet owner unlock. Same httpOnly session as /api/auth/owner.
 * Never labels the control; never shows OWNER KEY; never stores the secret.
 */
export default function OwnerCornerUnlock({
  denied = false,
}: {
  denied?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastFail, setToastFail] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timer = useRef<number | null>(null);

  const flash = useCallback((msg: string, fail = false) => {
    setToast(msg);
    setToastFail(fail);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => {
    if (!denied) return;
    flash('⚡ Nope.', true);
  }, [denied, flash]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const submit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (busy || !key) return;
    setBusy(true);
    try {
      const res = await fetch('/api/auth/owner', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      setKey('');
      if (!res.ok) {
        flash('⚡ Nope.', true);
        return;
      }
      flash('⚡ Unlocked.');
      window.setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch {
      flash('⚡ Nope.', true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: 14,
          bottom: 16,
          zIndex: 40,
        }}
      >
        {open ? (
          <form
            data-testid="daily-owner-popover"
            onSubmit={(e) => void submit(e)}
            style={{
              display: 'grid',
              gap: 8,
              minWidth: 168,
              padding: '12px 12px 10px',
              background: 'color-mix(in srgb, var(--daily-bg, #f4efe6) 88%, white)',
              border: '1px solid color-mix(in srgb, currentColor 12%, transparent)',
              borderRadius: 12,
              boxShadow: '0 10px 28px rgba(27,23,19,0.08)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: "'Nunito', system-ui, sans-serif",
                fontSize: 12,
                opacity: 0.55,
              }}
            >
              owner?
            </p>
            <input
              ref={inputRef}
              type="password"
              name="owner-pass"
              autoComplete="off"
              spellCheck={false}
              aria-label="owner"
              data-testid="daily-owner-popover-input"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid color-mix(in srgb, currentColor 18%, transparent)',
                outline: 'none',
                color: 'inherit',
                fontSize: 16,
                padding: '4px 0',
              }}
            />
            <button
              type="submit"
              data-testid="daily-owner-popover-enter"
              disabled={busy || !key}
              style={{
                justifySelf: 'start',
                background: 'none',
                border: 'none',
                padding: 0,
                color: 'var(--daily-accent, #00a89d)',
                fontFamily: "'Nunito', system-ui, sans-serif",
                fontSize: 12,
                cursor: key ? 'pointer' : 'default',
                opacity: key ? 1 : 0.4,
                minHeight: 32,
              }}
            >
              enter
            </button>
          </form>
        ) : (
          <button
            type="button"
            data-testid="daily-owner-dot"
            aria-label="owner"
            onClick={() => setOpen(true)}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              background: 'currentColor',
              opacity: 0.22,
              cursor: 'pointer',
            }}
          />
        )}
      </div>
      {toast ? (
        <SystemToast testId="daily-unlock-toast" role={toastFail ? 'alert' : 'status'}>
          {toast}
        </SystemToast>
      ) : null}
    </>
  );
}
