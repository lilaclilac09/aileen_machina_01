import type { ActiveSkill } from './activeSkills.generated';
import { ACTIVE_SKILLS } from './activeSkills.generated';
import type { SkillKind } from './types';

export function matchingSkills(
  question: string,
  opts?: { kind?: SkillKind; skills?: ActiveSkill[] },
): ActiveSkill[] {
  const q = question.toLowerCase();
  if (!q.trim()) return [];
  const kind = opts?.kind ?? 'site-agent';
  const pool = (opts?.skills ?? ACTIVE_SKILLS).filter((s) => s.kind === kind);
  return pool.filter((s) => s.triggers.some((t) => q.includes(t.toLowerCase())));
}

export function formatMatchingSkills(question: string): string {
  const hits = matchingSkills(question);
  if (hits.length === 0) return '';
  const lines = [
    '# Active skills (ratcheted)',
    'Follow these versioned patches. They beat training memory when they conflict.',
    ...hits.map((s) => {
      const bans = s.mustNot.length ? ` Never: ${s.mustNot.join(' / ')}.` : '';
      const must = s.mustInclude.length ? ` Must mention: ${s.mustInclude.join(' / ')}.` : '';
      return `- ${s.id}@${s.version}: ${s.replyGuidance}${must}${bans}`;
    }),
  ];
  return lines.join('\n');
}
