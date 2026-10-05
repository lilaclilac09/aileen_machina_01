'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KS_APP_HOST,
  KS_EXTENSION_HREF,
  KS_HKDF_MASTER,
  KS_HKDF_VAULT_ID,
  KS_MAX_PLAINTEXT,
  KS_NAV,
  KS_OWNER_PLAINTEXT,
  KS_PRF_FIRST,
  KS_SOURCE_HREF,
  KS_WALLET_VAULT_MSG,
  type KsNavId,
} from '../lib/keyshield/constants';
import {
  deriveKeyshield,
  deriveKeyshieldFromWallet,
  openOwnerSeal,
  openText,
  prfFirstBytes,
  readPrfFirst,
  sealText,
  unwrapVaultIkm,
  wrapVaultIkm,
} from '../lib/keyshield/prf';
import type { KsAgent, KsSecretKind, KsSecretPlain, KsShareGrant, KsTrustDomain, KsVaultEntry } from '../lib/keyshield/types';
import { bytesToB64, connectKsWallet, installedWallets, type KsWalletId } from '../lib/keyshield/wallets';
import { b64urlFromBuf, b64urlFromBytes, bytesFromB64url } from '../lib/passkey/b64';

type Door = 'locked' | 'open';
type WalletPhase = 'idle' | 'pick' | 'signing' | 'authenticating';

type SecretRow = KsSecretPlain & {
  id: string;
  createdAt: string;
  iv: string;
  cipher: string;
};

type SessionRow = {
  id: string;
  via: string;
  sub: string;
  ua: string;
  createdAt: string;
  revoked: boolean;
  current: boolean;
};

type PasskeyRow = { id: string; label: string; createdAt: string };
type AuditRow = { at: string; action: string; label: string };

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', domain: 'openai.com', placeholder: 'sk-proj-…' },
  { id: 'anthropic', name: 'Anthropic Claude', domain: 'anthropic.com', placeholder: 'sk-ant-api03-…' },
  { id: 'helius', name: 'Helius RPC', domain: 'helius.dev', placeholder: 'xxxxxxxx-xxxx-…' },
  { id: 'mistral', name: 'Mistral AI', domain: 'mistral.ai', placeholder: 'xxxxxxxxxxxxxxxx' },
  { id: 'cohere', name: 'Cohere', domain: 'cohere.ai', placeholder: 'xxxxxxxxxxxxxxxx' },
  { id: 'groq', name: 'Groq', domain: 'groq.com', placeholder: 'gsk_…' },
] as const;

const KINDS: { id: KsSecretKind; label: string; sub: string }[] = [
  { id: 'api_key', label: 'API Key', sub: 'OpenAI, Anthropic, Helius… proxied with zero-trust' },
  { id: 'password', label: 'Password', sub: 'Username + password for any site' },
  { id: 'note', label: 'Secure Note', sub: 'Encrypted text — recovery codes, secrets, etc.' },
  { id: 'env', label: '.env File', sub: 'Block of KEY=VALUE pairs for an app' },
  { id: 'ssh_key', label: 'SSH Key', sub: 'Public + private key + passphrase' },
];

const IKM_KEY = 'ks_vault_ikm';
const PASSKEY_USER = 'ks_passkey_user';
const WALLET_SUB = 'ks_wallet_sub';
const AUDIT_KEY = 'ks_audit';

function newId(): string {
  return b64urlFromBuf(crypto.getRandomValues(new Uint8Array(12)).buffer);
}

