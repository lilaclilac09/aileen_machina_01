'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import QRCode from 'qrcode';
import { DONATE_SOL_ADDRESS, solanaPayURI, type Asset } from '../lib/donate';

const SUGGESTED: Record<Asset, number[]> = {
  SOL: [0.1, 0.5, 1, 5],
  USDC: [5, 10, 25, 100],
};

export default function Donate() {
  const [asset, setAsset] = useState<Asset>('USDC');
  const [amount, setAmount] = useState<number | undefined>(undefined);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  const uri = useMemo(() => solanaPayURI({ asset, amount }), [asset, amount]);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(uri, {
      margin: 1,
      width: 320,
      color: { dark: '#0a0a0a', light: '#ffffff' },
    })
      .then((d) => alive && setQr(d))
      .catch(() => alive && setQr(''));
    return () => {
      alive = false;
    };
  }, [uri]);

  async function copyAddr() {
    try {
      await navigator.clipboard.writeText(DONATE_SOL_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the address is shown anyway */
    }
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <p style={eyebrow}>AILEENA · SUPPORT</p>
        <h1 style={title}>Buy the agent a coffee</h1>
        <p style={lede}>
          Reading is free. If the writing or the agent gave you something, you&rsquo;re welcome to send
          a little back &mdash; it pays for the credits that keep them running. Any amount, no account.
        </p>

        {/* asset toggle */}
        <div style={toggle}>
          {(['USDC', 'SOL'] as Asset[]).map((a) => (
            <button
              key={a}
              onClick={() => {
                setAsset(a);
                setAmount(undefined);
              }}
              style={{ ...toggleBtn, ...(asset === a ? toggleOn : null) }}
            >
              {a}
            </button>
          ))}
        </div>

        {/* suggested amounts */}
        <div style={chips}>
          {SUGGESTED[asset].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(amount === v ? undefined : v)}
              style={{ ...chip, ...(amount === v ? chipOn : null) }}
            >
              {v} {asset}
            </button>
          ))}
          <button
            onClick={() => setAmount(undefined)}
            style={{ ...chip, ...(amount === undefined ? chipOn : null) }}
          >
            any
          </button>
        </div>

        {/* QR */}
        <div style={qrBox}>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Solana Pay QR" width={208} height={208} style={{ borderRadius: 12 }} />
          ) : (
            <div style={{ width: 208, height: 208 }} />
          )}
        </div>
        <p style={hint}>
          Scan with any Solana wallet{amount ? ` to send ${amount} ${asset}` : ''} &mdash; or, on your
          phone, tap below.
        </p>

        <a href={uri} style={walletBtn}>
          Open in wallet →
        </a>

        {/* raw address */}
        <button onClick={copyAddr} style={addrBtn} title="Copy address">
          <span style={addrText}>{DONATE_SOL_ADDRESS}</span>
          <span style={copyTag}>{copied ? 'copied ✓' : 'copy'}</span>
        </button>

        <p style={foot}>
          On-chain donations are public. This is a dedicated receiving address, not a personal wallet.
        </p>
      </div>
    </main>
  );
}

/* ── styles ── */
const wrap: CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#070707',
  padding: '40px 20px',
  fontFamily: "'Nunito', system-ui, -apple-system, sans-serif",
};
const card: CSSProperties = {
  width: '100%',
  maxWidth: 440,
  background: '#0d0d0d',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 20,
  padding: '34px 30px 26px',
  textAlign: 'center',
};
const eyebrow: CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.32em',
  color: 'rgba(255,255,255,0.4)',
  marginBottom: 14,
};
const title: CSSProperties = { fontSize: 26, fontWeight: 600, color: '#fff', margin: '0 0 10px' };
const lede: CSSProperties = {
  fontSize: 14.5,
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.6)',
  margin: '0 0 22px',
};
const toggle: CSSProperties = {
  display: 'inline-flex',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: 999,
  padding: 4,
  marginBottom: 18,
  gap: 4,
};
const toggleBtn: CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'rgba(255,255,255,0.55)',
  padding: '7px 22px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
const toggleOn: CSSProperties = { background: '#00ffea', color: '#04201d' };
const chips: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'center',
  marginBottom: 22,
};
const chip: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'transparent',
  color: 'rgba(255,255,255,0.7)',
  padding: '8px 14px',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
const chipOn: CSSProperties = {
  borderColor: '#00ffea',
  color: '#00ffea',
  background: 'rgba(0,255,234,0.08)',
};
const qrBox: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  background: '#fff',
  width: 224,
  height: 224,
  margin: '0 auto 14px',
  borderRadius: 16,
  alignItems: 'center',
};
const hint: CSSProperties = {
  fontSize: 12.5,
  color: 'rgba(255,255,255,0.45)',
  margin: '0 0 16px',
  lineHeight: 1.5,
};
const walletBtn: CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  background: '#00ffea',
  color: '#04201d',
  fontWeight: 700,
  fontSize: 14.5,
  padding: '13px',
  borderRadius: 12,
  marginBottom: 16,
};
const addrBtn: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 10,
  padding: '10px 12px',
  cursor: 'pointer',
};
const addrText: CSSProperties = {
  flex: 1,
  fontSize: 11.5,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  color: 'rgba(255,255,255,0.6)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  textAlign: 'left',
};
const copyTag: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#00ffea',
  letterSpacing: '0.04em',
};
const foot: CSSProperties = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.3)',
  margin: '16px 0 0',
  lineHeight: 1.5,
};
