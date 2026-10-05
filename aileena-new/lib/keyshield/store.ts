/**
 * Public KeyShield ciphertext store.
 * Separate from owner passkeys (`lib/passkey/store.ts`).
 * Redis when UPSTASH_* is set; otherwise memory + local file.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getVisitorRedis } from '../visitorMemory';
import { KS_MAX_AGENTS, KS_MAX_ENTRIES, KS_MAX_SESSIONS, KS_MAX_TRUST } from './constants';
import type { KsAgent, KsAuthSession, KsPasskey, KsShareGrant, KsTrustDomain, KsVaultDoc } from './types';

export type { KsPasskey, KsVaultDoc, KsVaultEntry } from './types';

type Memory = {
  keys: Record<string, KsPasskey>;
  vaults: Record<string, KsVaultDoc>;
  sessions: Record<string, KsAuthSession>;
  agents: Record<string, KsAgent[]>;
  shares: Record<string, KsShareGrant[]>;
  trust: Record<string, KsTrustDomain[]>;
};

const g = globalThis as typeof globalThis & { __ksPublicStore?: Memory };

function memory(): Memory {
  if (!g.__ksPublicStore) {
    g.__ksPublicStore = { keys: {}, vaults: {}, sessions: {}, agents: {}, shares: {}, trust: {} };
  }
  const mem = g.__ksPublicStore;
  mem.sessions ||= {};
  mem.agents ||= {};
  mem.shares ||= {};
  mem.trust ||= {};
  return mem;
}

function dir(): string {
  return join(process.cwd(), '.data', 'keyshield');
}

function pathOf(name: string): string {
  return join(dir(), name);
}

function readJson<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback;
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as T;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function hydrate(): void {
  const mem = memory();
  if (
    Object.keys(mem.keys).length > 0 ||
    Object.keys(mem.vaults).length > 0 ||
    Object.keys(mem.sessions).length > 0
  ) {
    return;
  }
  mem.keys = readJson(pathOf('passkeys.json'), {});
  mem.vaults = readJson(pathOf('vaults.json'), {});
  mem.sessions = readJson(pathOf('sessions.json'), {});
  mem.agents = readJson(pathOf('agents.json'), {});
  mem.shares = readJson(pathOf('shares.json'), {});
  mem.trust = readJson(pathOf('trust.json'), {});
}

function persist(): void {
  try {
    mkdirSync(dir(), { recursive: true });
    const mem = memory();
    writeFileSync(pathOf('passkeys.json'), JSON.stringify(mem.keys, null, 2));
    writeFileSync(pathOf('vaults.json'), JSON.stringify(mem.vaults, null, 2));
    writeFileSync(pathOf('sessions.json'), JSON.stringify(mem.sessions, null, 2));
    writeFileSync(pathOf('agents.json'), JSON.stringify(mem.agents, null, 2));
    writeFileSync(pathOf('shares.json'), JSON.stringify(mem.shares, null, 2));
    writeFileSync(pathOf('trust.json'), JSON.stringify(mem.trust, null, 2));
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

function sessionRedisKey(id: string): string {
  return `ks:session:${id}`;
}

function agentsRedisKey(vaultId: string): string {
  return `ks:agents:${vaultId}`;
}

function sharesRedisKey(vaultId: string): string {
  return `ks:shares:${vaultId}`;
}

function trustRedisKey(vaultId: string): string {
  return `ks:trust:${vaultId}`;
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

export async function deleteKsPasskey(id: string): Promise<void> {
  hydrate();
  delete memory().keys[id];
  persist();
  const redis = getVisitorRedis();
  if (!redis) return;
  try {
    await redis.del(passkeyRedisKey(id));
  } catch {
    /* gone locally */
  }
}

