/**
 * Public KeyShield ciphertext store.
 * Separate from owner passkeys (`lib/passkey/store.ts`).
 * Redis when UPSTASH_* is set; otherwise memory + local file.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getVisitorRedis } from '../visitorMemory';
import { KS_MAX_ENTRIES } from './constants';
import type { KsPasskey, KsVaultDoc } from './types';

export type { KsPasskey, KsVaultDoc, KsVaultEntry } from './types';

type Memory = {
  keys: Record<string, KsPasskey>;
  vaults: Record<string, KsVaultDoc>;
};

const g = globalThis as typeof globalThis & { __ksPublicStore?: Memory };

function memory(): Memory {
  if (!g.__ksPublicStore) g.__ksPublicStore = { keys: {}, vaults: {} };
  return g.__ksPublicStore;
}

function dir(): string {
  return join(process.cwd(), '.data', 'keyshield');
}

function keysPath(): string {
  return join(dir(), 'passkeys.json');
}

function vaultsPath(): string {
  return join(dir(), 'vaults.json');
}

function hydrate(): void {
  const mem = memory();
  if (Object.keys(mem.keys).length > 0 || Object.keys(mem.vaults).length > 0) return;
  try {
    if (existsSync(keysPath())) {
      const parsed = JSON.parse(readFileSync(keysPath(), 'utf8')) as Record<string, KsPasskey>;
      if (parsed && typeof parsed === 'object') mem.keys = parsed;
    }
    if (existsSync(vaultsPath())) {
      const parsed = JSON.parse(readFileSync(vaultsPath(), 'utf8')) as Record<string, KsVaultDoc>;
      if (parsed && typeof parsed === 'object') mem.vaults = parsed;
    }
  } catch {
    /* memory still works */
  }
}

function persist(): void {
  try {
    mkdirSync(dir(), { recursive: true });
    writeFileSync(keysPath(), JSON.stringify(memory().keys, null, 2));
    writeFileSync(vaultsPath(), JSON.stringify(memory().vaults, null, 2));
  } catch {
    /* memory still works */
  }
}

function passkeyRedisKey(id: string): string {
  return `ks:passkey:${id}`;
}

function vaultRedisKey(vaultId: string): string {
  return `ks:vault:${vaultId}`;
}

export async function getKsPasskey(id: string): Promise<KsPasskey | null> {
  hydrate();
  if (memory().keys[id]) return memory().keys[id];
  const redis = getVisitorRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<KsPasskey | string>(passkeyRedisKey(id));
    const parsed = typeof raw === 'string' ? (JSON.parse(raw) as KsPasskey) : raw;
    if (parsed?.id && parsed.vaultId) {
      memory().keys[id] = parsed;
      return parsed;
    }
  } catch {
    /* miss */
  }
  return null;
}

export async function putKsPasskey(key: KsPasskey): Promise<void> {
  hydrate();
  memory().keys[key.id] = key;
  persist();
  const redis = getVisitorRedis();
  if (!redis) return;
  try {
    await redis.set(passkeyRedisKey(key.id), key);
  } catch {
    /* this instance still has it */
  }
}

export async function getKsVault(vaultId: string): Promise<KsVaultDoc> {
  hydrate();
  if (memory().vaults[vaultId]) return memory().vaults[vaultId];
  const redis = getVisitorRedis();
  if (redis) {
    try {
      const raw = await redis.get<KsVaultDoc | string>(vaultRedisKey(vaultId));
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as KsVaultDoc) : raw;
      if (parsed?.vaultId && Array.isArray(parsed.entries)) {
        memory().vaults[vaultId] = parsed;
        return parsed;
      }
    } catch {
      /* empty vault */
    }
  }
  return { vaultId, entries: [], updatedAt: new Date().toISOString() };
}

export async function putKsVault(doc: KsVaultDoc): Promise<KsVaultDoc> {
  if (doc.entries.length > KS_MAX_ENTRIES) {
    throw new Error('vault full');
  }
  const next: KsVaultDoc = {
    vaultId: doc.vaultId,
    entries: doc.entries.slice(0, KS_MAX_ENTRIES),
    updatedAt: new Date().toISOString(),
  };
  hydrate();
  memory().vaults[doc.vaultId] = next;
  persist();
  const redis = getVisitorRedis();
  if (redis) {
    try {
      await redis.set(vaultRedisKey(doc.vaultId), next);
    } catch {
      /* this instance still has it */
    }
  }
  return next;
}
