'use client';

/**
 * Packed Cloudflare desk — files/shell only.
 * Browser stays aside (Browser Use window). Open → current ComputerConsoleDock.
 */
export default function CloudflareDeskChart({
  packed,
  onToggle,
}: {
  packed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="cloudflare-desk-chart"
      data-packed={packed ? '1' : '0'}
      data-mark="worker-shell"
      data-browser="aside"
      aria-pressed={!packed}
      aria-label={packed ? 'Open Cloudflare files/shell desk' : 'Pack Cloudflare desk'}
      title="Cloudflare worker-shell · files/shell · browser aside"
      onClick={onToggle}
      className={`flex w-full items-center gap-2.5 rounded-none border-x-0 border-t border-b px-3 py-1.5 text-left transition-colors sm:px-5 ${
        packed
          ? 'border-[#e7e0d6] bg-[#fffdf8] text-[#007d75]/75'
          : 'border-[#00a89d]/35 bg-[#e8f7f4]/80 text-[#007d75]'
      }`}
    >
      <svg viewBox="0 0 84 28" className="h-7 w-[5.25rem] shrink-0" aria-hidden>
        <rect x="1" y="2" width="38" height="24" rx="3.2" fill="#f6f0e4" stroke="#c2b7a3" strokeWidth="1.1" />
        <rect x="5" y="5.2" width="30" height="11" rx="1.6" fill={packed ? '#1b1713' : '#0b2422'} />
        <rect x="7" y="7" width="18" height="2.2" rx="0.6" fill="#7ee8dc" opacity={packed ? 0.4 : 0.95} />
        <rect x="7" y="10.4" width="12" height="1.6" rx="0.5" fill="#00a89d" opacity="0.55" />
        <rect x="6.2" y="18.4" width="7" height="4.2" rx="0.8" fill="#fff" stroke="#c2b7a3" strokeWidth="0.8" />
        <rect x="15.2" y="18.4" width="7" height="4.2" rx="0.8" fill="#fff" stroke="#c2b7a3" strokeWidth="0.8" />
        <rect x="24.2" y="18.4" width="7" height="4.2" rx="0.8" fill="#fff" stroke="#c2b7a3" strokeWidth="0.8" />
        <path d="M42 14h8" stroke="#00a89d" strokeWidth="1.1" strokeLinecap="round" />
        <path
          d="M48.2 10.8 52 14l-3.8 3.2"
          stroke="#00a89d"
          strokeWidth="1.1"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="55" y="5" width="28" height="18" rx="2.2" fill="#fffdf8" stroke="#c2b7a3" strokeWidth="1" />
        <path d="M55 9.2h28" stroke="#c2b7a3" strokeWidth="0.9" />
        <circle cx="58.4" cy="7.1" r="0.7" fill="#c2b7a3" />
        <circle cx="61" cy="7.1" r="0.7" fill="#c2b7a3" />
        <path d="M61 12.2 77 20.2M77 12.2 61 20.2" stroke="#8a6a68" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <span className="min-w-0 font-mono text-[0.48rem] leading-4 tracking-[0.1em] uppercase">
        files · shell
        <span className="ml-2 text-[#1b1713]/38">browse aside</span>
      </span>
    </button>
  );
}
