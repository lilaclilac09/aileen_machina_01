import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { LedgerEntry, SkillPatch, TaskPrompt, TaskVerifier } from '../types';
import { evolutionPaths } from './paths';
import { parseSkillMarkdown, serializeSkillMarkdown } from './parseSkill';
import { sha256 } from './fingerprint';

export function ensureEvolutionDirs(root?: string) {
  const p = evolutionPaths(root);
  mkdirSync(p.skills, { recursive: true });
  mkdirSync(p.staging, { recursive: true });
  mkdirSync(join(p.root, 'bank'), { recursive: true });
  mkdirSync(join(p.root, 'trajectories'), { recursive: true });
  mkdirSync(join(p.root, 'generated-tasks'), { recursive: true });
  mkdirSync(join(p.root, 'inbox'), { recursive: true });
  if (!existsSync(p.prompts)) writeFileSync(p.prompts, '[]\n');
  if (!existsSync(p.verifiers)) {
    writeFileSync(p.verifiers, JSON.stringify({ canary: 'EVOLVE_CANARY_DO_NOT_EMIT', tasks: [] }, null, 2) + '\n');
  }
  if (!existsSync(p.ledger)) writeFileSync(p.ledger, '[]\n');
  if (!existsSync(p.generated)) writeFileSync(p.generated, '[]\n');
  if (!existsSync(p.negatives)) writeFileSync(p.negatives, '[]\n');
  return p;
}

export function loadJson<T>(file: string, fallback: T): T {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function readSkillsInDir(dir: string): SkillPatch[] {
  if (!existsSync(dir)) return [];
  const out: SkillPatch[] = [];
  for (const name of readdirSync(dir)) {
    const skillFile = join(dir, name, 'SKILL.md');
    const flat = join(dir, name);
    const file = existsSync(skillFile) ? skillFile : name.endsWith('.md') ? flat : '';
    if (!file || !existsSync(file)) continue;
    out.push(parseSkillMarkdown(readFileSync(file, 'utf8')));
  }
  return out.sort((a, b) => a.id.localeCompare(b.id) || a.version - b.version);
}

export function loadProductionSkills(root?: string): SkillPatch[] {
  return readSkillsInDir(evolutionPaths(root).skills);
}

export function loadStagingSkills(root?: string): SkillPatch[] {
  return readSkillsInDir(evolutionPaths(root).staging);
}

export function loadNegatives(root?: string): Array<{ id: string; prompt: string }> {
  return loadJson(evolutionPaths(root).negatives, []);
}

export function loadPrompts(root?: string): TaskPrompt[] {
  const p = evolutionPaths(root);
  const base = loadJson<TaskPrompt[]>(p.prompts, []);
  const extra = loadJson<TaskPrompt[]>(p.generated, []);
  const seen = new Set(base.map((t) => t.id));
  return [...base, ...extra.filter((t) => !seen.has(t.id))];
}

export type VerifierFile = {
  canary: string;
  tasks: TaskVerifier[];
};

export function parseVerifierFile(raw: string): VerifierFile {
  const parsed = JSON.parse(raw) as VerifierFile | TaskVerifier[];
  if (Array.isArray(parsed)) return { canary: 'EVOLVE_CANARY_DO_NOT_EMIT', tasks: parsed };
  return {
    canary: typeof parsed.canary === 'string' ? parsed.canary : 'EVOLVE_CANARY_DO_NOT_EMIT',
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
  };
}

export function loadVerifiers(root?: string): { list: TaskVerifier[]; raw: string; hash: string; canary: string } {
  const file = evolutionPaths(root).verifiers;
  const raw = existsSync(file) ? readFileSync(file, 'utf8') : '{"canary":"EVOLVE_CANARY_DO_NOT_EMIT","tasks":[]}';
  const parsed = parseVerifierFile(raw);
  return { list: parsed.tasks, raw, hash: sha256(raw), canary: parsed.canary };
}

export function verifierMap(list: TaskVerifier[]): Map<string, TaskVerifier> {
  return new Map(list.map((v) => [v.id, v]));
}

export function writeSkill(dir: string, skill: SkillPatch) {
  const destDir = join(dir, skill.id);
  mkdirSync(destDir, { recursive: true });
  writeFileSync(join(destDir, 'SKILL.md'), serializeSkillMarkdown(skill));
}

export function loadLedger(root?: string): LedgerEntry[] {
  return loadJson<LedgerEntry[]>(evolutionPaths(root).ledger, []);
}

export function appendLedger(entry: LedgerEntry, root?: string) {
  const p = evolutionPaths(root);
  const prev = loadLedger(root);
  prev.push(entry);
  writeFileSync(p.ledger, JSON.stringify(prev, null, 2) + '\n');
}
