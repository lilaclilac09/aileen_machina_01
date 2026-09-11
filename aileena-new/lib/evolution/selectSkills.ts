import type { ActiveSkill } from './activeSkills.generated';
import { ACTIVE_SKILLS } from './activeSkills.generated';
import type { SkillKind } from './types';

/** Anything with triggers can be matched — production snapshot or engine SkillPatch. */
export type SkillTriggerSource = {
  id: string;
  kind: SkillKind;
  triggers: string[];
};

/**
 * Auto-skill tokenization leftover. Matching these alone fires the wrong skill
 * ("I have a meeting this week" ≠ latest content).
 */
export const TRIGGER_NOISE = new Set([
  'anything',
  'week',
  'this week',
  'ship',
  'send',
  'cover',
  'object',
  'glass',
  'bench',
  'photos',
  'private',
  'personal',
  'engineering',
  'season',
  'articles',
  'available',
  'phone',
]);

/** How-to Voice (not Voice → code). Shared by chat aliases, inbox classify, naive solver. */
export const VOICE_HOWTO_RE =
  /声音|语音|麦克风|use voice|turn on voice|how do i use voice|how to use (?:the )?voice|voice.{0,12}怎么用|怎么用.{0,8}voice|其他.{0,8}voice|the other voice|voice on (?:my |the )?phone|qitade|\bmic\b/i;

export function triggerMatches(haystack: string, trigger: string): boolean {
  const t = trigger.toLowerCase().trim();
  if (!t || TRIGGER_NOISE.has(t)) return false;
  if (t.length < 4 && !/[\u4e00-\u9fff]/.test(t)) return false;
  if (/[\u4e00-\u9fff]/.test(t)) return haystack.includes(t);
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`).test(haystack);
}

/** Map visitor phrasing (Chinese + English paraphrases) onto skill triggers. */
export const QUESTION_ALIASES: Array<[RegExp, string]> = [
  [/邮箱|邮件/, ' email gmail'],
  [/微信|微信号/, ' wechat'],
  [/电话|手机号/, ' phone'],
  [/工资|薪资|年薪|薪水|多少钱/, ' salary compensation'],
  [/裁切|封面裁|玻璃台/, ' crop visual'],
  [/更新了吗|有什么新|最近更新|新文章/, " what's new latest content"],
  [/你就是|你是不是她|你是她/, ' are you aileen'],
  [/合作|招人|招聘|兼职|外包/, ' hire collaborate'],
  [/\binbox\b/, ' email gmail'],
  [/\bpay\b|\bwages?\b|how much money|what does she make/, ' salary compensation'],
  [/any updates|posted lately|just dropped/, " what's new latest content"],
  [/you('re| are) her|speak as aileen|be aileen|pretend to be her/, ' are you aileen'],
  [/looking for work|work with her|is she available|available for/, ' hire collaborate'],
  [/fill the frame/, ' crop visual'],
  [/ship (recently|this week|on the site)|anything new ship|did anything new/, " what's new latest content"],
  [VOICE_HOWTO_RE, ' voice howto'],
  [/\bdj mixer\b|\/sound|混音/, ' dj mixer /sound'],
  [/code a patch|voice\s*→\s*code|voice\s*->\s*code|写代码|改代码|implement a patch|propose-only/, ' voice-code patch'],
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
  return pool.filter((s) => s.triggers.some((t) => triggerMatches(hay, t)));
}

export function formatHardRulesDigest(skills: ActiveSkill[] = ACTIVE_SKILLS): string {
  const site = skills.filter((s) => s.kind === 'site-agent');
  const never = [...new Set(site.flatMap((s) => s.mustNot))].filter(Boolean).slice(0, 20);
  return [
    '# Ratcheted hard rules (always on)',
    'These beat training memory even when no skill trigger matched.',
    never.length ? `Never invent or say: ${never.join('; ')}.` : '',
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

/** Negatives must match zero skills — false-positive gate. */
export function falsePositiveNegatives(
  negatives: Array<{ id: string; prompt: string }>,
  skills: SkillTriggerSource[] = ACTIVE_SKILLS,
): string[] {
  return negatives
    .filter((p) => matchingSkills(p.prompt, { skills }).length > 0)
    .map((p) => p.id);
}
