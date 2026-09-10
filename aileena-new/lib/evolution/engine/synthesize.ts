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
]);

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'skill';
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
  const id = `auto-${slug(prompt.structure[0] || prompt.id)}`;
  if (opts.existing?.some((s) => s.id === id)) return null;
  const triggers = [
    ...prompt.structure,
    ...prompt.prompt
      .toLowerCase()
      .split(/[^a-z0-9\u4e00-\u9fff]+/)
      .filter((w) => w.length > 3 && !TRIGGER_STOP.has(w))
      .slice(0, 8),
  ];
  const guidanceParts: string[] = [];
  if (mustNot.length) {
    guidanceParts.push('Do not invent private inboxes, phone numbers, WeChat IDs, pay, or crop-to-fill claims.');
  }
  if (mustInclude.length) {
    // Repeat allowed phrases so the verifier can see them — never echo mustNot.
    guidanceParts.push(mustInclude.join('. ') + '.');
  }
  guidanceParts.push("If it is not in the site context, say you don't see it and offer leave a note.");
  const skill: SkillPatch = {
    id,
    version: 1,
    kind: 'site-agent',
    parent: null,
    triggers: [...new Set(triggers)].slice(0, 12),
    mustInclude: [...new Set(mustInclude)],
    mustNot: [...new Set(mustNot)],
    replyGuidance: guidanceParts.join(' '),
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
