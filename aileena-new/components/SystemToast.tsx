'use client';

import type { CSSProperties, ReactNode } from 'react';

/** Compact system chip — white bar, small icon, 3–5 words. No paragraphs. */
export default function SystemToast({
  children,
  testId,
  icon = '⚡',
  role = 'status',
  inline = false,
  quiet = false,
}: {
  children: ReactNode;
  testId?: string;
  icon?: string;
  role?: 'status' | 'alert';
  inline?: boolean;
  /** Tiny in-flow bolt — no big white pill. */
  quiet?: boolean;
}) {
  return (
    <p
      data-testid={testId}
      role={role}
      style={{
        ...chip,
        ...(quiet
          ? {
              margin: 0,
              padding: '3px 8px',
              fontSize: 12,
              boxShadow: 'none',
              background: 'transparent',
              color: '#fffdf8',
              border: '1px solid rgba(255,253,248,0.16)',
            }
          : inline
          ? { margin: '8px 0 0' }
          : {
              position: 'fixed',
              left: '50%',
              bottom: 'max(20px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
              transform: 'translateX(-50%)',
              zIndex: 80,
              margin: 0,
              pointerEvents: 'none',
            }),
      }}
    >
      <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>
        {icon}
      </span>
      <span>{children}</span>
    </p>
  );
}

const chip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: 999,
  background: '#fffdf8',
  color: '#1b1713',
  fontFamily: "'Nunito', system-ui, sans-serif",
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.2,
  letterSpacing: 0,
  boxShadow: '0 10px 28px rgba(0,0,0,0.38)',
  border: '1px solid rgba(27,23,19,0.08)',
  whiteSpace: 'nowrap',
};

export function shortMixError(raw: string): string {
  if (/Select track/i.test(raw)) return 'Select track.';
  if (/Not mixable/i.test(raw)) return 'Not mixable.';
  if (/No audio/i.test(raw)) return 'No audio.';
  if (/Play failed/i.test(raw)) return 'Play failed.';
  if (/Need two tracks/i.test(raw)) return 'Need two tracks.';
  if (/CORS|blocked/i.test(raw)) return 'No audio.';
  if (/MediaRecorder|unavailable/i.test(raw)) return 'Record failed.';
  if (/empty file/i.test(raw)) return 'Export failed.';
  if (/decode/i.test(raw)) return 'No audio.';
  return 'Load failed.';
}
