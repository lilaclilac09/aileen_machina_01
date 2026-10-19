/**
 * P1.7 real-agent replay gate for evolution PRs.
 *
 * Replays bank prompts that the CHANGED skills trigger on (plus every
 * held-out prompt as a regression guard) through a running build of the real
 * chat route (`next start` with the candidate skills compiled in) and scores
 * the real model replies with the bank verifiers. The offline ratchet only
 * proves the rule solver improved; this proves the live agent still answers.
 *
 * Usage:
 *   tsx scripts/evolve-replay.ts --base http://localhost:3000 --changed-from origin/main --out /tmp/replay.json
 * Exit 0 = all replayed tasks pass, 1 = a regression, 2 = could not run.
 * Traces are tagged harness-replay-*, so replays never feed the live inbox.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { loadPrompts, loadVerifiers, verifierMap } from '../lib/evolution/engine/bank';
import { scoreReply } from '../lib/evolution/engine/verify';
import { matchingSkills } from '../lib/evolution/selectSkills';
import { ACTIVE_SKILLS } from '../lib/evolution/activeSkills.generated';
import { collectUiStreamText } from '../lib/agentMcp/server';
import type { TaskPrompt } from '../lib/evolution/types';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const base = arg('base', 'http://localhost:3000').replace(/\/$/, '');
const changedFrom = arg('changed-from', 'origin/main');
const out = arg('out', '/tmp/evolve-replay.json');
const max = Number(arg('max', '14'));

function changedSkillIds(): string[] {
  try {
    const files = execFileSync('git', ['diff', '--name-only', changedFrom, '--', '../ops/evolution/skills'], { encoding: 'utf8' });
    return [...new Set(files.split('\n').map((f) => f.match(/ops\/evolution\/skills\/([^/]+)\/SKILL\.md$/)?.[1]).filter(Boolean) as string[])];
  } catch {
    return [];
  }
}

async function ask(prompt: string, id: string): Promise<{ status: number; reply: string }> {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-trace-id': `harness-replay-${id}` },
    body: JSON.stringify({ agentMode: 'public', messages: [{ id: `replay-${id}`, role: 'user', parts: [{ type: 'text', text: prompt }] }] }),
  });
  if (!res.ok) return { status: res.status, reply: await res.text().catch(() => '') };
  return { status: res.status, reply: await collectUiStreamText(res) };
}

async function main() {
  const changed = changedSkillIds();
  const changedSkills = ACTIVE_SKILLS.filter((s) => changed.includes(s.id));
  const prompts = loadPrompts();
  const verifiers = verifierMap(loadVerifiers().list);

  const picked = new Map<string, TaskPrompt>();
  for (const p of prompts) if (changedSkills.length && matchingSkills(p.prompt, { skills: changedSkills }).length) picked.set(p.id, p);
  for (const p of prompts) if (p.split === 'held-out') picked.set(p.id, p);
  const tasks = [...picked.values()].filter((p) => verifiers.has(p.id)).slice(0, max);

  const rows: Array<{ id: string; split: string; status: number; failed: string[]; ms: number; reply: string }> = [];
  const started = Date.now();
  for (const t of tasks) {
    const t0 = Date.now();
    try {
      const r = await ask(t.prompt, t.id);
      const failed = r.status === 200 ? scoreReply(r.reply.toLowerCase(), verifiers.get(t.id)!) : [`http_${r.status}`];
      rows.push({ id: t.id, split: t.split, status: r.status, failed, ms: Date.now() - t0, reply: r.reply.slice(0, 600) });
    } catch (err) {
      rows.push({ id: t.id, split: t.split, status: 0, failed: [`error: ${err instanceof Error ? err.message : String(err)}`], ms: Date.now() - t0, reply: '' });
    }
  }
  const unreachable = rows.length > 0 && rows.every((r) => r.status === 0 || r.status >= 500);
  const fails = rows.filter((r) => r.failed.length);
  const held = rows.filter((r) => r.split === 'held-out');
  const heldOut = { replayed: held.length, passed: held.filter((r) => !r.failed.length).length };
  const report = { base, changedFrom, changedSkills: changed, replayed: rows.length, passed: rows.length - fails.length, heldOut, elapsedMs: Date.now() - started, unreachable, rows };
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(`replay: ${report.passed}/${report.replayed} passed (changed skills: ${changed.join(', ') || 'none'})`);
  for (const f of fails) console.log(`FAIL ${f.id}: ${f.failed.join('; ')}`);
  if (unreachable || rows.length === 0) process.exit(2);
  process.exit(fails.length ? 1 : 0);
}
main().catch((e) => {
  console.error(e);
  process.exit(2);
});
