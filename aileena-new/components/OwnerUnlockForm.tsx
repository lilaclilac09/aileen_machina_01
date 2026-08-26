'use client';

import { useState } from 'react';

function b64urlFromBuf(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCodePoint(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function bufFromB64url(input: string): ArrayBuffer {
  let s = input.replace(/-/g, '+').replace(/\//g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

/**
 * Owner door via platform passkey (Touch ID / Windows Hello / local fingerprint).
 * No password field. Does not name a server secret.
 */
export default function OwnerUnlockForm({
  next,
  enterLabel = 'unlock',
  denied = false,
}: {
  next: '/council' | '/cabinet' | '/inbox' | '/daily' | '/proof' | '/';
  enterLabel?: string;
  denied?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(denied ? 'That passkey did not open the door.' : null);

  async function run(mode: 'unlock' | 'register') {
    setBusy(true);
    setError(null);
    try {
      if (!window.PublicKeyCredential) {
        setError('This browser has no passkey / WebAuthn.');
        return;
      }
      const optRes = await fetch('/api/auth/passkey/options', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const opt = (await optRes.json()) as {
        error?: string;
        challenge?: string;
        rpId?: string;
        rpName?: string;
        allowCredentials?: { type: 'public-key'; id: string }[];
      };
      if (!optRes.ok) {
        setError(opt.error === 'bootstrap_off' ? 'Passkey enroll is off on production.' : 'Could not start passkey.');
        return;
      }

      if (mode === 'register') {
        const cred = (await navigator.credentials.create({
          publicKey: {
            challenge: bufFromB64url(opt.challenge || ''),
            rp: { name: opt.rpName || 'aileena.xyz', id: opt.rpId },
            user: {
              id: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
              name: 'owner',
              displayName: 'owner',
            },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
              residentKey: 'preferred',
            },
            timeout: 60_000,
          },
        })) as PublicKeyCredential | null;
        if (!cred) {
          setError('No passkey created.');
          return;
        }
        const att = cred.response as AuthenticatorAttestationResponse;
        const publicKey = att.getPublicKey?.();
        if (!publicKey) {
          setError('Browser did not export a public key.');
          return;
        }
        const verify = await fetch('/api/auth/passkey/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'register',
            id: b64urlFromBuf(cred.rawId),
            clientDataJSON: b64urlFromBuf(att.clientDataJSON),
            authenticatorData: b64urlFromBuf(att.getAuthenticatorData()),
            publicKey: b64urlFromBuf(publicKey),
          }),
        });
        if (!verify.ok) {
          setError('Register failed.');
          return;
        }
      } else {
        const cred = (await navigator.credentials.get({
          publicKey: {
            challenge: bufFromB64url(opt.challenge || ''),
            rpId: opt.rpId,
            userVerification: 'required',
            timeout: 60_000,
            allowCredentials: (opt.allowCredentials || []).map((c) => ({
              type: 'public-key' as const,
              id: bufFromB64url(c.id),
            })),
          },
        })) as PublicKeyCredential | null;
        if (!cred) {
          setError('No passkey.');
          return;
        }
        const ass = cred.response as AuthenticatorAssertionResponse;
        const verify = await fetch('/api/auth/passkey/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'unlock',
            id: b64urlFromBuf(cred.rawId),
            clientDataJSON: b64urlFromBuf(ass.clientDataJSON),
            authenticatorData: b64urlFromBuf(ass.authenticatorData),
            signature: b64urlFromBuf(ass.signature),
          }),
        });
        if (!verify.ok) {
          setError('Passkey did not verify.');
          return;
        }
      }
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey cancelled.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 max-w-md" data-testid="owner-passkey-unlock">
      <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
        passkey · this device
      </p>
      <button
        type="button"
        data-testid="owner-passkey-unlock-btn"
        disabled={busy}
        onClick={() => void run('unlock')}
        className="inline-flex min-h-11 items-center font-mono text-[0.62rem] tracking-[0.3em] uppercase text-[#007d75] border border-[#00a89d]/45 bg-white px-4 py-2 hover:bg-[#e9fffc] disabled:opacity-40"
      >
        {busy ? 'waiting…' : enterLabel}
      </button>
      <button
        type="button"
        data-testid="owner-passkey-register-btn"
        disabled={busy}
        onClick={() => void run('register')}
        className="block font-mono text-[0.55rem] tracking-[0.18em] uppercase text-[#1b1713]/45 hover:text-[#008f86]"
      >
        register this device
      </button>
      {error ? (
        <p className="text-[0.8rem] leading-relaxed text-[#1b1713]/55">{error}</p>
      ) : (
        <p className="text-[0.75rem] leading-relaxed text-[#1b1713]/45">
          Local fingerprint / Face ID / Windows Hello. No typed secret on this page.
          Visitors cannot use this room.
        </p>
      )}
    </div>
  );
}
