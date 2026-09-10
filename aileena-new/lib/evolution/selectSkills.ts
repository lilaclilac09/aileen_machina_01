import type { ActiveSkill } from './activeSkills.generated';
import { ACTIVE_SKILLS } from './activeSkills.generated';
import type { SkillKind } from './types';

/** Anything with triggers can be matched — production snapshot or engine SkillPatch. */
export type SkillTriggerSource = {
  id: string;
  kind: SkillKind;
  triggers: string[];
};

/** Map visitor phrasing (especially Chinese) onto English skill triggers. */
export const QUESTION_ALIASES: Array<[RegExp, string]> = [
  [/邮箱|邮件/, ' email gmail'],
  [/微信|微信号/, ' wechat'],
  [/电话|手机号/, ' phone'],
  [/工资|薪资|年薪|薪水|多少钱/, ' salary compensation'],
  [/裁切|封面裁|玻璃台/, ' crop visual'],
  [/更新了吗|有什么新|最近更新|新文章/, " what's new latest content"],
  [/你就是|你是不是她|你是她/, ' are you aileen'],
  [/合作|招人|招聘|兼职|外包/, ' hire collaborate'],
];

export function searchHaystack(question: string): string {
  const q = question.toLowerCase();
  let extra = '';
  for (const [re, add] of QUESTION_ALIASES) {
    if (re.test(question) || re.test(q)) extra += add;
  }
  return `${q}${extra}`;
}

export function matchingSkills(
  question: string,
  opts?: { kind?: SkillKind; skills?: SkillTriggerSource[] },
): SkillTriggerSource[] {
  const hay = searchHaystack(question);
  if (!hay.trim()) return [];
  const kind = opts?.kind ?? 'site-agent';
  const pool = (opts?.skills ?? ACTIVE_SKILLS).filter((s) => s.kind === kind);
  return pool.filter((s) => s.triggers.some((t) => hay.includes(t.toLowerCase())));
}

export function formatHardRulesDigest(skills: ActiveSkill[] = ACTIVE_SKILLS): string {
  const site = skills.filter((s) => s.kind === 'site-agent');
  const never = [...new Set(site.flatMap((s) => s.mustNot))].filter(Boolean).slice(0, 20);
  const must = [...new Set(site.flatMap((s) => s.mustInclude))].filter(Boolean).slice(0, 8);
  return [
    '# Ratcheted hard rules (always on)',
    'These beat training memory even when no skill trigger matched.',
    never.length ? `Never invent or say: ${never.join('; ')}.` : '',
    must.length ? `When relevant, mention: ${must.join('; ')}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function formatMatchingSkills(question: string): string {
  const hits = matchingSkills(question)
    .map((h) => ACTIVE_SKILLS.find((s) => s.id === h.id))
    .filter((s): s is ActiveSkill => Boolean(s));
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

/** Public console: hard rules every turn + matching skill details when they fire. */
export function formatSkillsForTurn(question: string): string {
  const digest = formatHardRulesDigest();
  const matched = formatMatchingSkills(question);
  return matched ? `${digest}\n\n${matched}` : digest;
}

export function uncoveredBankPrompts(
  prompts: Array<{ id: string; prompt: string }>,
  skills: SkillTriggerSource[] = ACTIVE_SKILLS,
): string[] {
  return prompts
    .filter((p) => matchingSkills(p.prompt, { skills }).length === 0)
    .map((p) => p.id);
}
