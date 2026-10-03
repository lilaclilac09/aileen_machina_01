import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getVisitorRedis } from '../visitorMemory';

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

const REDIS_KEY = 'owner:passkeys:v1';

function storePath(): string {
  return join(process.cwd(), '.data', 'computer-prototype', 'passkeys.json');
}

function keep(rows: StoredPasskey[]): StoredPasskey[] {
  return rows.filter((k) => k?.id && k.vaultId && k.sealIv && k.sealCipher && k.publicKeySpki);
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
      if (Array.isArray(parsed)) memory().keys = keep(parsed);
    }
  } catch {
    /* ignore */
  }
}

/** File first, then Redis. Production disk does not keep a passkey across instances. */
export async function loadPasskeys(): Promise<void> {
  hydrate();
  if (memory().keys.length > 0) return;
  const redis = getVisitorRedis();
  if (!redis) return;
  try {
    const raw = await redis.get<StoredPasskey[] | string>(REDIS_KEY);
    const parsed = typeof raw === 'string' ? (JSON.parse(raw) as StoredPasskey[]) : raw;
    if (Array.isArray(parsed)) memory().keys = keep(parsed);
  } catch {
    /* unlock can still use the admin password */
  }
}

export async function savePasskeys(): Promise<void> {
  persist();
  const redis = getVisitorRedis();
  if (!redis) return;
  try {
    await redis.set(REDIS_KEY, memory().keys);
  } catch {
    /* this instance still has them in memory */
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
