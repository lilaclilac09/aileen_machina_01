import { rmSync } from 'node:fs';
import { join } from 'node:path';
import type { EvalReport, RatchetDecision, SkillPatch } from '../types';
import { loadLedger, loadProductionSkills, writeSkill, appendLedger } from './bank';
import { evolutionPaths } from './paths';
import { heldOutRate, passingHeldOutIds } from './verify';

/**
 * Ratchet: promote only if held-out pass rate strictly increases
 * and no previously-passing held-out task newly fails.
 */
export function decideRatchet(opts: {
  candidate: SkillPatch;
  baseline: EvalReport;
  candidateEval: EvalReport;
}): RatchetDecision {
  const before = heldOutRate(opts.baseline);
  const after = heldOutRate(opts.candidateEval);
  const id = opts.candidate.id;
  if (opts.candidateEval.verifierMutated) {
    return { promote: false, reason: 'verifier mutated during eval', candidateId: id, before, after };
  }
  if (opts.candidateEval.scores.some((s) => s.solver.hackAttempt)) {
    return { promote: false, reason: 'solver hack attempt', candidateId: id, before, after };
  }
  const prevPass = passingHeldOutIds(opts.baseline);
  const nextPass = passingHeldOutIds(opts.candidateEval);
  const regressions = [...prevPass].filter((t) => !nextPass.has(t));
  if (regressions.length > 0) {
    return {
      promote: false,
      reason: `held-out regression: ${regressions.join(', ')}`,
      candidateId: id,
      before,
      after,
    };
  }
  if (after <= before) {
    return {
      promote: false,
      reason: `held-out rate ${after.toFixed(3)} did not beat ${before.toFixed(3)}`,
      candidateId: id,
      before,
      after,
    };
  }
  return {
    promote: true,
    reason: `held-out ${before.toFixed(3)} → ${after.toFixed(3)}`,
    candidateId: id,
    before,
    after,
  };
}

export function promoteSkill(skill: SkillPatch, decision: RatchetDecision, root?: string) {
  if (!decision.promote) throw new Error('promoteSkill called on reject');
  const p = evolutionPaths(root);
  writeSkill(p.skills, skill);
  const staging = join(p.staging, skill.id);
  rmSync(staging, { recursive: true, force: true });
  appendLedger(
    {
      at: new Date().toISOString(),
      action: 'promote',
      skillId: skill.id,
      version: skill.version,
      heldOutBefore: decision.before,
      heldOutAfter: decision.after,
      reason: decision.reason,
    },
    root,
  );
}

export function rejectSkill(skill: SkillPatch, decision: RatchetDecision, root?: string) {
  appendLedger(
    {
      at: new Date().toISOString(),
      action: 'reject',
      skillId: skill.id,
      version: skill.version,
      heldOutBefore: decision.before,
      heldOutAfter: decision.after,
      reason: decision.reason,
    },
    root,
  );
}

export function rollbackSkill(skillId: string, toVersion: number, root?: string): SkillPatch {
  const skills = loadProductionSkills(root);
  const current = skills.find((s) => s.id === skillId);
  if (!current) throw new Error(`rollback: missing ${skillId}`);
  if (toVersion >= current.version) throw new Error('rollback: target must be older');
  const ledger = loadLedger(root);
  const hit = [...ledger].reverse().find(
    (e) => e.skillId === skillId && e.version === toVersion && e.action === 'promote',
  );
  const rolled: SkillPatch = { ...current, version: toVersion, parent: current.version };
  // Keep body/triggers of current but stamp the rollback version; callers that
  // stored historical SKILL.md snapshots should pass them. Ledger is the gate.
  if (!hit) {
    rolled.rootCause = `rollback to v${toVersion} (no promote snapshot; version stamp only)`;
  }
  writeSkill(evolutionPaths(root).skills, rolled);
  appendLedger(
    {
      at: new Date().toISOString(),
      action: 'rollback',
      skillId,
      version: toVersion,
      heldOutBefore: current.version,
      heldOutAfter: toVersion,
      reason: `rollback ${skillId} v${current.version} → v${toVersion}`,
    },
    root,
  );
  return rolled;
}