export async function listKsPasskeysByVault(vaultId: string): Promise<KsPasskey[]> {
  hydrate();
  return Object.values(memory().keys).filter((k) => k.vaultId === vaultId);
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

export async function putKsAuthSession(row: KsAuthSession): Promise<KsAuthSession> {
  hydrate();
  const mem = memory();
  const existing = Object.values(mem.sessions).filter((s) => s.vaultId === row.vaultId && !s.revoked);
  if (existing.length >= KS_MAX_SESSIONS) {
    const oldest = existing.sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (oldest) mem.sessions[oldest.id] = { ...oldest, revoked: true };
  }
  mem.sessions[row.id] = row;
  persist();
  const redis = getVisitorRedis();
  if (redis) {
    try {
      await redis.set(sessionRedisKey(row.id), row);
    } catch {
      /* local */
    }
  }
  return row;
}

export async function getKsAuthSession(id: string): Promise<KsAuthSession | null> {
  hydrate();
  if (memory().sessions[id]) return memory().sessions[id];
  const redis = getVisitorRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<KsAuthSession | string>(sessionRedisKey(id));
    const parsed = typeof raw === 'string' ? (JSON.parse(raw) as KsAuthSession) : raw;
    if (parsed?.id && parsed.vaultId) {
      memory().sessions[id] = parsed;
      return parsed;
    }
  } catch {
    /* miss */
  }
  return null;
}

export async function listKsAuthSessions(vaultId: string): Promise<KsAuthSession[]> {
  hydrate();
  return Object.values(memory().sessions)
    .filter((s) => s.vaultId === vaultId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function revokeKsAuthSession(id: string, vaultId: string): Promise<boolean> {
  const row = await getKsAuthSession(id);
  if (!row || row.vaultId !== vaultId) return false;
  const next = { ...row, revoked: true };
  hydrate();
  memory().sessions[id] = next;
  persist();
  const redis = getVisitorRedis();
  if (redis) {
    try {
      await redis.set(sessionRedisKey(id), next);
    } catch {
      /* local */
    }
  }
  return true;
}

export async function listKsAgents(vaultId: string): Promise<KsAgent[]> {
  hydrate();
  if (memory().agents[vaultId]) return memory().agents[vaultId];
  const redis = getVisitorRedis();
  if (redis) {
    try {
      const raw = await redis.get<KsAgent[] | string>(agentsRedisKey(vaultId));
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as KsAgent[]) : raw;
      if (Array.isArray(parsed)) {
        memory().agents[vaultId] = parsed;
        return parsed;
      }
    } catch {
      /* empty */
    }
  }
  return [];
}

export async function putKsAgents(vaultId: string, agents: KsAgent[]): Promise<KsAgent[]> {
  if (agents.length > KS_MAX_AGENTS) throw new Error('full');
  hydrate();
  memory().agents[vaultId] = agents;
  persist();
  const redis = getVisitorRedis();
  if (redis) {
    try {
      await redis.set(agentsRedisKey(vaultId), agents);
    } catch {
      /* local */
    }
  }
  return agents;
}

export async function listKsShares(vaultId: string): Promise<KsShareGrant[]> {
  hydrate();
  if (memory().shares[vaultId]) return memory().shares[vaultId];
  const redis = getVisitorRedis();
  if (redis) {
    try {
      const raw = await redis.get<KsShareGrant[] | string>(sharesRedisKey(vaultId));
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as KsShareGrant[]) : raw;
      if (Array.isArray(parsed)) {
        memory().shares[vaultId] = parsed;
        return parsed;
      }
    } catch {
      /* empty */
    }
  }
  return [];
}

export async function putKsShares(vaultId: string, shares: KsShareGrant[]): Promise<KsShareGrant[]> {
  hydrate();
  memory().shares[vaultId] = shares.slice(0, 40);
  persist();
  const redis = getVisitorRedis();
  if (redis) {
    try {
      await redis.set(sharesRedisKey(vaultId), memory().shares[vaultId]);
    } catch {
      /* local */
    }
  }
  return memory().shares[vaultId];
}

export async function listKsTrust(vaultId: string): Promise<KsTrustDomain[]> {
  hydrate();
  if (memory().trust[vaultId]) return memory().trust[vaultId];
  const redis = getVisitorRedis();
  if (redis) {
    try {
      const raw = await redis.get<KsTrustDomain[] | string>(trustRedisKey(vaultId));
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as KsTrustDomain[]) : raw;
      if (Array.isArray(parsed)) {
        memory().trust[vaultId] = parsed;
        return parsed;
      }
    } catch {
      /* empty */
    }
  }
  return [];
}

export async function putKsTrust(vaultId: string, trust: KsTrustDomain[]): Promise<KsTrustDomain[]> {
  if (trust.length > KS_MAX_TRUST) throw new Error('full');
  hydrate();
  memory().trust[vaultId] = trust;
  persist();
  const redis = getVisitorRedis();
  if (redis) {
    try {
      await redis.set(trustRedisKey(vaultId), trust);
    } catch {
      /* local */
    }
  }
  return trust;
}
