'use client';

import { useState, useSyncExternalStore } from 'react';
import DJStation from './DJStation';

const MOBILE_QUERY = '(max-width: 639px)';

function subscribe(cb: () => void) {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

const PREVIEW = {
  label: 'AILEENA DJ',
  location: 'BERLIN',
  track: 'Berlin',
  bpm: 125,
  duration: '3:20',
};

export default function MobileCollapsibleDJ() {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);

  if (!isMobile) {
    return <DJStation />;
  }

  if (expanded) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[0.55rem] tracking-[0.4em] text-white/35 uppercase">
            Deck open
          </span>
          <button
            onClick={() => setExpanded(false)}
            className="font-mono text-[0.6rem] tracking-[0.3em] text-[#00ffea]/70 uppercase border border-[#00ffea]/30 rounded px-3 py-2 active:bg-[#00ffea]/10"
          >
            Close ×
          </button>
        </div>
        <DJStation />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setExpanded(true)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(true); } }}
      className="rounded-lg border border-white/10 bg-[#0b0d10] p-5 active:border-[#00ffea]/40 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        <span className="font-mono text-[0.55rem] tracking-[0.4em] text-white/35 uppercase">
          {PREVIEW.label}
        </span>
        <span className="font-mono text-[0.55rem] tracking-[0.4em] text-[#00ffea]/55 uppercase">
          {PREVIEW.location}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#00ffea]/30 bg-[#00ffea]/8 text-[#00ffea]">
          <span className="text-base leading-none">▶</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.55rem] tracking-[0.35em] text-white/35 uppercase">Now cued</p>
          <p className="mt-1 text-lg leading-snug tracking-[0.08em] text-white/90 truncate">
            {PREVIEW.track}
          </p>
          <div className="mt-1 flex items-center gap-3 font-mono text-[0.6rem] tracking-[0.25em] text-white/45 uppercase">
            <span>{PREVIEW.bpm} BPM</span>
            <span className="h-1 w-1 rounded-full bg-white/25" />
            <span>{PREVIEW.duration}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-3">
        <span className="font-mono text-[0.55rem] tracking-[0.35em] text-white/40 uppercase">
          Two-deck mixer
        </span>
        <span className="font-mono text-[0.62rem] tracking-[0.35em] text-[#00ffea] uppercase">
          Open →
        </span>
      </div>
    </div>
  );
}
