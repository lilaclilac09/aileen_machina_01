import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export type StoredPasskey = {
  id: string;
  publicKeySpki: string;
  counter: number;
  /** HKDF(PRF, keyshield-prf-v1:vault-id). Server never stores PRF or AES key. */
  vaultId: string;
  /** AES-GCM envelope of aileena-owner-v1. Ciphertext only. */
  sealIv: string;
  sealCipher: string;
  createdAt: string;
};

type Memory = { keys: StoredPasskey[] };
const g = globalThis as typeof globalThis & { __aileenaPasskeys?: Memory };

function memory(): Memory {
  if (!g.__aileenaPasskeys) g.__aileenaPasskeys = { keys: [] };
  return g.__aileenaPasskeys;
}

function storePath(): string {
  return join(process.cwd(), '.data', 'computer-prototype', 'passkeys.json');
}

function persist(): void {
  try {
    mkdirSync(join(process.cwd(), '.data', 'computer-prototype'), { recursive: true });
    writeFileSync(storePath(), JSON.stringify(memory().keys, null, 2));
  } catch {
    /* memory still works */
  }
}

function hydrate(): void {
  if (memory().keys.length > 0) return;
  try {
    if (existsSync(storePath())) {
      const parsed = JSON.parse(readFileSync(storePath(), 'utf8')) as StoredPasskey[];
      if (Array.isArray(parsed)) {
        memory().keys = parsed.filter((k) => k?.id && k.vaultId && k.sealIv && k.sealCipher);
      }
    }
  } catch {
    /* ignore */
  }
}

export function listPasskeys(): StoredPasskey[] {
  hydrate();
  return memory().keys;
}

export function hasPasskeys(): boolean {
  return listPasskeys().length > 0;
}

export function getPasskey(id: string): StoredPasskey | null {
  return listPasskeys().find((k) => k.id === id) ?? null;
}

export function upsertPasskey(key: StoredPasskey): StoredPasskey {
  hydrate();
  const keys = memory().keys.filter((k) => k.id !== key.id);
  keys.push(key);
  memory().keys = keys;
  persist();
  return key;
}