function shortAddr(value: string): string {
  if (!value) return '—';
  if (value.length <= 10) return value;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

function readAudit(): AuditRow[] {
  try {
    const raw = sessionStorage.getItem(AUDIT_KEY);
    return raw ? (JSON.parse(raw) as AuditRow[]) : [];
  } catch {
    return [];
  }
}

function pushAudit(action: string, label: string) {
  const next = [{ at: new Date().toISOString(), action, label }, ...readAudit()].slice(0, 80);
  try {
    sessionStorage.setItem(AUDIT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function parseSecret(pt: string, entry: KsVaultEntry): SecretRow | null {
  try {
    const parsed = JSON.parse(pt) as Partial<KsSecretPlain> & { secret?: string; label?: string };
    return {
      id: entry.id,
      createdAt: entry.createdAt,
      iv: entry.iv,
      cipher: entry.cipher,
      kind: parsed.kind || 'note',
      label: parsed.label || 'untitled',
      secret: parsed.secret || '',
      provider: parsed.provider,
      domain: parsed.domain,
      username: parsed.username,
      publicKey: parsed.publicKey,
      passphrase: parsed.passphrase,
      expiryDate: parsed.expiryDate,
      tags: parsed.tags,
    };
  } catch {
    return null;
  }
}

export default function KeyShieldApp() {
  const aesRef = useRef<CryptoKey | null>(null);
  const ikmRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const [door, setDoor] = useState<Door>('locked');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [walletSub, setWalletSub] = useState<string | null>(null);
  const [rows, setRows] = useState<SecretRow[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [hasSession, setHasSession] = useState(false);
  const [tab, setTab] = useState<KsNavId>('vault');
  const [walletPhase, setWalletPhase] = useState<WalletPhase>('idle');
  const [forceWallet, setForceWallet] = useState(false);
  const [query, setQuery] = useState('');
  const [composer, setComposer] = useState(false);
  const [kind, setKind] = useState<KsSecretKind>('api_key');
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [provider, setProvider] = useState<(typeof PROVIDERS)[number]['id']>('openai');
  const [username, setUsername] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [agents, setAgents] = useState<KsAgent[]>([]);
  const [agentName, setAgentName] = useState('');
  const [agentPub, setAgentPub] = useState('');
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [shares, setShares] = useState<KsShareGrant[]>([]);
  const [shareEntry, setShareEntry] = useState('');
  const [shareTo, setShareTo] = useState('');
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [trust, setTrust] = useState<KsTrustDomain[]>([]);
  const [trustHost, setTrustHost] = useState('');
  const [trustCap, setTrustCap] = useState('1');
  const [cliToken, setCliToken] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [deviceName, setDeviceName] = useState('');
  const [trusted, setTrusted] = useState(false);

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
      const row = parseSecret(pt, entry);
      if (row) next.push(row);
    }
    setRows(next);
  }, []);

  const openDoor = useCallback(async (aes: CryptoKey, ikm: Uint8Array<ArrayBuffer>, id: string, sub?: string) => {
    aesRef.current = aes;
    ikmRef.current = ikm;
    try {
      sessionStorage.setItem(IKM_KEY, b64urlFromBytes(ikm));
    } catch {
      /* private mode */
    }
    if (sub) {
      setWalletSub(sub);
      try {
        localStorage.setItem(WALLET_SUB, sub);
      } catch {
        /* ignore */
      }
    }
    setVaultId(id);
    setDoor('open');
    setAudit(readAudit());
    await loadVault(aes);
  }, [loadVault]);

  useEffect(() => {
    setTrusted(!forceWallet && !!localStorage.getItem(PASSKEY_USER));
  }, [forceWallet]);

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/ks/vault', { credentials: 'include' });
      setHasSession(res.ok);
      if (!res.ok) return;
      const stored = sessionStorage.getItem(IKM_KEY);
      if (!stored) return;
      try {
        const ikm = bytesFromB64url(stored);
        const derived = await deriveKeyshield(ikm);
        const json = (await res.json()) as { vaultId?: string };
        if (json.vaultId && json.vaultId !== derived.vaultId) return;
        await openDoor(derived.aes, ikm, derived.vaultId, localStorage.getItem(WALLET_SUB) || undefined);
      } catch {
        /* stay locked */
      }
    })();
  }, [openDoor]);

  async function runWallet(id: KsWalletId) {
    setBusy(true);
    setError(null);
    setWalletPhase('signing');
    try {
      const wallet = await connectKsWallet(id);
      const chRes = await fetch('/api/ks/wallet/challenge', { credentials: 'include' });
      const ch = (await chRes.json()) as { challenge?: string; error?: string };
      if (!chRes.ok || !ch.challenge) {
        setError('Failed to fetch challenge');
        return;
      }
      const challengeSig = await wallet.signMessage(new TextEncoder().encode(ch.challenge));
      const vaultSig = await wallet.signMessage(new TextEncoder().encode(KS_WALLET_VAULT_MSG));
      setWalletPhase('authenticating');
      const derived = await deriveKeyshieldFromWallet(vaultSig);
      const login = await fetch('/api/ks/wallet/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: wallet.address,
          signature: bytesToB64(challengeSig),
          challenge: ch.challenge,
          vaultId: derived.vaultId,
        }),
      });
      if (!login.ok) {
        setError('Wallet login failed');
        return;
      }
      pushAudit('wallet', wallet.address);
      setAudit(readAudit());
      await openDoor(derived.aes, derived.ikm, derived.vaultId, wallet.address);
      setWalletPhase('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet connection cancelled by user');
      setWalletPhase('idle');
    } finally {
      setBusy(false);
    }
  }

  async function runPasskey(mode: 'unlock' | 'register') {
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
              name: deviceName || 'vault',
              displayName: deviceName || 'KeyShield vault',
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
        const wrap = await deriveKeyshield(prf);
        const existingIkm = ikmRef.current;
        const ikm = existingIkm || new Uint8Array(prf);
        const derived = existingIkm ? await deriveKeyshield(existingIkm) : wrap;
        const seal = existingIkm
          ? await sealText(wrap.aes, wrapVaultIkm(existingIkm, derived.vaultId))
          : await sealText(wrap.aes, wrapVaultIkm(ikm, derived.vaultId));
        const att = cred.response as AuthenticatorAttestationResponse;
        const exported = att.getPublicKey?.();
        if (!exported) {
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
            publicKey: b64urlFromBuf(exported),
            vaultId: derived.vaultId,
            sealIv: seal.iv,
            sealCipher: seal.cipher,
          }),
        });
        if (!verify.ok) {
          setError('Register failed.');
          return;
        }
        try {
          localStorage.setItem(PASSKEY_USER, walletSub || derived.vaultId);
        } catch {
          /* ignore */
        }
        pushAudit('passkey', 'register');
        setAudit(readAudit());
        await openDoor(derived.aes, ikm, derived.vaultId, walletSub || undefined);
        await refreshPasskeys();
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
      const wrap = await deriveKeyshield(prf);
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
      const opened = await openText(wrap.aes, envelope.iv, envelope.cipher);
      const wrapped = opened ? unwrapVaultIkm(opened) : null;
      const legacyOk = opened === KS_OWNER_PLAINTEXT || (!opened && (await openOwnerSeal(wrap.aes, envelope.iv, envelope.cipher)));
      let derived = wrap;
      let ikm = new Uint8Array(prf);
      if (wrapped) {
        derived = await deriveKeyshield(wrapped.ikm);
        ikm = wrapped.ikm;
      } else if (!legacyOk) {
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
      pushAudit('passkey', 'unlock');
      setAudit(readAudit());
      await openDoor(derived.aes, ikm, derived.vaultId, localStorage.getItem(WALLET_SUB) || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'KeyShield cancelled.');
    } finally {
      setBusy(false);
    }
  }

  async function persist(next: SecretRow[]) {
    const aes = aesRef.current;
    if (!aes) return;
    const entries: KsVaultEntry[] = next.map((row) => ({
      id: row.id,
      iv: row.iv,
      cipher: row.cipher,
      createdAt: row.createdAt,
    }));
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
    const name = label.trim() || (kind === 'api_key' ? PROVIDERS.find((p) => p.id === provider)?.name || 'API key' : '');
    const value = secret.trim();
    if (!value) {
      setError(kind === 'password' ? 'Password required' : kind === 'ssh_key' ? 'Private key required' : 'Write something');
      return;
    }
    if (value.length > KS_MAX_PLAINTEXT) {
      setError('Secret is too long.');
      return;
    }
    setError(null);
    const payload: KsSecretPlain = {
      kind,
      label: name || 'untitled',
      secret: value,
      provider: kind === 'api_key' ? provider : undefined,
      domain: kind === 'api_key' ? PROVIDERS.find((p) => p.id === provider)?.domain : undefined,
      username: kind === 'password' ? username : undefined,
      publicKey: kind === 'ssh_key' ? publicKey : undefined,
      passphrase: kind === 'ssh_key' ? passphrase : undefined,
      expiryDate: kind === 'api_key' ? expiryDate || undefined : undefined,
      tags: kind === 'api_key' ? ['VAULT'] : undefined,
    };
    const envelope = await sealText(aes, JSON.stringify(payload));
    const row: SecretRow = {
      ...payload,
      id: newId(),
      createdAt: new Date().toISOString(),
      iv: envelope.iv,
      cipher: envelope.cipher,
    };
    await persist([row, ...rows]);
    pushAudit('save', payload.label);
    setAudit(readAudit());
    setLabel('');
    setSecret('');
    setUsername('');
    setPublicKey('');
    setPassphrase('');
    setExpiryDate('');
    setComposer(false);
  }

  async function removeSecret(id: string) {
    const row = rows.find((r) => r.id === id);
    await persist(rows.filter((item) => item.id !== id));
    if (row) {
      pushAudit('delete', row.label);
      setAudit(readAudit());
    }
    setRevealed((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function refreshMeta() {
    const [a, s, sh, pk, t] = await Promise.all([
      fetch('/api/ks/agents', { credentials: 'include' }),
      fetch('/api/ks/sessions', { credentials: 'include' }),
      fetch('/api/ks/shares', { credentials: 'include' }),
      fetch('/api/ks/passkey/list', { credentials: 'include' }),
      fetch('/api/ks/trust', { credentials: 'include' }),
    ]);
    if (a.ok) setAgents(((await a.json()) as { agents: KsAgent[] }).agents || []);
    if (s.ok) setSessions(((await s.json()) as { sessions: SessionRow[] }).sessions || []);
    if (sh.ok) setShares(((await sh.json()) as { shares: KsShareGrant[] }).shares || []);
    if (pk.ok) setPasskeys(((await pk.json()) as { passkeys: PasskeyRow[] }).passkeys || []);
    if (t.ok) setTrust(((await t.json()) as { domains: KsTrustDomain[] }).domains || []);
  }

  async function refreshPasskeys() {
    const pk = await fetch('/api/ks/passkey/list', { credentials: 'include' });
    if (pk.ok) setPasskeys(((await pk.json()) as { passkeys: PasskeyRow[] }).passkeys || []);
  }

  useEffect(() => {
    if (door === 'open') void refreshMeta();
  }, [door, tab]);

  async function signOut() {
    await fetch('/api/ks/logout', { method: 'POST', credentials: 'include' });
    aesRef.current = null;
    ikmRef.current = null;
    try {
      sessionStorage.removeItem(IKM_KEY);
    } catch {
      /* ignore */
    }
    setDoor('locked');
    setRows([]);
    setHasSession(false);
    setWalletPhase('idle');
    setCliToken(null);
  }

  function forgetDevice() {
    try {
      localStorage.removeItem(PASSKEY_USER);
    } catch {
      /* ignore */
    }
    setForceWallet(true);
    setError(null);
  }

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [row.label, row.domain, row.provider, row.kind, ...(row.tags || [])].join(' ').toLowerCase().includes(q);
  });
  const usedWeek = rows.filter((row) => Date.now() - new Date(row.createdAt).getTime() < 864e5 * 7).length;
  const expiring = rows.filter((row) => {
    if (!row.expiryDate) return false;
    const days = (new Date(row.expiryDate).getTime() - Date.now()) / 864e5;
    return days >= 0 && days <= 14;
  }).length;
  const nav = KS_NAV.find((item) => item.id === tab) || KS_NAV[0];
  const wallets = installedWallets();

  if (door === 'locked') {
    return (
      <main className="ks-door-page" data-testid="keyshield-app">
        <div className="ks-door-card">
          <div className="ks-shield" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="white" strokeWidth="1.5" />
              <circle cx="11.5" cy="11" r="2" stroke="#a8b3d8" strokeWidth="1.2" />
              <line x1="13" y1="12.5" x2="16" y2="15.5" stroke="#a8b3d8" strokeWidth="1.2" />
            </svg>
          </div>
          <h1>KeyShield</h1>
          <p className="ks-dek">
            {trusted
              ? 'Welcome back. Sign in with Face ID, Touch ID, or your hardware key.'
              : 'Connect your Solana wallet to access your encrypted secrets.'}
          </p>

          <section className="ks-door" data-testid="keyshield-door">
            {trusted ? (
              <>
                <button type="button" data-testid="keyshield-unlock" disabled={busy} onClick={() => void runPasskey('unlock')}>
                  {busy ? 'Verifying…' : `Sign In as ${shortAddr(localStorage.getItem(PASSKEY_USER) || '')}`}
                </button>
                <button type="button" className="ks-text" onClick={() => setForceWallet(true)}>
                  Use a different wallet instead
                </button>
                <button type="button" className="ks-text ks-muted" onClick={forgetDevice}>
                  Forget this device
                </button>
              </>
            ) : walletPhase === 'signing' || walletPhase === 'authenticating' ? (
              <div className="ks-wait" data-testid="keyshield-wallet-wait">
                {walletPhase === 'signing' ? 'Approve signature in your wallet…' : 'Unlocking vault…'}
              </div>
            ) : walletPhase === 'pick' ? (
              <div className="ks-picker" data-testid="keyshield-wallet-picker">
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className={w.installed ? undefined : 'ks-ghost'}
                    data-testid={`keyshield-wallet-${w.id}`}
                    disabled={busy}
                    onClick={() => {
                      if (w.installed) void runWallet(w.id);
                      else window.open(w.href, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    {w.installed ? `Connect ${w.label}` : `Install ${w.label} →`}
                  </button>
                ))}
                <button type="button" className="ks-text" onClick={() => setWalletPhase('idle')}>
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  data-testid="keyshield-connect-wallet"
                  disabled={busy}
                  onClick={() => {
                    const ready = wallets.filter((w) => w.installed);
                    if (ready.length === 1) void runWallet(ready[0].id);
                    else setWalletPhase('pick');
                  }}
                >
                  {busy ? 'Connecting…' : 'Connect Wallet'}
                </button>
                <p className="ks-wallets" data-testid="keyshield-wallets">
                  Phantom · Solflare · Backpack · OKX
                </p>
                {hasSession ? (
                  <button type="button" className="ks-ghost" data-testid="keyshield-unlock" disabled={busy} onClick={() => void runPasskey('unlock')}>
                    Sign in with Face ID
                  </button>
                ) : (
                  <button type="button" className="ks-ghost" data-testid="keyshield-register" disabled={busy} onClick={() => void runPasskey('register')}>
                    Register a passkey on this device
                  </button>
                )}
              </>
            )}
            <p className="ks-method" data-testid="keyshield-method">
              AES-256-GCM · ed25519 wallet signatures · server never sees your key material
            </p>
            <p className="ks-method">
              {KS_PRF_FIRST} → {KS_HKDF_MASTER} / {KS_HKDF_VAULT_ID}
            </p>
            <a className="ks-ext" data-testid="keyshield-extension" href={KS_EXTENSION_HREF} target="_blank" rel="noopener noreferrer">
              Install browser extension →
            </a>
            <p className="ks-ext-note">
              Chrome / Edge / Brave / Arc: <code>chrome://extensions</code> → Developer mode → Load unpacked →{' '}
              <code>src/extension</code>
            </p>
          </section>
          {error ? (
            <p className="ks-error" data-testid="keyshield-error">
              {error}
            </p>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <div className="ks-shell" data-testid="keyshield-app" data-ks-open="1">
      <aside className="ks-side" data-testid="keyshield-nav">
        <div className="ks-brand">
          <span className="ks-shield ks-shield-sm" aria-hidden="true" />
          KeyShield
        </div>
        <nav>
          {KS_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'is-on' : undefined}
              data-testid={`keyshield-tab-${item.id}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="ks-side-foot">
          <p className={`ks-dot ${walletSub ? 'is-on' : ''}`}>{walletSub ? 'Connected' : 'Passkey'}</p>
          <button type="button" className="ks-addr" onClick={() => void navigator.clipboard.writeText(walletSub || vaultId || '')}>
            {shortAddr(walletSub || vaultId || '')}
          </button>
          <button type="button" className="ks-ghost" data-testid="keyshield-signout" onClick={() => void signOut()}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="ks-main" data-testid="keyshield-vault">
        <header className="ks-head">
          <div>
            <h1>{nav.title}</h1>
            <p>{nav.subtitle}</p>
          </div>
          {tab === 'vault' ? (
            <div className="ks-head-actions">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, domain, or tag…"
                data-testid="keyshield-search"
              />
              <button type="button" data-testid="keyshield-new" onClick={() => setComposer(true)}>
                New Secret
              </button>
            </div>
          ) : null}
        </header>

        {error ? (
          <p className="ks-error" data-testid="keyshield-error">
            {error}
          </p>
        ) : null}

        {tab === 'vault' ? (
          <section className="ks-panel">
            <div className="ks-stats">
              <article>
                <span>Total Secrets</span>
                <strong data-testid="keyshield-total">{rows.length}</strong>
                <em>encrypted with AES-256-GCM</em>
              </article>
              <article>
                <span>Used This Week</span>
                <strong>{usedWeek}</strong>
                <em>across agents and apps</em>
              </article>
              <article>
                <span>Expiring Soon</span>
                <strong>{expiring}</strong>
                <em>within 14 days</em>
              </article>
            </div>
            {rows.length === 0 ? (
              <div className="ks-empty-card">
                <p>Your vault is empty</p>
                <p>Add your first encrypted secret to get started</p>
                <div className="ks-how">
                  <span>How it works</span>
                  <em>Add key here</em>
                  <i />
                  <em>Encrypted on device</em>
                  <i />
                  <em>Agent calls /proxy/...</em>
                  <i />
                  <em>Key injected per-request</em>
                </div>
              </div>
            ) : (
              <ul className="ks-list" data-testid="keyshield-list">
                {filtered.length === 0 ? <li className="ks-empty">No secrets match your search</li> : null}
                {filtered.map((row) => (
                  <li key={row.id}>
                    <div>
                      <strong>{row.label}</strong>
                      <small>{row.kind}{row.domain ? ` · ${row.domain}` : ''}</small>
                      <code>{revealed[row.id] ? row.secret : '••••••••'}</code>
                    </div>
                    <span>
                      <button
                        type="button"
                        onClick={() => {
                          setRevealed((p) => ({ ...p, [row.id]: !p[row.id] }));
                          if (!revealed[row.id]) {
                            pushAudit('reveal', row.label);
                            setAudit(readAudit());
                          }
                        }}
                      >
                        {revealed[row.id] ? 'hide' : 'reveal'}
                      </button>
                      <button type="button" onClick={() => void removeSecret(row.id)}>
                        delete
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {tab === 'activity' ? (
          <section className="ks-panel">
            <p className="ks-honest">
              Proxy / MPP / x402 live on <code>api.ks.aileena.xyz</code> when the Rust proxy is bound. This host stores
              ciphertext only — no fake call counts.
            </p>
            <div className="ks-stats">
              <article>
                <span>Total Calls</span>
                <strong>0</strong>
                <em>proxy not bound</em>
              </article>
              <article>
                <span>Total Cost</span>
                <strong>0</strong>
                <em>no x402 meter</em>
              </article>
              <article>
                <span>MPP Streams</span>
                <strong>0</strong>
                <em>Connect the wallet and wait for /health/mpp program id</em>
              </article>
            </div>
          </section>
        ) : null}

        {tab === 'agents' ? (
          <section className="ks-panel">
            <p>Register an ed25519 pubkey. Agent signs a server challenge on each run.</p>
            <form
              className="ks-add"
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  const res = await fetch('/api/ks/agents', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: agentName, pubkey: agentPub }),
                  });
                  if (!res.ok) {
                    setError('Could not register agent.');
                    return;
                  }
                  setAgents(((await res.json()) as { agents: KsAgent[] }).agents);
                  setAgentName('');
                  setAgentPub('');
                  pushAudit('agent', agentName);
                  setAudit(readAudit());
                })();
              }}
            >
              <label>
                Agent Name
                <input value={agentName} onChange={(e) => setAgentName(e.target.value)} data-testid="keyshield-agent-name" />
              </label>
              <label>
                Public Key (base58)
                <input value={agentPub} onChange={(e) => setAgentPub(e.target.value)} data-testid="keyshield-agent-pub" />
              </label>
              <button type="submit" data-testid="keyshield-agent-add">
                Register Pubkey
              </button>
            </form>
            <ul className="ks-list">
              {agents.length === 0 ? <li className="ks-empty">No agents registered yet</li> : null}
              {agents.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>{row.name}</strong>
                    <code>{row.pubkey}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void fetch(`/api/ks/agents?id=${encodeURIComponent(row.id)}`, {
                        method: 'DELETE',
                        credentials: 'include',
                      }).then(async (res) => {
                        if (res.ok) setAgents(((await res.json()) as { agents: KsAgent[] }).agents);
                      })
                    }
                  >
                    revoke
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {tab === 'sharing' ? (
          <section className="ks-panel">
            <p>
              Grant teammates read access without showing plaintext here. Ciphertext stays sealed to your vault key until
              they open their own KeyShield door.
            </p>
            <form
              className="ks-add"
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  const res = await fetch('/api/ks/shares', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entryId: shareEntry, recipient: shareTo }),
                  });
                  if (!res.ok) {
                    setError(res.status === 400 ? "You can't share a key with yourself." : 'Share failed');
                    return;
                  }
                  setShares(((await res.json()) as { shares: KsShareGrant[] }).shares);
                  setShareTo('');
                })();
              }}
            >
              <label>
                Secret
                <select value={shareEntry} onChange={(e) => setShareEntry(e.target.value)}>
                  <option value="">Select</option>
                  {rows.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Recipient (wallet address or userId)
                <input value={shareTo} onChange={(e) => setShareTo(e.target.value)} />
              </label>
              <button type="submit">Grant Share</button>
            </form>
            <ul className="ks-list">
              {rows.length === 0 ? <li className="ks-empty">No keys in your vault yet — add one in Vault first.</li> : null}
              {shares.length === 0 && rows.length > 0 ? <li className="ks-empty">You haven&apos;t shared any keys yet.</li> : null}
              {shares.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>{row.recipient}</strong>
                    <small>{row.entryId}</small>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void fetch(`/api/ks/shares?id=${encodeURIComponent(row.id)}`, {
                        method: 'DELETE',
                        credentials: 'include',
                      }).then(async (res) => {
                        if (res.ok) setShares(((await res.json()) as { shares: KsShareGrant[] }).shares);
                      })
                    }
                  >
                    revoke
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {tab === 'sessions' ? (
          <section className="ks-panel">
            <p>Current Session · {walletSub ? 'Solana wallet · ed25519' : 'Passkey · WebAuthn'}</p>
            <ul className="ks-list" data-testid="keyshield-sessions">
              {sessions.length === 0 ? <li className="ks-empty">No other devices signed in</li> : null}
              {sessions.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>
                      {row.current ? 'Current Session' : row.via} {shortAddr(row.sub)}
                    </strong>
                    <small>
                      {row.ua} · {row.createdAt}
                      {row.revoked ? ' · revoked' : ''}
                    </small>
                  </div>
                  {!row.current && !row.revoked ? (
                    <button
                      type="button"
                      onClick={() =>
                        void fetch('/api/ks/sessions', {
                          method: 'POST',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: row.id }),
                        }).then(() => void refreshMeta())
                      }
                    >
                      revoke
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {tab === 'settings' ? (
          <section className="ks-panel">
            <article className="ks-card">
              <h2>Encryption</h2>
              <p>AES-256-GCM · keyshield-prf-v1 HKDF · wallet ed25519 or WebAuthn PRF</p>
              <p>Wallet that owns the vault. Recovery = wallet seed phrase.</p>
            </article>
            <article className="ks-card">
              <h2>Trusted Devices</h2>
              <p>Each passkey = one device that can sign in with Face ID / Touch ID / hardware key.</p>
              <label>
                Device name (e.g. MacBook, iPhone)
                <input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
              </label>
              <button type="button" className="ks-ghost" onClick={() => void runPasskey('register')}>
                Add Passkey
              </button>
              <ul className="ks-list">
                {passkeys.length === 0 ? <li className="ks-empty">No passkeys registered yet</li> : null}
                {passkeys.map((row) => (
                  <li key={row.id}>
                    <div>
                      <strong>{row.label}</strong>
                      <small>{row.createdAt}</small>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        void fetch(`/api/ks/passkey/list?id=${encodeURIComponent(row.id)}`, {
                          method: 'DELETE',
                          credentials: 'include',
                        }).then(() => void refreshPasskeys())
                      }
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            </article>
            <a className="ks-ext" href={KS_EXTENSION_HREF} target="_blank" rel="noopener noreferrer">
              Install browser extension →
            </a>
          </section>
        ) : null}

        {tab === 'developer' ? (
          <section className="ks-panel">
            <article className="ks-card">
              <h2>Session Token</h2>
              <p>Use as Bearer in API/CLI calls. Valid 24h.</p>
              <button
                type="button"
                onClick={() =>
                  void fetch('/api/ks/token', { method: 'POST', credentials: 'include' }).then(async (res) => {
                    const json = (await res.json()) as { token?: string };
                    setCliToken(json.token || null);
                  })
                }
              >
                Copy (auto-clears)
              </button>
              {cliToken ? <code className="ks-token">{cliToken}</code> : null}
            </article>
            <article className="ks-card">
              <h2>CLI — keyshield-cli.sh</h2>
              <pre>{`curl -sS ${typeof window !== 'undefined' ? window.location.origin : ''}/api/ks/vault \\
  -H "Authorization: Bearer ${cliToken || 'YOUR_TOKEN'}"`}</pre>
              <h2>Endpoint Reference</h2>
              <ul className="ks-docs">
                <li>GET /api/ks/wallet/challenge — Get one-time signing challenge</li>
                <li>POST /api/ks/wallet/login — Submit signature → session</li>
                <li>POST /api/ks/logout — Revoke current session</li>
                <li>GET/PUT /api/ks/vault — List / store ciphertext</li>
                <li>GET/POST /api/ks/agents — List / register agents</li>
                <li>GET /api/ks/health — Server + cache status</li>
              </ul>
              <p>
                <a href={KS_SOURCE_HREF}>source</a>
                {' · '}
                <a href={KS_EXTENSION_HREF}>extension</a>
              </p>
            </article>
          </section>
        ) : null}

        {tab === 'docs' ? (
          <section className="ks-panel ks-docs-panel">
            <h2>CHAPTER 1 · Run this in your terminal</h2>
            <p>
              Use the unpacked extension while signed in here. Clone or download the repo, then Developer mode → Load
              unpacked → <code>src/extension</code>.
            </p>
            <h2>CHAPTER 2 · Core Concepts</h2>
            <p>Your API keys, encrypted with AES-256-GCM. The decryption key never leaves your machine.</p>
            <p>A request hits /proxy/ — lower latency when the Rust proxy is bound.</p>
            <h2>CHAPTER 3 · Agent Setup</h2>
            <p>In the Agents tab, click Register, or paste an ed25519 pubkey + name.</p>
            <h2>CHAPTER 4 · Billing & x402</h2>
            <p>How payment works for non-self-custodian calls: free credit, prepaid balance, MPP streaming.</p>
            <h2>CHAPTER 5 · Security Model</h2>
            <p>AES-256-GCM · zero-knowledge · server never sees your key material or passphrase in plaintext.</p>
          </section>
        ) : null}

        {tab === 'reports' ? (
          <section className="ks-panel">
            <p>KeyShield Vault Audit Report · client-side only · no server upload</p>
            <ul className="ks-list">
              {audit.length === 0 ? <li className="ks-empty">No detections yet.</li> : null}
              {audit.map((row) => (
                <li key={`${row.at}-${row.action}-${row.label}`}>
                  <div>
                    <strong>{row.action}</strong>
                    <small>
                      {row.label} · {row.at}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {tab === 'trust' ? (
          <section className="ks-panel">
            <p>
              Auto-pay only fires when the site returns <code>X-Payment-Required: x402</code> and the Rust proxy is bound.
              Thresholds are stored for this vault.
            </p>
            <form
              className="ks-add"
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  const res = await fetch('/api/ks/trust', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ host: trustHost, thresholdUsd: Number(trustCap) }),
                  });
                  if (!res.ok) {
                    setError('Failed to add domain');
                    return;
                  }
                  setTrust(((await res.json()) as { domains: KsTrustDomain[] }).domains);
                  setTrustHost('');
                })();
              }}
            >
              <label>
                hostname
                <input value={trustHost} onChange={(e) => setTrustHost(e.target.value)} placeholder="api.example.com" />
              </label>
              <label>
                Threshold
                <input value={trustCap} onChange={(e) => setTrustCap(e.target.value)} />
              </label>
              <button type="submit">Add domain</button>
            </form>
            <ul className="ks-list">
              {trust.length === 0 ? <li className="ks-empty">No trusted domains yet.</li> : null}
              {trust.map((row) => (
                <li key={row.host}>
                  <div>
                    <strong>{row.host}</strong>
                    <small>Max auto-pay ${row.thresholdUsd}</small>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void fetch(`/api/ks/trust?host=${encodeURIComponent(row.host)}`, {
                        method: 'DELETE',
                        credentials: 'include',
                      }).then(async (res) => {
                        if (res.ok) setTrust(((await res.json()) as { domains: KsTrustDomain[] }).domains);
                      })
                    }
                  >
                    Remove domain
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="ks-host">keyshield · {KS_APP_HOST}</p>
      </main>

      {composer ? (
        <div className="ks-modal" data-testid="keyshield-composer">
          <div className="ks-modal-card">
            <header>
              <div>
                <h2>New Secret</h2>
                <p>{KINDS.find((k) => k.id === kind)?.sub}</p>
              </div>
              <button type="button" onClick={() => setComposer(false)}>
                close
              </button>
            </header>
            <div className="ks-kinds">
              {KINDS.map((item) => (
                <button key={item.id} type="button" className={kind === item.id ? 'is-on' : undefined} onClick={() => setKind(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <form
              className="ks-add"
              onSubmit={(e) => {
                e.preventDefault();
                void addSecret();
              }}
            >
              <label>
                {kind === 'api_key' ? 'Label' : kind === 'note' ? 'Title' : 'Name'}
                <input value={label} onChange={(e) => setLabel(e.target.value)} data-testid="keyshield-label" />
              </label>
              {kind === 'api_key' ? (
                <>
                  <label>
                    Provider
                    <select value={provider} onChange={(e) => setProvider(e.target.value as (typeof PROVIDERS)[number]['id'])}>
                      {PROVIDERS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Expires
                    <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                  </label>
                </>
              ) : null}
              {kind === 'password' ? (
                <label>
                  Username
                  <input value={username} onChange={(e) => setUsername(e.target.value)} />
                </label>
              ) : null}
              {kind === 'ssh_key' ? (
                <>
                  <label>
                    Public Key
                    <input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} />
                  </label>
                  <label>
                    Passphrase
                    <input value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
                  </label>
                </>
              ) : null}
              <label>
                {kind === 'api_key' ? 'API Key' : kind === 'env' ? 'KEY=VALUE' : 'secret'}
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder={
                    kind === 'api_key'
                      ? PROVIDERS.find((p) => p.id === provider)?.placeholder
                      : kind === 'env'
                        ? 'DATABASE_URL=postgres://localhost/myapp'
                        : undefined
                  }
                  data-testid="keyshield-secret"
                />
              </label>
              <button type="button" className="ks-text" onClick={() => setShowSecret((v) => !v)}>
                {showSecret ? 'hide' : 'show'}
              </button>
              <button type="submit" data-testid="keyshield-add">
                Save Secret
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
