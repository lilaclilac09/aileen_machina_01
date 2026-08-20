'use client';

import type { CSSProperties, ReactNode } from 'react';

/** Compact system chip — white bar, small icon, 3–5 words. No paragraphs. */
export default function SystemToast({
  children,
  testId,
  icon = '⚡',
  role = 'status',
  inline = false,
}: {
  children: ReactNode;
  testId?: string;
  icon?: string;
  role?: 'status' | 'alert';
  /** Sit in-flow (search/disabled). Default is a fixed bottom toast. */
  inline?: boolean;
}) {
  return (
    <p
      data-testid={testId}
      role={role}
      style={{
        ...chip,
        ...(inline
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
  if (/Load audio first/i.test(raw)) return 'Load audio first.';
  if (/Reference only/i.test(raw)) return 'Reference only.';
  if (/Not mixable/i.test(raw)) return 'Not mixable.';
  if (/Format not supported/i.test(raw)) return 'Format not supported.';
  if (/Load failed/i.test(raw)) return 'Load failed.';
  if (/CORS|blocked/i.test(raw)) return 'Load failed.';
  if (/MediaRecorder|unavailable/i.test(raw)) return 'Record failed.';
  if (/empty file/i.test(raw)) return 'Export failed.';
  if (/decode/i.test(raw)) return 'Format not supported.';
  return 'Something broke.';
}
