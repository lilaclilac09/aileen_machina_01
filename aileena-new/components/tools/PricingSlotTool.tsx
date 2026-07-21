'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../LanguageProvider';
import { t } from '../../lib/translations';
import { getToolBySlug } from '../../lib/tools/registry';
import ArcadeLayout, { ArcadeCabinetFrame, mono } from './ArcadeLayout';

type Chip = { sku: string; vendor: string; family?: string };
type PricePoint = {
  sku: string;
  date: string;
  priceUSD: number;
  unit?: string;
  region?: string;
  source?: string;
};

type Phase = 'idle' | 'spinning' | 'revealed' | 'error';

function formatUsd(n: number): string {
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export default function PricingSlotTool() {
  const { language } = useLanguage();
  const tx = t[language].tools.pricingSlot;
  const tool = getToolBySlug('pricing-slot');

  const [chips, setChips] = useState<Chip[]>([]);
  const [reel, setReel] = useState<[string, string, string]>(['—', '—', '—']);
  const [result, setResult] = useState<{ chip: Chip; price: PricePoint } | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spins, setSpins] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/chips?limit=100');
        const json = (await res.json()) as {
          ok: boolean;
          data?: { items: Chip[] };
          error?: { message: string };
        };
        if (!json.ok || !json.data?.items?.length) {
          if (!cancelled) {
            setError(json.error?.message ?? tx.errors.load);
            setPhase('error');
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setChips(json.data.items);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(tx.errors.network);
          setPhase('error');
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tx.errors.load, tx.errors.network]);

  const spin = useCallback(async () => {
    if (chips.length === 0 || phase === 'spinning') return;
    setPhase('spinning');
    setResult(null);
    setError(null);

    const pick = chips[Math.floor(Math.random() * chips.length)];
    const tokens = pick.sku.split(/\s+/).filter(Boolean);
    const a = tokens[0] ?? pick.vendor.toUpperCase();
    const b = tokens[1] ?? pick.family ?? 'SKU';
    const c = tokens.slice(2).join(' ') || pick.sku;

    // Fake reel animation frames
    const labels = chips.flatMap((ch) => ch.sku.split(/\s+/)).filter((x) => x.length > 1);
    for (let i = 0; i < 8; i += 1) {
      setReel([
        labels[Math.floor(Math.random() * labels.length)] ?? '…',
        labels[Math.floor(Math.random() * labels.length)] ?? '…',
        labels[Math.floor(Math.random() * labels.length)] ?? '…',
      ]);
      await new Promise((r) => setTimeout(r, 70 + i * 20));
    }
    setReel([a, b, c]);

    try {
      const q = encodeURIComponent(pick.sku);
      const res = await fetch(`/api/v1/pricing/${q}/latest?unit=per_chip`);
      const json = (await res.json()) as {
        ok: boolean;
        data?: { point?: PricePoint };
        error?: { message: string };
      };
      const point = json.data?.point;

      if (!json.ok || !point) {
        setError(json.error?.message ?? tx.errors.noPrice);
        setPhase('revealed');
        setSpins((n) => n + 1);
        setResult({
          chip: pick,
          price: {
            sku: pick.sku,
            date: '—',
            priceUSD: 0,
            unit: 'per_chip',
            source: 'unavailable',
          },
        });
        return;
      }

      setResult({ chip: pick, price: point });
      setSpins((n) => n + 1);
      setPhase('revealed');
    } catch {
      setError(tx.errors.network);
      setPhase('error');
    }
  }, [chips, phase, tx.errors.network, tx.errors.noPrice]);

  return (
    <ArcadeLayout
      tag={tx.tag}
      title={tx.heading}
      subtitle={tx.body}
      backLabel={tx.backToTools}
      marquee={tx.marquee}
    >
      <p style={{ margin: '0 0 16px', fontFamily: mono, fontSize: '0.72rem', color: 'rgba(20,17,12,0.45)' }}>
        {tx.spins}: <span style={{ color: '#c9872f' }}>{spins}</span>
      </p>

      <ArcadeCabinetFrame
        glyph={tool?.arcade.glyph ?? '◈'}
        screenGradient={
          tool?.arcade.screenGradient ?? 'linear-gradient(160deg,#f7f0e4,#fffdf7)'
        }
      >
        {loading ? (
          <p style={{ fontFamily: mono, fontSize: '0.8rem', color: 'rgba(20,17,12,0.5)' }}>
            {tx.loading}
          </p>
        ) : null}

        {error && phase === 'error' ? (
          <p role="alert" style={{ margin: 0, fontFamily: mono, fontSize: '0.82rem', color: '#8a2a2a' }}>
            {error}
          </p>
        ) : null}

        {!loading && phase !== 'error' ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.55, color: 'rgba(20,17,12,0.62)' }}>
              {tx.howto}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8,
              }}
            >
              {reel.map((cell, i) => (
                <div
                  key={`${cell}-${i}`}
                  style={{
                    minHeight: 72,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: 10,
                    borderRadius: 0,
                    border: 'none',
                    background: '#efe6d6',
                    fontFamily: mono,
                    fontSize: '0.78rem',
                    color: '#14110c',
                  }}
                >
                  {cell}
                </div>
              ))}
            </div>

            <button
              type="button"
              className="arcade-start-btn"
              onClick={() => void spin()}
              disabled={phase === 'spinning' || chips.length === 0}
            >
              {phase === 'spinning' ? tx.spinning : tx.submit}
            </button>

            {phase === 'revealed' && result ? (
              <div
                className="arcade-score-card"
                style={{
                  padding: 14,
                  borderRadius: 0,
                  border: 'none',
                  background: '#f3f0e8',
                  display: 'grid',
                  gap: 8,
                }}
              >
                <p style={{ margin: 0, fontFamily: mono, fontSize: '0.68rem', color: 'rgba(20,17,12,0.42)' }}>
                  {tx.jackpot}
                </p>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#14110c' }}>{result.chip.sku}</h3>
                {result.price.priceUSD > 0 ? (
                  <>
                    <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600, color: '#00a99f' }}>
                      {formatUsd(result.price.priceUSD)}
                      <span style={{ fontSize: '0.72rem', marginLeft: 8, color: 'rgba(20,17,12,0.45)' }}>
                        {result.price.unit ?? 'per_chip'}
                      </span>
                    </p>
                    <p style={{ margin: 0, fontFamily: mono, fontSize: '0.72rem', color: 'rgba(20,17,12,0.45)' }}>
                      {tx.asOf} {result.price.date}
                      {result.price.source ? ` · ${result.price.source}` : ''}
                    </p>
                  </>
                ) : (
                  <p style={{ margin: 0, fontFamily: mono, fontSize: '0.78rem', color: '#8a2a2a' }}>
                    {tx.errors.noPrice}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </ArcadeCabinetFrame>

      <p
        style={{
          marginTop: 16,
          maxWidth: 720,
          fontFamily: mono,
          fontSize: '0.68rem',
          color: 'rgba(20,17,12,0.38)',
          lineHeight: 1.5,
        }}
      >
        {tx.disclaimer}
      </p>
    </ArcadeLayout>
  );
}
