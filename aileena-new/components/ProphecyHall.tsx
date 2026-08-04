'use client';

/**
 * Prophecy Hall — shelf of glass orbs.
 * Touching an allowed orb opens Console and streams text into the dialog
 * (never rendered inside the sphere). C orbs soft-lock without matching memory.
 */

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { readTopicMemory } from '../lib/articleTopicMemory';
import {
  ALL_PROPHECIES,
  visitorOwnsRecord,
  type ProphecyRecord,
} from '../lib/prophecyRecords';
import { personalizeProphecy } from '../lib/softOracle';

const DISSIPATED_KEY = 'aileena_prophecy_dissipated';

function readDissipated(): Set<string> {
  try {
    const raw = localStorage.getItem(DISSIPATED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeDissipated(ids: Set<string>) {
  try {
    localStorage.setItem(DISSIPATED_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export default function ProphecyHall() {
  const [topics, setTopics] = useState<string[]>([]);
  const [warmId, setWarmId] = useState<string | null>(null);
  const [lockHint, setLockHint] = useState<string | null>(null);
  const [dissipated, setDissipated] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setTopics(readTopicMemory().topics);
    setDissipated(readDissipated());
  }, []);

  const records = useMemo(() => ALL_PROPHECIES, []);

  const openProphecy = useCallback((record: ProphecyRecord) => {
    const owns = visitorOwnsRecord(record, readTopicMemory().topics);
    if (!owns) {
      setLockHint(
        'This record isn’t yours yet — keep talking in Console so the hall can remember your threads.',
      );
      return;
    }
    setLockHint(null);
    setWarmId(record.id);
    const topicsNow = readTopicMemory().topics;
    // Soft oracle text lands in Console dialog — never inside the orb.
    window.dispatchEvent(
      new CustomEvent('open-agent-chat', {
        detail: {
          voice: true,
          inject: [
            {
              role: 'user',
              text: `Warm the glass record “${record.title}.”`,
            },
            {
              role: 'assistant',
              text: personalizeProphecy(record.title, record.text, topicsNow, record.kind),
            },
          ],
        },
      }),
    );
  }, []);

  const shatter = useCallback(
    (record: ProphecyRecord, e: MouseEvent) => {
      e.stopPropagation();
      const owns = visitorOwnsRecord(record, readTopicMemory().topics);
      if (!owns) {
        setLockHint('Only your records can dissipate.');
        return;
      }
      openProphecy(record);
      setDissipated((prev) => {
        const next = new Set(prev);
        next.add(record.id);
        writeDissipated(next);
        return next;
      });
    },
    [openProphecy],
  );

  return (
    <section aria-label="Prophecy Hall" className="prophecy-hall">
      <style>{`
        .prophecy-hall {
          --ink: rgba(255,253,248,0.88);
          --muted: rgba(255,253,248,0.55);
          --teal: #00a89d;
        }
        .prophecy-shelf {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 28px 20px;
          margin-top: 40px;
        }
        .prophecy-orb-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
          font: inherit;
          color: inherit;
        }
        .prophecy-orb {
          width: 112px;
          height: 112px;
          border-radius: 50%;
          position: relative;
          transition: transform 0.45s ease, filter 0.45s ease, opacity 0.5s ease;
          box-shadow:
            inset 0 -18px 36px rgba(0,0,0,0.35),
            inset 0 12px 24px rgba(255,255,255,0.35),
            0 18px 40px rgba(0,0,0,0.35);
        }
        .prophecy-orb::after {
          content: '';
          position: absolute;
          inset: 12% 18% auto;
          height: 28%;
          border-radius: 50%;
          background: linear-gradient(180deg, rgba(255,255,255,0.55), transparent);
          pointer-events: none;
        }
        .prophecy-orb-wrap:hover .prophecy-orb:not(.is-locked):not(.is-gone),
        .prophecy-orb-wrap.is-warm .prophecy-orb {
          transform: scale(1.06);
          filter: saturate(1.15) brightness(1.08);
        }
        .prophecy-orb.is-warm {
          animation: prophecy-mist 2.4s ease-in-out infinite;
        }
        .prophecy-orb.is-locked {
          filter: grayscale(0.55) brightness(0.75);
          opacity: 0.72;
          cursor: not-allowed;
        }
        .prophecy-orb.is-gone {
          opacity: 0.2;
          transform: scale(0.85);
          filter: blur(1px);
        }
        @keyframes prophecy-mist {
          0%, 100% { box-shadow: inset 0 -18px 36px rgba(0,0,0,0.35), inset 0 12px 24px rgba(255,255,255,0.35), 0 18px 40px rgba(0,0,0,0.35); }
          50% { box-shadow: inset 0 -14px 40px rgba(0,168,157,0.25), inset 0 14px 28px rgba(255,255,255,0.45), 0 22px 48px rgba(0,168,157,0.28); }
        }
        .prophecy-label {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.58rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--muted);
          text-align: center;
        }
        .prophecy-kind {
          font-size: 0.5rem;
          letter-spacing: 0.28em;
          color: rgba(0,168,157,0.75);
        }
        .prophecy-shatter {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.5rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,253,248,0.4);
          background: transparent;
          border: 1px solid rgba(255,253,248,0.12);
          padding: 4px 8px;
          cursor: pointer;
        }
        .prophecy-shatter:hover {
          color: rgba(255,253,248,0.75);
          border-color: rgba(0,168,157,0.4);
        }
        .prophecy-lock {
          margin-top: 28px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.72rem;
          line-height: 1.55;
          color: rgba(255,180,140,0.9);
          max-width: 36rem;
        }
      `}</style>

      <p className="prophecy-kind" style={{ marginBottom: 8 }}>
        ▸ hall · glass records
      </p>
      <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 560 }}>
        Touch a record to warm it. Prophecy speaks in the Console dialog — never inside the orb.
        Personal records open only when the hall recognizes your prior threads.
      </p>

      <div className="prophecy-shelf">
        {records.map((record) => {
          const owns = visitorOwnsRecord(record, topics);
          const gone = dissipated.has(record.id);
          const warm = warmId === record.id && !gone;
          return (
            <div key={record.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className={`prophecy-orb-wrap${warm ? ' is-warm' : ''}`}
                onClick={() => openProphecy(record)}
                aria-label={`${record.title}${owns ? '' : ' (locked)'}`}
              >
                <span
                  className={`prophecy-orb${owns ? '' : ' is-locked'}${warm ? ' is-warm' : ''}${gone ? ' is-gone' : ''}`}
                  style={{ background: record.hue }}
                />
                <span className="prophecy-label">{record.title}</span>
                <span className="prophecy-kind">
                  {record.kind === 'C' ? (owns ? 'yours' : 'sealed') : 'open'}
                </span>
              </button>
              {owns && !gone && (
                <button type="button" className="prophecy-shatter" onClick={(e) => shatter(record, e)}>
                  dissipate
                </button>
              )}
            </div>
          );
        })}
      </div>

      {lockHint && <p className="prophecy-lock">▸ {lockHint}</p>}
    </section>
  );
}
