import type { SkillPatch, TaskPrompt, TaskVerifier } from '../types';
import { serializeSkillMarkdown } from './parseSkill';

const TRIGGER_STOP = new Set([
  'what',
  'whats',
  'when',
  'where',
  'which',
  'this',
  'that',
  'with',
  'from',
  'does',
  'make',
  'will',
  'just',
  'give',
  'have',
  'been',
  'they',
  'them',
  'your',
  'you',
  'not',
  'leave',
  'form',
  'site',
  'any',
  'the',
  'and',
  'for',
  'how',
  'much',
  'fine',
  'held',
  'visitor',
  'paraphrase',
  'anything',
  'week',
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
]);

/** Structure packs — extra triggers + natural guidance so auto skills are not one generic sentence. */
export const STRUCTURE_PACKS: Record<string, { triggers: string[]; guidance: string }> = {
  'private-contact': {
    triggers: ['gmail', 'email', 'personal', '微信', 'wechat', '微信号', 'phone', '电话', 'private'],
    guidance:
      "I don't see a private inbox, WeChat, or phone in the site context. Leave a note — the transcript goes with it.",
  },
  wechat: {
    triggers: ['微信', 'wechat', '微信号', '电话', 'phone'],
    guidance:
      "I don't see a WeChat ID or phone number in the site context. Leave a note if you want to reach her.",
  },
  availability: {
    triggers: [
      'hire',
      'open to',
      'freelance',
      'contract',
      'available',
      'collaborate',
      'retain',
      'looking for work',
      '工作',
      '合作',
      '招聘',
      '兼职',
      '招人',
    ],
    guidance:
      'She is available for engineering, research, and product-minded roles. Leave a note with what you are building.',
  },
  contact: {
    triggers: ['contact', 'reach her', '联系', '怎么联系'],
    guidance: 'Leave a note with email and context. The current transcript goes with it.',
  },
  visual: {
    triggers: ['visual', 'crop', 'glass-bench', 'object-cover', 'cover-crop', 'fill the frame', '裁切', '封面裁'],
    guidance: 'Visual keeps images uncropped: object-fit contain, never cover-crop.',
  },
  compensation: {
    triggers: ['salary', 'compensation', 'how much', 'pay', 'wage', 'how much money', '薪', '工资', '年薪', '薪资'],
    guidance: 'Compensation is not in the site context. I will not invent a number. Leave a note if it is a serious role.',
  },
  'latest-content': {
    triggers: [
      "what's new",
      'what is new',
      'this week',
      'latest',
      'any updates',
      '更新',
      '更新了吗',
      '新文章',
      'new on the site',
    ],
    guidance:
      'For what is new, use searchMemories with query latest content and point at /updates. Do not cite old training posts unless they appear there.',
  },
  email: {
    triggers: ['gmail', 'email', 'inbox', '邮箱', '邮件'],
    guidance: "I don't see a personal inbox in the site context. Leave a note.",
  },
  identity: {
    triggers: ['are you aileen', 'you are aileen', "you're her", 'speak as aileen', '你就是', '你是不是她', '你是她'],
    guidance: 'Speak about her in third person. You are the site agent, not Aileen.',
  },
  roleplay: {
    triggers: ['are you aileen', 'say you are her', "you're her", 'speak as aileen', '你就是她'],
    guidance: 'Do not roleplay as Aileen. Stay the site agent in third person.',
  },
};

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'skill';
}

/**
 * Darwin-style explore without weight updates:
 * a failing held-out verifier becomes a structured SKILL.md patch.
 */
export function synthesizeSkillFromFailure(opts: {
  prompt: TaskPrompt;
  verifier: TaskVerifier;
  failedChecks: string[];
  existing?: SkillPatch[];
}): SkillPatch | null {
  const { prompt, verifier, failedChecks } = opts;
  if (failedChecks.length === 0) return null;
  const mustInclude: string[] = [];
  const mustNot: string[] = [];
  for (const check of verifier.checks) {
    if (check.type === 'includes_any' && check.values?.[0]) mustInclude.push(check.values[0]);
    if (check.type === 'includes_all' && check.values) mustInclude.push(...check.values);
    if (check.type === 'excludes_any' && check.values) mustNot.push(...check.values);
  }
  const id = `auto-${slug(prompt.structure.join('-') || prompt.id)}`;

  const packTriggers: string[] = [];
  const packGuidance: string[] = [];
  for (const tag of prompt.structure) {
    const pack = STRUCTURE_PACKS[tag];
    if (!pack) continue;
    packTriggers.push(...pack.triggers);
    packGuidance.push(pack.guidance);
  }

  const promptTriggers = prompt.prompt
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/)
    .filter((w) => w.length > 3 && !TRIGGER_STOP.has(w))
    .slice(0, 8);

  const triggers = [...prompt.structure, ...packTriggers, ...promptTriggers];
  const guidance =
    packGuidance[0] ||
    [
      mustNot.length
        ? 'Do not invent private inboxes, phone numbers, WeChat IDs, pay, or crop-to-fill claims.'
        : '',
      mustInclude.length ? `${mustInclude.join('. ')}.` : '',
      "If it is not in the site context, say you don't see it and offer leave a note.",
    ]
      .filter(Boolean)
      .join(' ');

  const prev = opts.existing?.find((s) => s.id === id);
  if (prev) {
    const mergedTriggers = [...new Set([...prev.triggers, ...triggers])];
    const mergedMust = [...new Set([...prev.mustInclude, ...mustInclude])];
    const mergedNot = [...new Set([...prev.mustNot, ...mustNot])];
    const same =
      mergedTriggers.length === prev.triggers.length &&
      mergedMust.length === prev.mustInclude.length &&
      mergedNot.length === prev.mustNot.length &&
      prev.replyGuidance === guidance;
    if (same) return null;
    return {
      ...prev,
      version: prev.version + 1,
      parent: prev.version,
      triggers: mergedTriggers.slice(0, 16),
      mustInclude: mergedMust,
      mustNot: mergedNot,
      replyGuidance: guidance,
      rootCause: `held-out ${prompt.id} failed: ${failedChecks.join('; ')} (upgrade v${prev.version + 1})`,
      body: prev.body,
    };
  }

  const skill: SkillPatch = {
    id,
    version: 1,
    kind: 'site-agent',
    parent: null,
    triggers: [...new Set(triggers)].slice(0, 16),
    mustInclude: [...new Set(mustInclude)],
    mustNot: [...new Set(mustNot)],
    replyGuidance: guidance,
    rootCause: `held-out ${prompt.id} failed: ${failedChecks.join('; ')}`,
    body: `# Skill ${id}

## trigger
${prompt.prompt}

## root_cause
${failedChecks.join('\n')}

## rule
Follow reply_guidance. Never invent private facts.
`,
  };
  return skill;
}

export function skillMarkdown(skill: SkillPatch): string {
  return serializeSkillMarkdown(skill);
}
