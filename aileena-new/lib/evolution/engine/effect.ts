import { writeFileSync } from 'node:fs';
import { naiveSolve, skillSolve } from './solve';
import { loadProductionSkills, loadPrompts } from './bank';
import { evaluateSkills } from './verify';
import { evolutionPaths } from './paths';
import { matchingSkills } from '../selectSkills';

export type EffectRow = {
  id: string;
  split: string;
  prompt: string;
  naive: string;
  skilled: string;
  skills: string[];
  pass: boolean;
};

/** Naive vs skilled reply for every live bank prompt — the visitor-facing effect. */
export function effectRows(root?: string): EffectRow[] {
  const skills = loadProductionSkills(root);
  const prompts = loadPrompts(root);
  const report = evaluateSkills({ root, skills, mode: 'in-process' });
  const passBy = new Map(report.scores.map((s) => [s.taskId, s.pass]));
  return prompts.map((p) => {
    const naive = naiveSolve(p.prompt);
    const skilled = skillSolve(p.prompt, skills);
    return {
      id: p.id,
      split: p.split,
      prompt: p.prompt,
      naive,
      skilled: skilled.reply,
      skills: matchingSkills(p.prompt, { skills }).map((s) => s.id),
      pass: passBy.get(p.id) === true,
    };
  });
}

export function formatEffectMarkdown(rows: EffectRow[]): string {
  const lines = [
    '# Site-agent effect sheet',
    '',
    'Naive policy (wrong) vs ratcheted skills (what chat is told to do).',
    'Regenerate: `pnpm evolve:effect`.',
    '',
    `| id | split | visitor | naive (wrong) | skilled | skills | pass |`,
    `| --- | --- | --- | --- | --- | --- | --- |`,
  ];
  for (const r of rows) {
    const cell = (s: string) => s.replace(/\|/g, '/').replace(/\n/g, ' ').slice(0, 140);
    lines.push(
      `| ${r.id} | ${r.split} | ${cell(r.prompt)} | ${cell(r.naive)} | ${cell(r.skilled)} | ${r.skills.join(', ') || '—'} | ${r.pass ? 'yes' : 'NO'} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

export function writeEffectSheet(root?: string): { path: string; rows: EffectRow[] } {
  const rows = effectRows(root);
  const dest = `${evolutionPaths(root).root}/EFFECT.md`;
  writeFileSync(dest, formatEffectMarkdown(rows));
  return { path: dest, rows };
}
