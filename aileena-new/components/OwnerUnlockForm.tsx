'use client';

import { useState } from 'react';
import { b64urlFromBuf, bytesFromB64url } from '../lib/passkey/b64';
import {
  deriveKeyshield,
  openOwnerSeal,
  prfFirstBytes,
  readPrfFirst,
  sealOwner,
} from '../lib/keyshield/prf';

/**
 * Owner door via KeyShield: WebAuthn PRF → HKDF → AES-256-GCM.
 * Fingerprint / Face ID / Hello stays on this device. Server holds ciphertext only.
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
  const [error, setError] = useState<string | null>(denied ? 'KeyShield did not open the door.' : null);

  async function run(mode: 'unlock' | 'register') {
    setBusy(true);
    setError(null);
    try {
      if (!window.PublicKeyCredential) {
        setError('This browser has no KeyShield / WebAuthn.');
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
        prfFirst?: string;
        allowCredentials?: { type: 'public-key'; id: string }[];
        seals?: { id: string; iv: string; cipher: string }[];
      };
      if (!optRes.ok) {
        setError(opt.error === 'bootstrap_off' ? 'KeyShield enroll is off on production.' : 'Could not start KeyShield.');
        return;
      }

      const prfEval = { eval: { first: prfFirstBytes() } };
      const challenge = bytesFromB64url(opt.challenge || '');

      if (mode === 'register') {
        const cred = (await navigator.credentials.create({
          publicKey: {
            challenge,
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
            extensions: { prf: prfEval },
          } as PublicKeyCredentialCreationOptions,
        })) as PublicKeyCredential | null;
        if (!cred) {
          setError('No KeyShield passkey created.');
          return;
        }
        let prf = readPrfFirst(cred);
        if (!prf) {
          const got = (await navigator.credentials.get({
            publicKey: {
              challenge,
              rpId: opt.rpId,
              userVerification: 'required',
              timeout: 60_000,
              allowCredentials: [{ type: 'public-key', id: cred.rawId }],
              extensions: { prf: prfEval },
            } as PublicKeyCredentialRequestOptions,
          })) as PublicKeyCredential | null;
          prf = got ? readPrfFirst(got) : null;
        }
        if (!prf) {
          setError('This device has no KeyShield PRF. Need Chrome 116+ / Safari 17+ / Windows Hello with PRF.');
          return;
        }
        const { aes, vaultId } = await deriveKeyshield(prf);
        const seal = await sealOwner(aes);
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
            vaultId,
            sealIv: seal.iv,
            sealCipher: seal.cipher,
          }),
        });
        if (!verify.ok) {
          setError('KeyShield register failed.');
          return;
        }
      } else {
        const cred = (await navigator.credentials.get({
          publicKey: {
            challenge,
            rpId: opt.rpId,
            userVerification: 'required',
            timeout: 60_000,
            allowCredentials: (opt.allowCredentials || []).map((c) => ({
              type: 'public-key' as const,
              id: bytesFromB64url(c.id),
            })),
            extensions: { prf: prfEval },
          } as PublicKeyCredentialRequestOptions,
        })) as PublicKeyCredential | null;
        if (!cred) {
          setError('No KeyShield passkey.');
          return;
        }
        const prf = readPrfFirst(cred);
        if (!prf) {
          setError('KeyShield PRF missing. Fingerprint ran, but this authenticator did not yield a vault key.');
          return;
        }
        const { aes, vaultId } = await deriveKeyshield(prf);
        const id = b64urlFromBuf(cred.rawId);
        const envelope = (opt.seals || []).find((s) => s.id === id);
        if (!envelope?.iv || !envelope.cipher) {
          setError('No KeyShield seal on this device. Register this device first.');
          return;
        }
        const opened = await openOwnerSeal(aes, envelope.iv, envelope.cipher);
        if (!opened) {
          setError('KeyShield seal did not open.');
          return;
        }
        const ass = cred.response as AuthenticatorAssertionResponse;
        const verify = await fetch('/api/auth/passkey/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'unlock',
            id,
            clientDataJSON: b64urlFromBuf(ass.clientDataJSON),
            authenticatorData: b64urlFromBuf(ass.authenticatorData),
            signature: b64urlFromBuf(ass.signature),
            vaultId,
          }),
        });
        if (!verify.ok) {
          setError('KeyShield did not verify.');
          return;
        }
      }
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'KeyShield cancelled.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 max-w-md" data-testid="owner-passkey-unlock">
      <p className="font-mono text-[0.55rem] tracking-[0.28em] uppercase text-[#008f86]/85">
        keyshield · this device
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
          KeyShield method: fingerprint / Face ID / Windows Hello → WebAuthn PRF → HKDF →
          AES-256-GCM. Server holds ciphertext only. No typed secret on this page.
        </p>
      )}
    </div>
  );
}
