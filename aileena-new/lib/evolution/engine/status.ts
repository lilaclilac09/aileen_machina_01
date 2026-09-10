import type { EvalReport } from '../types';
import { uncoveredBankPrompts } from '../selectSkills';
import { loadProductionSkills, loadPrompts } from './bank';
import { evaluateSkills } from './verify';

export type EvolutionStatus = {
  clean: boolean;
  line: string;
  heldOutPassed: number;
  heldOutTotal: number;
  trainPassed: number;
  trainTotal: number;
  uncovered: string[];
  fails: Array<{ id: string; split: string }>;
  report: EvalReport;
};

/** One-line gate for daily agent work. Dirty if any split fails or a bank prompt matches no skill. */
export function evolutionStatus(root?: string): EvolutionStatus {
  const skills = loadProductionSkills(root);
  const report = evaluateSkills({
    root,
    skills,
    mode: 'in-process',
  });
  const uncovered = uncoveredBankPrompts(loadPrompts(root), skills);
  const fails = report.scores.filter((s) => !s.pass).map((s) => ({ id: s.taskId, split: s.split }));
  const clean =
    report.heldOutTotal > 0 &&
    report.heldOutPassed === report.heldOutTotal &&
    report.trainPassed === report.trainTotal &&
    uncovered.length === 0;
  const uncoveredBit = uncovered.length ? ` uncovered:${uncovered.join(',')}` : '';
  const failBit = fails.length ? ` fails:${fails.map((f) => f.id).join(',')}` : '';
  const line = `${clean ? 'OK' : 'DIRTY'} held-out ${report.heldOutPassed}/${report.heldOutTotal} train ${report.trainPassed}/${report.trainTotal}${uncoveredBit}${failBit}`;
  return {
    clean,
    line,
    heldOutPassed: report.heldOutPassed,
    heldOutTotal: report.heldOutTotal,
    trainPassed: report.trainPassed,
    trainTotal: report.trainTotal,
    uncovered,
    fails,
    report,
  };
}
