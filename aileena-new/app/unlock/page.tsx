'use client';

import { useEffect, useState } from 'react';

type SolanaProvider = {
  isPhantom?: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  signMessage: (msg: Uint8Array, enc?: string) => Promise<{ signature: Uint8Array }>;
};

function getProvider(): SolanaProvider | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { solana?: SolanaProvider; phantom?: { solana?: SolanaProvider } };
  return w.phantom?.solana ?? w.solana ?? null;
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export default function UnlockPage() {
  const [next, setNext] = useState('/blog/nokia-dci');
  const [email, setEmail] = useState('');
  const [emailState, setEmailState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [walletState, setWalletState] = useState<'idle' | 'working'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const n = p.get('next');
    if (n && n.startsWith('/') && !n.startsWith('//')) setNext(n);
    if (p.get('error') === 'expired') setMsg('that link expired — request a new one.');
  }, []);

  async function sendEmail(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    setEmailState('sending');
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error || 'could not send the link.');
        setEmailState('idle');
        return;
      }
      setEmailState('sent');
    } catch {
      setMsg('network error — try again.');
      setEmailState('idle');
    }
  }

  async function walletLogin() {
    setMsg('');
    const provider = getProvider();
    if (!provider) {
      setMsg('no Solana wallet found — install Phantom, or use email.');
      return;
    }
    setWalletState('working');
    try {
      const { publicKey } = await provider.connect();
      const address = publicKey.toString();

      const chRes = await fetch('/api/auth/nonce');
      const { message } = (await chRes.json()) as { message: string };

      const { signature } = await provider.signMessage(new TextEncoder().encode(message), 'utf8');

      const res = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature: toBase64(signature), message }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg(data.error || 'wallet login failed.');
        setWalletState('idle');
        return;
      }
      window.location.href = next;
    } catch {
      setMsg('wallet login cancelled.');
      setWalletState('idle');
    }
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <p style={eyebrow}>AILEENA · ACCESS</p>
        <h1 style={title}>Sign in to keep reading</h1>
        <p style={lede}>
          The writing &mdash; and the agent you can talk to &mdash; run on real credits. A quick, free
          sign-in (your email or a Solana wallet, no password) keeps them going and opens the whole
          archive. One tap, and I&rsquo;ll remember you next time.
        </p>

        {/* Wallet */}
        <button onClick={walletLogin} disabled={walletState === 'working'} style={walletBtn}>
          {walletState === 'working' ? 'check your wallet…' : 'Connect Solana wallet →'}
        </button>

        <div style={divider}>
          <span style={dividerLine} />
          <span style={dividerText}>or</span>
          <span style={dividerLine} />
        </div>

        {/* Email */}
        {emailState === 'sent' ? (
          <p style={sentBox}>
            ✓ check your inbox — we sent a one-time link to <strong style={{ color: '#fff' }}>{email}</strong>.
            it expires in 30 minutes.
          </p>
        ) : (
          <form onSubmit={sendEmail} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              style={input}
            />
            <button type="submit" disabled={emailState === 'sending'} style={emailBtn}>
              {emailState === 'sending' ? 'sending…' : 'Email me a magic link'}
            </button>
          </form>
        )}

        {msg && <p style={errorText}>▸ {msg}</p>}

        <p style={footnote}>made by hand, not by prompt — and read by people who say hi. ♡</p>
      </div>
    </main>
  );
}

/* ── styles ── */
const wrap: React.CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#070707',
  padding: 24,
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
};
const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 440,
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 14,
  padding: '40px 32px',
  background: 'rgba(255,255,255,0.02)',
};
const eyebrow: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.6rem',
  letterSpacing: '0.4em',
  color: '#00ffea',
  textTransform: 'uppercase',
  marginBottom: 18,
  opacity: 0.85,
};
const title: React.CSSProperties = { fontSize: '1.6rem', color: 'rgba(255,255,255,0.95)', fontWeight: 600, marginBottom: 12, lineHeight: 1.2 };
const lede: React.CSSProperties = { fontSize: '0.95rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', marginBottom: 28 };
const walletBtn: React.CSSProperties = {
  width: '100%',
  padding: '13px 16px',
  borderRadius: 10,
  border: '1px solid rgba(0,255,234,0.5)',
  background: 'rgba(0,255,234,0.08)',
  color: '#00ffea',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
};
const divider: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0' };
const dividerLine: React.CSSProperties = { flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' };
const dividerText: React.CSSProperties = { fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' };
const input: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.03)',
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none',
};
const emailBtn: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.04)',
  color: 'rgba(255,255,255,0.9)',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
};
const sentBox: React.CSSProperties = {
  fontSize: '0.9rem',
  lineHeight: 1.6,
  color: 'rgba(0,255,234,0.85)',
  border: '1px solid rgba(0,255,234,0.25)',
  borderRadius: 10,
  padding: '14px 16px',
};
const errorText: React.CSSProperties = { marginTop: 16, fontFamily: 'monospace', fontSize: '0.8rem', color: '#ff6b6b' };
const footnote: React.CSSProperties = { marginTop: 28, fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' };
