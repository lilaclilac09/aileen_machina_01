'use client';

/**
 * Teal pill switch — same control as Dispatch Image / Text.
 * Use only when one collection has two reading modes.
 */
export type PillOption<T extends string> = { id: T; label: string };

export default function PillToggle<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (next: T) => void;
  options: PillOption<T>[];
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 2,
        borderRadius: 999,
        border: '1px solid rgba(17,17,17,0.12)',
        background: '#fff',
      }}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            style={{
              appearance: 'none',
              border: 0,
              padding: '5px 12px',
              borderRadius: 999,
              fontFamily:
                "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 500,
              cursor: 'pointer',
              color: active ? '#fff' : 'rgba(17,17,17,0.58)',
              background: active ? '#008f84' : 'transparent',
              transition: 'background 0.18s ease, color 0.18s ease',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
