import { rmSync } from 'node:fs';
import { join } from 'node:path';
import type { EvalReport, RatchetDecision, SkillPatch } from '../types';
import { loadLedger, loadProductionSkills, writeSkill, appendLedger, snapshotSkill, loadSkillSnapshot } from './bank';
import { evolutionPaths } from './paths';
import { heldOutRate, passingHeldOutIds } from './verify';
import { triggerQualityIssue } from '../selectSkills';

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
  const badTriggers = opts.candidate.triggers
    .map((t) => ({ t, issue: triggerQualityIssue(t) }))
    .filter((x) => x.issue);
  if (badTriggers.length > 0) {
    return {
      promote: false,
      reason: `trigger quality: ${badTriggers.map((x) => `${x.t} (${x.issue})`).join(', ')}`,
      candidateId: id,
      before,
      after,
    };
  }
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
  // Revertible: snapshot the version being replaced and the new one.
  const previous = loadProductionSkills(root).find((s) => s.id === skill.id);
  if (previous) snapshotSkill(previous, root);
  snapshotSkill(skill, root);
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

/**
 * Revert a skill to an older promoted version. Restores the exact SKILL.md
 * snapshot when one exists (promotions since snapshots were added always have
 * one); otherwise stamps the version only and says so in the ledger.
 * toVersion 0 removes the skill entirely (revert a first promotion).
 */
export function rollbackSkill(skillId: string, toVersion: number, root?: string): SkillPatch | null {
  const skills = loadProductionSkills(root);
  const current = skills.find((s) => s.id === skillId);
  if (!current) throw new Error(`rollback: missing ${skillId}`);
  if (toVersion >= current.version) throw new Error('rollback: target must be older');
  snapshotSkill(current, root);
  const p = evolutionPaths(root);
  if (toVersion === 0) {
    rmSync(join(p.skills, skillId), { recursive: true, force: true });
    appendLedger(
      {
        at: new Date().toISOString(),
        action: 'rollback',
        skillId,
        version: 0,
        heldOutBefore: current.version,
        heldOutAfter: 0,
        reason: `rollback ${skillId} v${current.version} → removed`,
      },
      root,
    );
    return null;
  }
  const snap = loadSkillSnapshot(skillId, toVersion, root);
  const ledger = loadLedger(root);
  const hit = [...ledger].reverse().find(
    (e) => e.skillId === skillId && e.version === toVersion && e.action === 'promote',
  );
  const rolled: SkillPatch = snap
    ? { ...snap, parent: current.version }
    : { ...current, version: toVersion, parent: current.version };
  if (!snap) {
    rolled.rootCause = `rollback to v${toVersion} (no snapshot${hit ? '' : ', no promote entry'}; version stamp only)`;
  }
  writeSkill(p.skills, rolled);
  appendLedger(
    {
      at: new Date().toISOString(),
      action: 'rollback',
      skillId,
      version: toVersion,
      heldOutBefore: current.version,
      heldOutAfter: toVersion,
      reason: `rollback ${skillId} v${current.version} → v${toVersion}${snap ? ' (snapshot restored)' : ' (version stamp only)'}`,
    },
    root,
  );
  return rolled;
}
