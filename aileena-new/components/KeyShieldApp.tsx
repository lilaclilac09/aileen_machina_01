'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KS_APP_HOST,
  KS_EXTENSION_HREF,
  KS_HKDF_MASTER,
  KS_HKDF_VAULT_ID,
  KS_MAX_PLAINTEXT,
  KS_PRF_FIRST,
} from '../lib/keyshield/constants';
import { deriveKeyshield, openText, readPrfFirst, prfFirstBytes, sealOwner, sealText, openOwnerSeal } from '../lib/keyshield/prf';
import { b64urlFromBuf, bytesFromB64url } from '../lib/passkey/b64';
import type { KsVaultEntry } from '../lib/keyshield/types';

type Door = 'locked' | 'open';

type SecretRow = {
  id: string;
  label: string;
  secret: string;
  createdAt: string;
  iv: string;
  cipher: string;
};

function newId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return b64urlFromBuf(bytes.buffer);
}

export default function KeyShieldApp() {
  const aesRef = useRef<CryptoKey | null>(null);
  const [door, setDoor] = useState<Door>('locked');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [rows, setRows] = useState<SecretRow[]>([]);
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [hasSession, setHasSession] = useState(false);

  const loadVault = useCallback(async (aes: CryptoKey) => {
    const res = await fetch('/api/ks/vault', { credentials: 'include' });
    if (res.status === 401) {
      setHasSession(false);
      return;
    }
    const json = (await res.json()) as { entries?: KsVaultEntry[]; vaultId?: string };
    setHasSession(true);
    if (json.vaultId) setVaultId(json.vaultId);
    const next: SecretRow[] = [];
    for (const entry of json.entries || []) {
      const pt = await openText(aes, entry.iv, entry.cipher);
      if (!pt) continue;
      try {
        const parsed = JSON.parse(pt) as { label?: string; secret?: string };
        next.push({
          id: entry.id,
          label: parsed.label || 'untitled',
          secret: parsed.secret || '',
          createdAt: entry.createdAt,
          iv: entry.iv,
          cipher: entry.cipher,
        });
      } catch {
        /* skip corrupt envelope */
      }
    }
    setRows(next);
  }, []);

  useEffect(() => {
    void fetch('/api/ks/vault', { credentials: 'include' }).then((res) => {
      setHasSession(res.ok);
    });
  }, []);

  async function run(mode: 'unlock' | 'register') {
    setBusy(true);
    setError(null);
    try {
      if (!window.PublicKeyCredential) {
        setError('This browser has no WebAuthn / passkey.');
        return;
      }
      const optRes = await fetch('/api/ks/passkey/options', {
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
      };
      if (!optRes.ok) {
        setError('Could not start KeyShield.');
        return;
      }
      if (opt.prfFirst && opt.prfFirst !== KS_PRF_FIRST) {
        setError('Server PRF salt does not match keyshield-prf-v1.');
        return;
      }

      const prfEval = { eval: { first: prfFirstBytes() } };
      const challenge = bytesFromB64url(opt.challenge || '');

      if (mode === 'register') {
        const cred = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: opt.rpName || 'KeyShield', id: opt.rpId },
            user: {
              id: crypto.getRandomValues(new Uint8Array(16)),
              name: 'vault',
              displayName: 'KeyShield vault',
            },
            pubKeyCredParams: [
              { type: 'public-key', alg: -7 },
              { type: 'public-key', alg: -257 },
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
              residentKey: 'required',
            },
            timeout: 60_000,
            extensions: { prf: prfEval },
          } as PublicKeyCredentialCreationOptions,
        })) as PublicKeyCredential | null;
        if (!cred) {
          setError('No passkey created.');
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
        const derived = await deriveKeyshield(prf);
        const seal = await sealOwner(derived.aes);
        const att = cred.response as AuthenticatorAttestationResponse;
        const publicKey = att.getPublicKey?.();
        if (!publicKey) {
          setError('Browser did not export a public key.');
          return;
        }
        const verify = await fetch('/api/ks/passkey/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'register',
            id: b64urlFromBuf(cred.rawId),
            clientDataJSON: b64urlFromBuf(att.clientDataJSON),
            authenticatorData: b64urlFromBuf(att.getAuthenticatorData()),
            publicKey: b64urlFromBuf(publicKey),
            vaultId: derived.vaultId,
            sealIv: seal.iv,
            sealCipher: seal.cipher,
          }),
        });
        if (!verify.ok) {
          setError('Register failed.');
          return;
        }
        aesRef.current = derived.aes;
        setVaultId(derived.vaultId);
        setDoor('open');
        await loadVault(derived.aes);
        return;
      }

      const cred = (await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: opt.rpId,
          userVerification: 'required',
          timeout: 60_000,
          allowCredentials: [],
          extensions: { prf: prfEval },
        } as PublicKeyCredentialRequestOptions,
      })) as PublicKeyCredential | null;
      if (!cred) {
        setError('No passkey.');
        return;
      }
      const prf = readPrfFirst(cred);
      if (!prf) {
        setError('PRF missing. Fingerprint ran, but this authenticator did not yield a vault key.');
        return;
      }
      const derived = await deriveKeyshield(prf);
      const id = b64urlFromBuf(cred.rawId);
      const envelopeRes = await fetch('/api/ks/passkey/envelope', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!envelopeRes.ok) {
        setError('No seal for this passkey. Register this device first.');
        return;
      }
      const envelope = (await envelopeRes.json()) as { iv?: string; cipher?: string };
      if (!envelope.iv || !envelope.cipher) {
        setError('Empty KeyShield seal.');
        return;
      }
      const opened = await openOwnerSeal(derived.aes, envelope.iv, envelope.cipher);
      if (!opened) {
        setError('Seal did not open. Wrong device or old PRF salt.');
        return;
      }
      const ass = cred.response as AuthenticatorAssertionResponse;
      const verify = await fetch('/api/ks/passkey/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'unlock',
          id,
          clientDataJSON: b64urlFromBuf(ass.clientDataJSON),
          authenticatorData: b64urlFromBuf(ass.authenticatorData),
          signature: b64urlFromBuf(ass.signature),
          vaultId: derived.vaultId,
        }),
      });
      if (!verify.ok) {
        setError('KeyShield did not verify.');
        return;
      }
      aesRef.current = derived.aes;
      setVaultId(derived.vaultId);
      setDoor('open');
      await loadVault(derived.aes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'KeyShield cancelled.');
    } finally {
      setBusy(false);
    }
  }

  async function persist(next: SecretRow[]) {
    const aes = aesRef.current;
    if (!aes) return;
    const entries: KsVaultEntry[] = [];
    for (const row of next) {
      entries.push({ id: row.id, iv: row.iv, cipher: row.cipher, createdAt: row.createdAt });
    }
    const res = await fetch('/api/ks/vault', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });
    if (!res.ok) {
      setError('Could not store ciphertext.');
      return;
    }
    setRows(next);
  }

  async function addSecret() {
    const aes = aesRef.current;
    if (!aes) return;
    const name = label.trim();
    const value = secret.trim();
    if (!name || !value) {
      setError('Label and secret are required.');
      return;
    }
    if (value.length > KS_MAX_PLAINTEXT) {
      setError('Secret is too long.');
      return;
    }
    setError(null);
    const envelope = await sealText(aes, JSON.stringify({ label: name, secret: value }));
    const row: SecretRow = {
      id: newId(),
      label: name,
      secret: value,
      createdAt: new Date().toISOString(),
      iv: envelope.iv,
      cipher: envelope.cipher,
    };
    await persist([row, ...rows]);
    setLabel('');
    setSecret('');
  }

  async function removeSecret(id: string) {
    await persist(rows.filter((row) => row.id !== id));
    setRevealed((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <main className="ks-app" data-testid="keyshield-app">
      <header className="ks-top">
        <p className="ks-kicker">keyshield · {KS_APP_HOST}</p>
        <h1>KeyShield</h1>
        <p className="ks-dek">
          Store a secret once. Unlock with a passkey. The server keeps ciphertext only.
        </p>
      </header>

      {door === 'locked' ? (
        <section className="ks-door" data-testid="keyshield-door">
          <button
            type="button"
            data-testid="keyshield-unlock"
            disabled={busy}
            onClick={() => void run('unlock')}
          >
            {busy ? 'waiting…' : hasSession ? 'unlock this device' : 'unlock'}
          </button>
          <button
            type="button"
            className="ks-ghost"
            data-testid="keyshield-register"
            disabled={busy}
            onClick={() => void run('register')}
          >
            register this device
          </button>
          <p className="ks-method" data-testid="keyshield-method">
            {KS_PRF_FIRST} → {KS_HKDF_MASTER} / {KS_HKDF_VAULT_ID} → AES-256-GCM
          </p>
          <a
            className="ks-ext"
            data-testid="keyshield-extension"
            href={KS_EXTENSION_HREF}
            target="_blank"
            rel="noopener noreferrer"
          >
            Install browser extension →
          </a>
          <p className="ks-ext-note">
            Chrome / Edge / Brave / Arc: <code>chrome://extensions</code> → Developer mode → Load
            unpacked → <code>src/extension</code>
          </p>
        </section>
      ) : (
        <section className="ks-vault" data-testid="keyshield-vault">
          <p className="ks-vault-id">vault {vaultId}</p>
          <form
            className="ks-add"
            onSubmit={(e) => {
              e.preventDefault();
              void addSecret();
            }}
          >
            <label>
              label
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                autoComplete="off"
                data-testid="keyshield-label"
              />
            </label>
            <label>
              secret
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                autoComplete="off"
                data-testid="keyshield-secret"
              />
            </label>
            <button type="submit" data-testid="keyshield-add">
              seal →
            </button>
          </form>
          <ul className="ks-list" data-testid="keyshield-list">
            {rows.length === 0 ? <li className="ks-empty">empty vault</li> : null}
            {rows.map((row) => (
              <li key={row.id}>
                <div>
                  <strong>{row.label}</strong>
                  <code>{revealed[row.id] ? row.secret : '••••••••'}</code>
                </div>
                <span>
                  <button type="button" onClick={() => setRevealed((p) => ({ ...p, [row.id]: !p[row.id] }))}>
                    {revealed[row.id] ? 'hide' : 'reveal'}
                  </button>
                  <button type="button" onClick={() => void removeSecret(row.id)}>
                    delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error ? (
        <p className="ks-error" data-testid="keyshield-error">
          {error}
        </p>
      ) : null}

      <footer className="ks-foot">
        <p>
          Live app for {KS_APP_HOST}. Not the retired Railway API. Wallet fallback stays in the
          original KeyShield repo; this surface uses the updated passkey PRF door.
        </p>
        <p>
          <a href="https://www.aileena.xyz">aileena.xyz</a>
          {' · '}
          <a href={KS_EXTENSION_HREF}>extension</a>
          {' · '}
          <a href="https://github.com/lilaclilac09/keyshield">source</a>
        </p>
      </footer>
    </main>
  );
}
